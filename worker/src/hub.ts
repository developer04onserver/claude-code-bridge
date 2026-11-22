export class BridgeHub {
  private state: DurableObjectState;
  private env: { BRIDGE_TOKEN: string };
  private agent: WebSocket | null = null;
  private pending = new Map<string, { resolve: (value: unknown) => void; timer: ReturnType<typeof setTimeout> }>();

  constructor(state: DurableObjectState, env: { BRIDGE_TOKEN: string }) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/dispatch") {
      if (request.headers.get("x-bridge-internal") !== this.env.BRIDGE_TOKEN) return new Response("Unauthorized", { status: 401 });
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      if (!this.agent || this.agent.readyState !== WebSocket.OPEN) {
        return Response.json({ jsonrpc: "2.0", error: { code: -32000, message: "Local Claude Code agent is offline. Start the local agent first." }, id: null }, { status: 503 });
      }
      const payload = await request.json() as { id?: string | number | null };
      if (payload.id === undefined || payload.id === null) {
        this.agent.send(JSON.stringify(payload));
        return new Response(null, { status: 202 });
      }
      const key = String(payload.id);
      if (this.pending.has(key)) return Response.json({ jsonrpc: "2.0", error: { code: -32001, message: "Duplicate in-flight request id" }, id: payload.id }, { status: 409 });
      const result = await new Promise<unknown>((resolve) => {
        const timer = setTimeout(() => {
          this.pending.delete(key);
          resolve({ jsonrpc: "2.0", error: { code: -32002, message: "Local agent response timed out" }, id: payload.id });
        }, 110000);
        this.pending.set(key, { resolve, timer });
        try { this.agent!.send(JSON.stringify(payload)); }
        catch {
          clearTimeout(timer);
          this.pending.delete(key);
          resolve({ jsonrpc: "2.0", error: { code: -32000, message: "Could not reach local agent" }, id: payload.id });
        }
      });
      return Response.json(result);
    }

    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return new Response("WebSocket upgrade required", { status: 426 });
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    if (this.agent && this.agent.readyState === WebSocket.OPEN) this.agent.close(1012, "Replaced by a new agent connection");
    this.agent = server;
    server.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(String(event.data)) as { id?: string | number; method?: string };
        if (message.id !== undefined) {
          const item = this.pending.get(String(message.id));
          if (item) {
            clearTimeout(item.timer);
            this.pending.delete(String(message.id));
            item.resolve(message);
          }
        }
      } catch { /* Ignore malformed agent frames. */ }
    });
    const clear = () => {
      if (this.agent === server) this.agent = null;
      for (const [key, item] of this.pending) {
        clearTimeout(item.timer);
        item.resolve({ jsonrpc: "2.0", error: { code: -32000, message: "Local agent disconnected" }, id: key });
        this.pending.delete(key);
      }
    };
    server.addEventListener("close", clear);
    server.addEventListener("error", clear);
    return new Response(null, { status: 101, webSocket: client });
  }
}
