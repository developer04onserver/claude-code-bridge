#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "1.1.0";
const here = dirname(fileURLToPath(import.meta.url));
const agentPath = join(here, "..", "src", "agent.js");
const configPath = process.env.CLAUDE_CODE_BRIDGE_CONFIG ||
  (process.env.APPDATA
    ? join(process.env.APPDATA, "claude-code-bridge", "config.json")
    : join(homedir(), ".config", "claude-code-bridge", "config.json"));

function help() {
  console.log(`
Claude Code Bridge CLI v${VERSION}

Usage:
  ccb init [--url https://host/mcp] [--token TOKEN]
  ccb start [--claude-bin PATH]
  ccb doctor
  ccb config
  ccb --version
  ccb --help

Commands:
  init     Save your Worker endpoint and access token securely
  start    Connect this computer and launch "claude mcp serve"
  doctor   Check local prerequisites and saved configuration
  config   Show configuration location and connection details (token hidden)

Environment:
  CLAUDE_CODE_BRIDGE_CONFIG  Override the configuration file path
`);
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function ask(label, { secret = false, defaultValue = "" } = {}) {
  if (!secret || !stdin.isTTY || typeof stdin.setRawMode !== "function") {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      const answer = await rl.question(label + (defaultValue ? ` [${defaultValue}]` : "") + ": ");
      return answer.trim() || defaultValue;
    } finally { rl.close(); }
  }
  stdout.write(label + ": ");
  stdin.setRawMode(true);
  stdin.resume();
  return await new Promise((resolve, reject) => {
    let value = "";
    const onData = (chunk) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\u0003") {
          cleanup(); stdout.write("\n"); reject(new Error("Cancelled.")); return;
        }
        if (char === "\r" || char === "\n") {
          cleanup(); stdout.write("\n"); resolve(value); return;
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    const cleanup = () => { stdin.off("data", onData); stdin.setRawMode(false); };
    stdin.on("data", onData);
  });
}

function agentUrlFromMcp(value) {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("MCP URL must use https:// (http:// is only suitable for local testing).");
  if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Use HTTPS for a public Worker URL.");
  return (url.protocol === "https:" ? "wss:" : "ws:") + "//" + url.host + "/agent";
}

async function loadConfig() {
  try {
    return JSON.parse(await readFile(configPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") throw new Error("No configuration found. Run: ccb init");
    throw new Error("Could not read configuration: " + error.message);
  }
}

async function init() {
  const mcpUrl = arg("--url") || await ask("Worker MCP URL (https://YOUR-WORKER.workers.dev/mcp)");
  const token = arg("--token") || process.env.BRIDGE_TOKEN || await ask("Bridge token", { secret: true });
  if (!mcpUrl || !token) throw new Error("Both Worker URL and token are required.");
  const agentUrl = agentUrlFromMcp(mcpUrl);
  const config = { mcpUrl, agentUrl, token, claudeBin: process.env.CLAUDE_BIN || "claude" };
  await mkdir(dirname(configPath), { recursive: true, mode: 0o700 });
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
  if (process.platform !== "win32") await chmod(configPath, 0o600);
  console.log("Configuration saved.");
  console.log("Agent endpoint: " + agentUrl);
  console.log("Next: ccb doctor");
}

async function doctor() {
  let config;
  try {
    config = await loadConfig();
    console.log("Configuration: OK (" + configPath + ")");
    console.log("Worker MCP URL: " + config.mcpUrl);
    console.log("Agent WebSocket: " + config.agentUrl);
    console.log("Token: " + (config.token ? "configured (hidden)" : "MISSING"));
  } catch (error) {
    console.error("Configuration: " + error.message);
    process.exitCode = 1;
    return;
  }
  const binary = arg("--claude-bin") || config.claudeBin || "claude";
  const result = spawnSync(binary, ["--version"], { encoding: "utf8", windowsHide: true });
  if (result.error) {
    console.error("Claude Code: NOT FOUND (" + result.error.message + ")");
    console.error("Install Claude Code and ensure its CLI is on PATH, or set CLAUDE_BIN.");
    process.exitCode = 1;
  } else if (result.status !== 0) {
    console.error("Claude Code: command failed: " + (result.stderr || "").trim());
    process.exitCode = 1;
  } else {
    console.log("Claude Code: " + (result.stdout || result.stderr).trim());
  }
  console.log("Worker reachability: not tested by doctor; start the agent and call an MCP tool to verify the full path.");
}

async function showConfig() {
  const config = await loadConfig();
  console.log("Config file: " + configPath);
  console.log("Worker MCP URL: " + config.mcpUrl);
  console.log("Agent WebSocket: " + config.agentUrl);
  console.log("Token: " + (config.token ? "configured (hidden)" : "missing"));
}

async function start() {
  const config = await loadConfig();
  const binary = arg("--claude-bin") || config.claudeBin || "claude";
  const child = spawn(process.execPath, [agentPath], {
    stdio: "inherit",
    env: { ...process.env, BRIDGE_AGENT_URL: config.agentUrl, BRIDGE_TOKEN: config.token, CLAUDE_BIN: binary },
    windowsHide: true
  });
  const stop = () => child.kill("SIGTERM");
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("error", (error) => { console.error("Could not start bridge agent:", error.message); process.exitCode = 1; });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
}

try {
  const command = process.argv[2];
  if (command === "init") await init();
  else if (command === "start") await start();
  else if (command === "doctor") await doctor();
  else if (command === "config") await showConfig();
  else if (command === "--version" || command === "-v") console.log(VERSION);
  else if (command === "--help" || command === "-h" || !command) help();
  else { console.error("Unknown command: " + command); help(); process.exitCode = 2; }
} catch (error) {
  console.error("Error: " + error.message);
  process.exitCode = 1;
}
