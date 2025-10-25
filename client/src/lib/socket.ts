import { io, Socket } from "socket.io-client";

class SocketClient {
  private static instance: SocketClient;
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      // Connect to the Socket.IO server
      this.socket = io("http://localhost:3001", {
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        console.log("Socket.IO connected:", this.socket?.id);
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
        reject(error);
      });

      this.socket.on("disconnect", () => {
        console.log("Socket.IO disconnected");
      });

      // Forward all events to registered listeners
      this.socket.onAny((event, ...args) => {
        const listeners = this.listeners.get(event);
        if (listeners) {
          listeners.forEach((listener) => listener(...args));
        }
      });
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public emit(event: string, data: any): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit(event, data);
  }

  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

export default SocketClient.getInstance();