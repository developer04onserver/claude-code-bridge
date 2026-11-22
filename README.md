# Claude Code Bridge

![Architecture](assets/architecture.svg)

**Connect a remote MCP client to the Claude Code MCP server running on your own computer, using Cloudflare Workers as a secure relay.**

[Architecture](docs/ARCHITECTURE.md) · [Deployment](docs/DEPLOYMENT.md) · [CLI Guide](docs/CLI.md) · [Protocol](docs/PROTOCOL.md) · [Security](SECURITY.md)

## Overview

Claude Code Bridge relays remote MCP requests through a Cloudflare Worker and an outbound WebSocket connection to a local CLI agent. The local agent launches `claude mcp serve` and forwards JSON-RPC messages over stdio. Claude Code and your project files remain on your computer.

## Architecture

```text
Remote MCP client -- HTTPS + Bearer --> Cloudflare Worker (/mcp)
                                           |
                                      Durable Object
                                           |
                                    outbound WebSocket
                                           |
Local CLI: ccb start -- stdio --> claude mcp serve --> local tools
```

## Repository contents

| Path | Purpose |
| --- | --- |
| `worker/` | Cloudflare Worker and Durable Object relay |
| `agent/` | Original local Node.js WebSocket-to-stdio agent |
| `packages/cli/` | Installable CLI package (`ccb`) |
| `docs/` | Architecture, deployment, protocol, CLI and troubleshooting |
| `assets/` | Architecture and component SVG illustrations |

## Quick start

### Requirements

- Cloudflare account with Workers and Durable Objects.
- Node.js 20+ and npm.
- Claude Code CLI installed and authenticated.
- A remote MCP client supporting HTTP MCP and bearer authentication.

### 1. Deploy the Worker

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put BRIDGE_TOKEN
npx wrangler deploy
```

Save the deployed Worker hostname. Your MCP URL is `https://YOUR-WORKER.workers.dev/mcp`.

### 2. Install the local CLI

The CLI package is included in this repository and is prepared for npm publication. Until it is published, install it from a local checkout:

```bash
git clone https://github.com/developer04onserver/claude-code-bridge.git
cd claude-code-bridge/packages/cli
npm install
npm link
```

### 3. Connect your computer

On the computer where Claude Code is installed, run:

```bash
ccb init
ccb doctor
ccb start
```

Enter your Worker MCP URL and the same token configured as `BRIDGE_TOKEN`. The CLI automatically derives the WebSocket endpoint ending in `/agent`, saves the configuration, and starts the local `claude mcp serve` process. Keep `ccb start` running.

The connection is outbound WSS. You do not need to open an inbound port or configure router port forwarding.

### 4. Connect a remote MCP client

In the remote MCP client's connector settings, configure:

- **Server URL:** `https://YOUR-WORKER.workers.dev/mcp`
- **Authentication:** Bearer token
- **Token:** the same value used for `BRIDGE_TOKEN`

Claude Web's availability of custom remote MCP connectors and its authentication options can vary by product, account, and rollout. If the setting is unavailable, use another MCP client that supports remote HTTP MCP.

## CLI commands

| Command | Purpose |
| --- | --- |
| `ccb init` | Configure Worker URL and token |
| `ccb doctor` | Check local setup |
| `ccb start` | Start the bridge connection |
| `ccb config` | Show endpoints without revealing the token |

See [CLI documentation](docs/CLI.md) for detailed instructions.

## Security and limitations

This bridge can expose powerful local development tools to whoever possesses the bearer token. Use a long random secret, HTTPS/WSS, a restricted local OS account, and Claude Code's permission controls. Never commit configuration files or paste tokens into issues.

The CLI connects to the local `claude mcp serve` process. It does not attach to an already-open Claude Code Desktop or VS Code conversation. The initial Worker implementation is a single-agent request/response relay and does not implement the full Streamable HTTP session lifecycle, SSE, or resumable sessions. Review [SECURITY.md](SECURITY.md) and [protocol limitations](docs/PROTOCOL.md) before production use.

## License

MIT — see [LICENSE](LICENSE).
