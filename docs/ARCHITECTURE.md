# Architecture

## Components

### Cloudflare Worker

The public entry point. It authenticates the bearer token and routes MCP requests to one Durable Object instance.

### Durable Object

Owns the active WebSocket connection and correlates JSON-RPC request IDs. It waits for the matching response and applies a timeout. It also returns a clear error when no local agent is connected.

### Local agent

The Node.js process initiates an outbound WebSocket connection. It starts Claude Code's MCP server as a child process and relays messages between WebSocket frames and stdio.

### Claude Code MCP server

The command `claude mcp serve` exposes Claude Code capabilities through MCP over stdio. This project delegates tool behavior and local permission behavior to Claude Code rather than reimplementing filesystem or shell tools.

## Trust boundaries

1. Remote MCP client to Worker: bearer-token authenticated HTTPS.
2. Worker to Durable Object: Cloudflare service binding.
3. Local agent to Worker: bearer-token authenticated WSS.
4. Agent to Claude Code: local child-process stdio.

The shared token is not a user identity system. A hardened multi-user deployment needs per-user identities, per-agent routing, rate limits, explicit authorization, and audit logging.

## Availability

The local agent must be running for tool calls to succeed. Durable Objects coordinate the connection but do not host the local development environment.
