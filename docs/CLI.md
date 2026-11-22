# CLI Reference

## Purpose

The `ccb` executable is the supported local setup and runtime entry point for Claude Code Bridge. It replaces manual environment-variable setup and direct execution of the agent source.

## Installation

For development from this repository:

```bash
git clone https://github.com/developer04onserver/claude-code-bridge.git
cd claude-code-bridge/packages/cli
npm install
npm link
```

The package is prepared for npm publication as `claude-code-bridge-cli`; it is not published by this repository change. Once published, the intended installation command is:

```bash
npm install --global claude-code-bridge-cli
```

## First-time setup

1. Deploy the Worker and create its `BRIDGE_TOKEN` secret.
2. Run `ccb init` on the computer that will host Claude Code.
3. Enter the Worker URL ending in `/mcp`.
4. Enter the same bearer token used by the Worker.
5. Run `ccb doctor` to check local prerequisites.
6. Run `ccb start` and keep it running.

The CLI derives `wss://WORKER_HOST/agent` from the HTTPS MCP URL. It does not ask the user to construct the WebSocket URL manually.

## Commands

### `ccb init`

Creates the configuration directory and writes the endpoint, token, and Claude executable name. On POSIX systems, the config file is chmod 0600. Interactive token entry does not echo typed characters.

Options:

- `--url`: Worker MCP endpoint.
- `--token`: token value; avoid this option on shared systems because command arguments may be visible in process listings and shell history.

### `ccb doctor`

Checks that the config exists and that the configured Claude executable responds to `--version`. It does not prove the Worker is reachable or that an MCP round-trip succeeds.

### `ccb start`

Starts the local `claude mcp serve` child process and the authenticated outbound WebSocket connection. The agent retries the WebSocket connection after disconnects. Stop with Ctrl+C.

### `ccb config`

Displays saved URLs and config path, but never prints the token.

## Security notes

- Treat the bearer token as a password.
- Do not commit the config file.
- Use a unique, high-entropy token.
- Anyone with the token may be able to invoke the local tools exposed by the bridge.
- The CLI does not bypass Claude Code's local permissions or grant a GUI session API.
