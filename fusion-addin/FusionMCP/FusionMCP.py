import adsk.core
import adsk.fusion
import traceback
import json

from .server import JsonRpcServer
from .executor import CommandExecutor

# Global references to prevent garbage collection
_app = None
_ui = None
_server = None
_executor = None
_custom_event = None
_custom_event_handler = None

CUSTOM_EVENT_ID = "FusionMCP_ExecuteCommand"


class ExecuteCommandHandler(adsk.core.CustomEventHandler):
    """Handles commands dispatched from the TCP server thread to the main UI thread."""

    def __init__(self):
        super().__init__()

    def notify(self, args):
        try:
            event_args = json.loads(args.additionalInfo)
            request_id = event_args["id"]
            method = event_args["method"]
            params = event_args.get("params", {})

            result = _executor.execute(method, params)

            response = {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": result,
            }
        except Exception as e:
            response = {
                "jsonrpc": "2.0",
                "id": event_args.get("id", None),
                "error": {
                    "code": -32001,
                    "message": str(e),
                    "data": traceback.format_exc(),
                },
            }

        # Send response back to the TCP server thread
        if _server:
            _server.send_response(request_id, response)


def run(context):
    global _app, _ui, _server, _executor, _custom_event, _custom_event_handler

    try:
        _app = adsk.core.Application.get()
        _ui = _app.userInterface

        # Create the command executor
        _executor = CommandExecutor(_app)

        # Register custom event for thread-safe dispatch
        _custom_event = _app.registerCustomEvent(CUSTOM_EVENT_ID)
        _custom_event_handler = ExecuteCommandHandler()
        _custom_event.add(_custom_event_handler)

        # Start the TCP server on a background thread
        _server = JsonRpcServer(
            host="127.0.0.1",
            port=8765,
            app=_app,
            custom_event_id=CUSTOM_EVENT_ID,
        )
        _server.start()

        _ui.messageBox("FusionMCP add-in started.\nListening on 127.0.0.1:8765")

    except Exception:
        if _ui:
            _ui.messageBox(f"FusionMCP failed to start:\n{traceback.format_exc()}")


def stop(context):
    global _app, _ui, _server, _executor, _custom_event, _custom_event_handler

    try:
        if _server:
            _server.stop()
            _server = None

        if _custom_event:
            _app.unregisterCustomEvent(CUSTOM_EVENT_ID)
            _custom_event = None
            _custom_event_handler = None

        _executor = None

    except Exception:
        if _ui:
            _ui.messageBox(f"FusionMCP failed to stop:\n{traceback.format_exc()}")
