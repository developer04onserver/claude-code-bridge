# Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| 401 Unauthorized | Token mismatch | Compare Worker secret and local environment |
| 426 Upgrade Required | Agent URL used as HTTP | Use WSS and the /agent path |
| Agent offline | Local process stopped | Restart npm start |
| Claude process exits | CLI missing or command unsupported | Run claude mcp serve locally |
| MCP tools missing | Client connector or protocol mismatch | Check remote MCP support and logs |
| Timeout | Slow tool or disconnected process | Inspect local terminal and retry carefully |

Never paste the bearer token into an issue or support request.
