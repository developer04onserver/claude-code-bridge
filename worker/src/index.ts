import { BridgeHub } from "./hub";

export { BridgeHub };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

function authorized(request: Request, env: Env): boolean {
  const value = request.headers.get("authorization") || "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : "";
  return Boolean(env.BRIDGE_TOKEN) && token.length > 0 && token === env.BRIDGE_TOKEN;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ name: "claude-code-bridge", status: "ok", transport: "mcp-http+websocket" });
    }

    if (url.pathname === "/agent") {
      if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return json({ error: "WebSocket upgrade required" }, 426);
      }
      return env.BRIDGE_HUB.get(env.BRIDGE_HUB.idFromName("primary")).fetch(request);
    }

    if (url.pathname === "/mcp") {
      if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);
      if (request.method === "GET") {
        return new Response("This MCP endpoint uses JSON-RPC POST requests.", { headers: { "content-type": "text/plain" } });
      }
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      let payload: unknown;
      try { payload = await request.json(); } catch { return json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }, 400); }
      const response = await env.BRIDGE_HUB.get(env.BRIDGE_HUB.idFromName("primary")).fetch("https://hub.internal/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json", "x-bridge-internal": env.BRIDGE_TOKEN },
        body: JSON.stringify(payload)
      });
      return new Response(response.body, { status: response.status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    }

    return json({ error: "Not found", endpoints: ["/health", "/mcp", "/agent"] }, 404);
  }
};

export interface Env {
  BRIDGE_TOKEN: string;
  BRIDGE_HUB: DurableObjectNamespace<BridgeHub>;
}
