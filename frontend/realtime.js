class RealtimeClient {
  constructor({ baseUrl = "ws://127.0.0.1:8000", channel, onMessage, onStatus } = {}) {
    this.baseUrl = baseUrl;
    this.channel = channel;
    this.onMessage = onMessage || (() => {});
    this.onStatus = onStatus || (() => {});
    this.socket = null;
    this.shouldReconnect = true;
  }

  connect() {
    this.socket = new WebSocket(`${this.baseUrl}/ws/${encodeURIComponent(this.channel)}`);
    this.socket.addEventListener("open", () => this.onStatus("connected"));
    this.socket.addEventListener("message", event => {
      this.onMessage(JSON.parse(event.data));
    });
    this.socket.addEventListener("close", () => {
      this.onStatus("disconnected");
      if (this.shouldReconnect) {
        window.setTimeout(() => this.connect(), 1000);
      }
    });
    this.socket.addEventListener("error", () => this.onStatus("error"));
  }

  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket이 연결되지 않았습니다.");
    }
    this.socket.send(JSON.stringify(message));
  }

  close() {
    this.shouldReconnect = false;
    this.socket?.close();
  }
}