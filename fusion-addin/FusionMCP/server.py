import socket
import threading
import json
import traceback
import adsk.core


class JsonRpcServer:
    """TCP server that accepts JSON-RPC 2.0 requests and dispatches to Fusion 360 main thread."""

    def __init__(self, host: str, port: int, app: adsk.core.Application, custom_event_id: str):
        self.host = host
        self.port = port
        self.app = app
        self.custom_event_id = custom_event_id
        self._server_socket = None
        self._thread = None
        self._running = False
        self._client_socket = None
        self._client_lock = threading.Lock()
        self._responses = {}
        self._response_events = {}
        self._response_lock = threading.Lock()

    def start(self):
        """Start the TCP server on a background thread."""
        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop the TCP server."""
        self._running = False
        if self._client_socket:
            try:
                self._client_socket.close()
            except Exception:
                pass
        if self._server_socket:
            try:
                self._server_socket.close()
            except Exception:
                pass
        if self._thread:
            self._thread.join(timeout=5)

    def send_response(self, request_id, response: dict):
        """Called from the main thread to send a response back to the client."""
        with self._response_lock:
            self._responses[request_id] = response
            event = self._response_events.get(request_id)
            if event:
                event.set()

    def _run(self):
        """Main server loop running on background thread."""
        self._server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._server_socket.settimeout(1.0)

        try:
            self._server_socket.bind((self.host, self.port))
            self._server_socket.listen(1)
        except Exception as e:
            adsk.core.Application.get().log(f"FusionMCP: Failed to bind to {self.host}:{self.port}: {e}")
            return

        adsk.core.Application.get().log(f"FusionMCP: Listening on {self.host}:{self.port}")

        while self._running:
            try:
                self._server_socket.settimeout(1.0)
                client, addr = self._server_socket.accept()
                adsk.core.Application.get().log(f"FusionMCP: Client connected from {addr}")
                self._handle_client(client)
            except socket.timeout:
                continue
            except OSError:
                if self._running:
                    adsk.core.Application.get().log("FusionMCP: Server socket error")
                break

    def _handle_client(self, client_socket: socket.socket):
        """Handle a connected client, reading newline-delimited JSON-RPC messages."""
        with self._client_lock:
            self._client_socket = client_socket

        buffer = ""
        client_socket.settimeout(1.0)

        while self._running:
            try:
                data = client_socket.recv(65536)
                if not data:
                    break

                buffer += data.decode("utf-8")
                lines = buffer.split("\n")
                buffer = lines.pop()

                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    self._process_message(client_socket, line)

            except socket.timeout:
                continue
            except ConnectionError:
                break
            except Exception as e:
                adsk.core.Application.get().log(f"FusionMCP: Client error: {e}")
                break

        with self._client_lock:
            self._client_socket = None
        try:
            client_socket.close()
        except Exception:
            pass
        adsk.core.Application.get().log("FusionMCP: Client disconnected")

    def _process_message(self, client_socket: socket.socket, message: str):
        """Parse a JSON-RPC message and dispatch to the main thread."""
        try:
            request = json.loads(message)
        except json.JSONDecodeError as e:
            error_response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {e}"},
            }
            self._send(client_socket, error_response)
            return

        request_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        if not method:
            error_response = {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {"code": -32600, "message": "Invalid request: missing method"},
            }
            self._send(client_socket, error_response)
            return

        # Create an event to wait for the response
        response_event = threading.Event()
        with self._response_lock:
            self._response_events[request_id] = response_event

        # Fire CustomEvent to dispatch to main thread
        event_data = json.dumps({
            "id": request_id,
            "method": method,
            "params": params,
        })
        self.app.fireCustomEvent(self.custom_event_id, event_data)

        # Wait for response from main thread (with timeout)
        if response_event.wait(timeout=60):
            with self._response_lock:
                response = self._responses.pop(request_id, None)
                self._response_events.pop(request_id, None)

            if response:
                self._send(client_socket, response)
            else:
                error_response = {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "error": {"code": -32603, "message": "Internal error: no response"},
                }
                self._send(client_socket, error_response)
        else:
            with self._response_lock:
                self._responses.pop(request_id, None)
                self._response_events.pop(request_id, None)

            error_response = {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {"code": -32002, "message": "Request timed out waiting for Fusion 360"},
            }
            self._send(client_socket, error_response)

    def _send(self, client_socket: socket.socket, response: dict):
        """Send a JSON-RPC response to the client."""
        try:
            data = json.dumps(response) + "\n"
            client_socket.sendall(data.encode("utf-8"))
        except Exception as e:
            adsk.core.Application.get().log(f"FusionMCP: Failed to send response: {e}")
