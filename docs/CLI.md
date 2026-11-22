# CLI Reference

## Install

Install directly from the public GitHub repository with npm:

```bash
npm install --global github:developer04onserver/claude-code-bridge
```

The root package manifest defines the CLI executable and includes only its runtime files in the npm package payload. The package is prepared for registry publication under `claude-code-bridge-cli`, but no npm registry release has been made yet.

## First-time setup

1. Deploy the Worker and create its `BRIDGE_TOKEN` secret.
2. Run `ccb init` on the computer that will host Claude Code.
3. Enter the Worker URL ending in `/mcp`.
4. Enter the same bearer token used by the Worker.
5. Run `ccb doctor`.
6. Run `ccb start` and keep it running.

The CLI derives `wss://WORKER_HOST/agent` from the HTTPS MCP URL.

## Commands

- `ccb init`: store endpoint and token; interactive token entry is masked.
- `ccb doctor`: check config and Claude Code executable availability. It does not prove a full MCP round trip.
- `ccb start`: start `claude mcp serve` and the authenticated outbound WebSocket. Stop with Ctrl+C.
- `ccb config`: display endpoint settings without printing the token.

## Security

Treat the bearer token as a password. The configuration file is stored in the user's configuration directory and restricted to the current user where POSIX permissions apply. Do not commit or share it. Anyone possessing the token may be able to invoke tools exposed by the bridge.

## Scope

The CLI exposes the local `claude mcp serve` process; it does not mirror an existing Claude Code Desktop or VS Code conversation. The Worker remains a minimal single-agent request/response relay without the full MCP Streamable HTTP session and SSE lifecycle.
