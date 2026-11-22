# Local agent

The local agent opens an outbound WSS connection to the Worker and relays JSON-RPC messages to the local Claude Code MCP server.

## Install

```bash
npm install
```

## Configure

Set `BRIDGE_AGENT_URL` to the Worker `/agent` WebSocket URL and `BRIDGE_TOKEN` to the same secret configured on Cloudflare.

## Run

```bash
npm start
```

The agent starts `claude mcp serve` automatically. Ensure Claude Code is installed and authenticated in the same user environment.
