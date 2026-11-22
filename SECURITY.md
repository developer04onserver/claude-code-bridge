# Security Policy

## Reporting a vulnerability

Do not publish credentials, exploit details, or private project data in a public issue. Use GitHub private vulnerability reporting when available.

## Important

This bridge can expose tools capable of reading or modifying files in the local Claude Code environment. Anyone with the bearer token may be able to invoke those tools through the MCP endpoint.

- Use a unique random token with at least 32 bytes of entropy.
- Use HTTPS/WSS in production.
- Never put the token in a URL query string or source control.
- Run the agent as a normal, non-administrator user.
- Restrict the local account and working directory where practical.
- Keep Claude Code permission controls enabled.
- Rotate exposed credentials immediately.

The first version has no independent approval UI, multi-user identity system, per-tool allowlist, or audit database.
