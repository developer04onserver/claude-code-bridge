# Claude Code Bridge CLI

The CLI connects your computer to a deployed Claude Code Bridge Worker. It stores the Worker URL and bearer token in a local configuration file, starts the local Claude Code MCP server, and maintains an outbound WebSocket connection.

## Requirements

- Node.js 20 or newer
- Claude Code CLI installed and authenticated
- A deployed Claude Code Bridge Worker and its bearer token

## Install from a local checkout

Until the package is published to npm, install it from the repository:

```bash
git clone https://github.com/developer04onserver/claude-code-bridge.git
cd claude-code-bridge/packages/cli
npm install
npm link
```

This exposes both `ccb` and `claude-code-bridge` commands on your PATH.

## Configure

Run:

```bash
ccb init
```

Paste the Worker MCP URL, for example `https://my-bridge.workers.dev/mcp`, and the same bearer token configured as the Worker secret `BRIDGE_TOKEN`. The CLI derives the WebSocket endpoint automatically by replacing the path with `/agent`.

You can also configure non-interactively:

```bash
ccb init --url https://my-bridge.workers.dev/mcp --token YOUR_LONG_RANDOM_TOKEN
```

Avoid putting tokens in shell history or shared terminal logs. Prefer the hidden interactive prompt. The configuration file is stored under your user configuration directory and is restricted to the current user where the operating system supports POSIX file permissions.

## Verify and connect

```bash
ccb doctor
ccb start
```

Keep `ccb start` running while you use the remote MCP client. It launches `claude mcp serve` locally and connects to the Worker using outbound WSS; no inbound port forwarding is required.

In the remote MCP client, configure the MCP URL as `https://my-bridge.workers.dev/mcp` and use bearer authentication with the same token.

## Commands

| Command | Description |
| --- | --- |
| `ccb init` | Save Worker URL and token |
| `ccb doctor` | Check configuration and Claude Code CLI availability |
| `ccb start` | Start local MCP server and bridge connection |
| `ccb config` | Show saved endpoints without revealing the token |
| `ccb --help` | Show command help |

## Configuration

Default path:

- Windows: `%APPDATA%\\claude-code-bridge\\config.json`
- macOS/Linux: `~/.config/claude-code-bridge/config.json`

Override with `CLAUDE_CODE_BRIDGE_CONFIG`. The token is stored locally because the agent needs it to authenticate to the Worker. Do not share this file or commit it to a repository.

## Important behavior

This CLI exposes the local `claude mcp serve` process through the bridge. It does not attach to or mirror an already-open Claude Code Desktop conversation, VS Code conversation, or GUI session. It is a single-agent connection and should be treated as remote access to local development tools.

The Worker currently implements a minimal JSON-RPC request/response relay, not the complete MCP Streamable HTTP session and SSE lifecycle. Verify compatibility with your chosen remote MCP client before production use.
