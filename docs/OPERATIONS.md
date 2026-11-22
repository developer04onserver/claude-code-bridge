# Operations

## Startup order

1. Deploy the Worker and set the token secret.
2. Confirm the Worker health endpoint responds.
3. Start Claude Code locally and verify `claude mcp serve` works.
4. Start the agent with the Worker URL and shared token.
5. Connect the remote MCP client.

## Routine maintenance

- Keep the local machine awake while using the bridge.
- Update Claude Code and the bridge deliberately; verify compatibility after updates.
- Rotate the shared secret if a device is lost or credentials are exposed.
- Review Cloudflare Worker logs and local agent stderr when diagnosing failures.
- Do not treat the public health endpoint as proof that the local process is connected.

## Recovery

If the local agent crashes, restart it. The Worker will return an offline or timeout error while no local connection is available. A replacement agent connection supersedes the prior socket.
