# Claude Code Bridge CLI

## Install

The CLI is installable directly from the repository:

```bash
npm install --global github:developer04onserver/claude-code-bridge
```

When the package is published to npm, the equivalent registry install will be:

```bash
npm install --global claude-code-bridge-cli
```

## Configure and connect

```bash
ccb init
ccb doctor
ccb start
```

During `ccb init`, enter the Worker MCP URL ending in `/mcp` and the same bearer token configured as the Worker secret `BRIDGE_TOKEN`. The CLI derives the `/agent` WebSocket URL automatically. Token entry is hidden in an interactive terminal.

Keep `ccb start` running while the remote MCP client uses the Worker. The CLI launches the local `claude mcp serve` process and maintains an outbound WSS connection. No inbound port forwarding is required.

## Commands

- `ccb init`: save Worker URL and token
- `ccb doctor`: check configuration and Claude Code CLI
- `ccb start`: start local MCP server and bridge connection
- `ccb config`: show saved endpoints without revealing the token
- `ccb --help`: show help

## Configuration

Windows: `%APPDATA%\\claude-code-bridge\\config.json`

macOS/Linux: `~/.config/claude-code-bridge/config.json`

The configuration file contains a bearer token. Do not share it or commit it. POSIX file permissions are restricted to the current user.

## Scope

This CLI connects to `claude mcp serve`. It does not attach to an already-open Claude Code Desktop or VS Code conversation. The Worker is a minimal single-agent request/response relay and does not implement the complete Streamable HTTP session/SSE lifecycle.
