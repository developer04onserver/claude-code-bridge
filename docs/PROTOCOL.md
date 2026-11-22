# Protocol

The public endpoint accepts MCP JSON-RPC messages through HTTP POST at `/mcp`. The local transport is a persistent WebSocket connection. The agent translates WebSocket text frames to newline-delimited JSON-RPC messages on the Claude Code MCP server's stdio.

The Durable Object correlates request IDs. Notifications without IDs are forwarded without waiting for a response.

This initial version is a minimal request/response relay. It does not implement the full Streamable HTTP session lifecycle, server-initiated streaming, SSE, or resumable sessions. Validate compatibility with the remote MCP client you intend to use before relying on it.
