# Deployment

## Cloudflare

1. Install Node.js 20+.
2. Enter the `worker` directory and run `npm install`.
3. Authenticate with `npx wrangler login`.
4. Set a high-entropy secret using `npx wrangler secret put BRIDGE_TOKEN`.
5. Deploy using `npx wrangler deploy`.
6. Save the generated Worker hostname.

The Durable Object binding and initial SQLite migration are declared in `worker/wrangler.toml`.

## Local computer

1. Install and authenticate Claude Code.
2. Verify `claude mcp serve` works in a terminal.
3. Enter `agent` and run `npm install`.
4. Set `BRIDGE_AGENT_URL` to the Worker `/agent` WebSocket URL.
5. Set `BRIDGE_TOKEN` to the same value used by Wrangler.
6. Run `npm start` and keep the process alive.

## Updating

Pull the latest source, review the changes, redeploy the Worker, and restart the local agent. Rotate credentials if the environment or token has been exposed.
