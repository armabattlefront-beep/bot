const { UDP } = require("@hidev/udp-rcon");

let rcon = null;
let isConnected = false;
let isConnecting = false;
let commandQueue = [];

// =========================
// RCON CONFIG
// =========================
const RCON_HOST = process.env.RCON_HOST || "136.243.133.169";
const RCON_PORT = parseInt(process.env.RCON_PORT || "5002", 10);
const RCON_PASSWORD = process.env.RCON_PASSWORD;

if (!RCON_PASSWORD) {
  console.error("❌ RCON_PASSWORD is not set in .env");
  process.exit(1);
}

// =========================
// CONNECT FUNCTION
// =========================
async function connectRcon() {
  if (isConnected && rcon) return rcon;
  if (isConnecting) return;

  isConnecting = true;
  console.log(`🔄 Connecting to UDP RCON (${RCON_HOST}:${RCON_PORT})...`);

  rcon = new UDP({
    host: RCON_HOST,
    port: RCON_PORT,
    password: RCON_PASSWORD
  });

  rcon.on("authenticated", () => {
    isConnected = true;
    isConnecting = false;
    console.log(`✅ RCON connected and authenticated to ${RCON_HOST}:${RCON_PORT}`);
    flushQueue();
  });

  rcon.on("error", (err) => {
    console.error("❌ RCON error:", err.message);
  });

  rcon.on("close", () => {
    console.warn("⚠️ RCON disconnected, reconnecting in 3s...");
    isConnected = false;
    isConnecting = false;
    setTimeout(connectRcon, 3000);
  });

  try {
    await rcon.connect();
  } catch (err) {
    console.error("❌ RCON connection failed:", err.message);
    isConnected = false;
    isConnecting = false;
    setTimeout(connectRcon, 5000);
  }

  return rcon;
}

// =========================
// COMMAND QUEUE HANDLER
// =========================
async function flushQueue() {
  if (!commandQueue.length || !isConnected) return;
  console.log(`📦 Flushing ${commandQueue.length} queued RCON command(s)`);
  const queue = [...commandQueue];
  commandQueue = [];

  for (const { cmd, resolve, reject } of queue) {
    try {
      const res = await rcon.send(cmd);
      resolve(res);
    } catch (err) {
      reject(err);
    }
  }
}

// =========================
// SEND COMMAND
// =========================
async function sendRconCommand(cmd, timeout = 10000) {
  return new Promise(async (resolve, reject) => {
    if (!isConnected) {
      console.warn(`⚠️ RCON offline, queueing command: ${cmd}`);
      commandQueue.push({ cmd, resolve, reject });
      connectRcon();
      return;
    }

    try {
      const timer = setTimeout(() => {
        reject(new Error("RCON command timed out"));
      }, timeout);

      const res = await rcon.send(cmd);
      clearTimeout(timer);

      console.log(`📤 RCON > ${cmd}`);
      resolve(res);
    } catch (err) {
      console.error(`❌ RCON command failed: ${cmd}`, err.message);
      reject(err);
    }
  });
}

// =========================
// EXPORTS
// =========================
module.exports = {
  connectRcon,
  sendRconCommand
};
