import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import WebSocket from "ws";

const endpoint = process.env.BRIDGE_AGENT_URL;
const token = process.env.BRIDGE_TOKEN;
const claudeBin = process.env.CLAUDE_BIN || "claude";

if (!endpoint || !token) {
  console.error("Bridge configuration is incomplete. Run ccb init.");
  process.exit(1);
}
if (!endpoint.startsWith("wss://") && !endpoint.startsWith("ws://localhost") && !endpoint.startsWith("ws://127.0.0.1")) {
  console.error("Agent URL must use wss:// for remote connections.");
  process.exit(1);
}

let child;
let socket;
let stopping = false;
let reconnectTimer;

function launchClaudeMcp() {
  child = spawn(claudeBin, ["mcp", "serve"], {
    stdio: ["pipe", "pipe", "inherit"],
    env: process.env,
    windowsHide: true
  });
  const lines = createInterface({ input: child.stdout });
  lines.on("line", (line) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(line);
  });
  child.on("error", (error) => {
    console.error("Cannot launch Claude Code MCP server:", error.message);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    console.error("Claude Code MCP server exited:", code ?? "unknown");
    if (!stopping) process.exit(code || 1);
  });
}

function connect() {
  if (stopping) return;
  socket = new WebSocket(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
    handshakeTimeout: 15000
  });
  socket.on("open", () => console.error("Connected to Claude Code Bridge."));
  socket.on("message", (data) => {
    if (child && !child.stdin.destroyed) child.stdin.write(data.toString() + "\n");
  });
  socket.on("close", () => {
    console.error("Bridge connection closed; retrying in 3 seconds.");
    if (!stopping) reconnectTimer = setTimeout(connect, 3000);
  });
  socket.on("error", (error) => console.error("Bridge WebSocket error:", error.message));
}

function shutdown() {
  if (stopping) return;
  stopping = true;
  clearTimeout(reconnectTimer);
  socket?.close();
  child?.kill("SIGTERM");
  setTimeout(() => process.exit(0), 500).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

launchClaudeMcp();
connect();
