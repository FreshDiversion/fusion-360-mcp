import net from "node:net";
import { JsonRpcRequest, JsonRpcResponse, ERROR_CODES } from "./types/messages.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8765;
const DEFAULT_TIMEOUT = 30000; // 30 seconds

interface PendingRequest {
  resolve: (value: JsonRpcResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class FusionBridge {
  private host: string;
  private port: number;
  private timeout: number;
  private socket: net.Socket | null = null;
  private connected = false;
  private pendingRequests = new Map<string | number, PendingRequest>();
  private nextId = 1;
  private buffer = "";
  private reconnecting = false;

  constructor(
    host: string = DEFAULT_HOST,
    port: number = DEFAULT_PORT,
    timeout: number = DEFAULT_TIMEOUT
  ) {
    this.host = host;
    this.port = port;
    this.timeout = timeout;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      this.socket.on("connect", () => {
        this.connected = true;
        this.reconnecting = false;
        this.buffer = "";
        console.error("[bridge] Connected to Fusion 360 add-in");
        resolve();
      });

      this.socket.on("data", (data) => {
        this.handleData(data);
      });

      this.socket.on("close", () => {
        this.connected = false;
        this.rejectAllPending("Connection closed");
        console.error("[bridge] Disconnected from Fusion 360 add-in");
      });

      this.socket.on("error", (err) => {
        if (!this.connected) {
          reject(new Error(`Failed to connect to Fusion 360 add-in at ${this.host}:${this.port}: ${err.message}`));
        } else {
          console.error(`[bridge] Socket error: ${err.message}`);
        }
      });

      this.socket.connect(this.port, this.host);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.connected = false;
      this.rejectAllPending("Bridge disconnected");
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.connected) {
      // Attempt auto-reconnect
      try {
        await this.connect();
      } catch {
        throw new Error(
          `Not connected to Fusion 360. Make sure the FusionMCP add-in is running in Fusion 360.`
        );
      }
    }

    const id = this.nextId++;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timed out after ${this.timeout}ms: ${method}`));
      }, this.timeout);

      this.pendingRequests.set(id, {
        resolve: (response: JsonRpcResponse) => {
          if (response.error) {
            reject(new Error(`Fusion API error: ${response.error.message} (code: ${response.error.code})`));
          } else {
            resolve(response.result);
          }
        },
        reject,
        timer,
      });

      const message = JSON.stringify(request) + "\n";
      this.socket!.write(message);
    });
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const response: JsonRpcResponse = JSON.parse(line);
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(response.id);
          pending.resolve(response);
        }
      } catch (err) {
        console.error(`[bridge] Failed to parse response: ${line}`);
      }
    }
  }

  private rejectAllPending(reason: string): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }
}
