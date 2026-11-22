# Contributing

Thanks for helping improve Claude Code Bridge.

## Workflow

1. Open an issue for significant changes.
2. Keep pull requests focused and explain protocol or configuration changes.
3. Never commit tokens, credentials, local paths, or private project data.
4. Run the agent syntax check and Worker typecheck.
5. Update documentation for user-visible changes.

## Engineering expectations

- Keep protocol messages on stdout and diagnostics on stderr.
- Validate network input and handle disconnects explicitly.
- Never log bearer tokens.
- Preserve MCP JSON-RPC compatibility.
- Prefer small modules with explicit responsibilities.

## Pull request checklist

- [ ] Documentation updated.
- [ ] No secrets committed.
- [ ] Error paths considered.
- [ ] Agent syntax check passes.
- [ ] Worker typecheck passes.
