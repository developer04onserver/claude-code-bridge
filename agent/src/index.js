import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import WebSocket from "ws";

const endpoint = process.env.BRIDGE_AGENT_URL;
const token = process.env.BRIDGE_TOKEN;
const claudeBin = process.env.CLAUDE_BIN || "claude";

if (!endpoint || !token) {
  console.error("Set BRIDGE_AGENT_URL and BRIDGE_TOKEN before starting the agent.");
  process.exit(1);
}
if (!endpoint.startsWith("wss://") && !endpoint.startsWith("ws://localhost")) {
  console.error("BRIDGE_AGENT_URL must use wss:// (ws:// is allowed only for localhost).");
  process.exit(1);
}

let child;
let socket;
let stopping = false;
let reconnectTimer;

function startClaudeMcp() {
  child = spawn(claudeBin, ["mcp", "serve"], {
    stdio: ["pipe", "pipe", "inherit"],
    env: process.env,
    windowsHide: true
  });
  const lines = createInterface({ input: child.stdout });
  lines.on("line", (line) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(line);
  });
  child.on("error", (error) => console.error("Could not start Claude Code MCP server:", error.message));
  child.on("exit", (code) => {
    console.error(`Claude Code MCP server exited with code ${code ?? "unknown"}`);
    if (!stopping) setTimeout(() => process.exit(1), 500);
  });
}

function connect() {
  if (stopping) return;
  socket = new WebSocket(endpoint, { headers: { Authorization: `Bearer ${token}` }, handshakeTimeout: 15000 });
  socket.on("open", () => console.error("Connected to Claude Code Bridge."));
  socket.on("message", (data) => {
    if (!child || child.stdin.destroyed) return;
    child.stdin.write(data.toString() + "\n");
  });
  socket.on("close", () => {
    console.error("Bridge connection closed; reconnecting in 3 seconds.");
    if (!stopping) reconnectTimer = setTimeout(connect, 3000);
  });
  socket.on("error", (error) => console.error("Bridge socket error:", error.message));
}

function shutdown() {
  stopping = true;
  clearTimeout(reconnectTimer);
  socket?.close();
  child?.kill("SIGTERM");
  setTimeout(() => process.exit(0), 300).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startClaudeMcp();
connect();
