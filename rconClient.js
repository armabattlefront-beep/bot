const { UDP_RCON } = require("@hidev/udp-rcon");

let rcon = null;
let isConnected = false;
let commandQueue = [];

// =========================
// RCON CONFIG
// =========================
const RCON_HOST = process.env.RCON_HOST || "136.243.133.169";
const RCON_PORT = parseInt(process.env.RCON_PORT, 10) || 5002;
const RCON_PASSWORD = process.env.RCON_PASSWORD;

async function connectRcon() {
  if (isConnected && rcon) return rcon;

  try {
    console.log(`🔄 Connecting to UDP RCON (${RCON_HOST}:${RCON_PORT})...`);

    // Correct constructor from the package
    rcon = new UDP_RCON(RCON_HOST, RCON_PORT, RCON_PASSWORD);

    // UDP_RCON doesn’t “connect” like a TCP socket — you send immediately
    // So mark as connected right away
    isConnected = true;
    console.log("✅ UDP RCON ready");

    // Flush queued commands
    if (commandQueue.length > 0) {
      console.log(`📦 Flushing ${commandQueue.length} queued RCON command(s)`);
      const queue = [...commandQueue];
      commandQueue = [];
      for (const { cmd, resolve, reject } of queue) {
        try {
          const res = await sendRconNow(cmd);
          resolve(res);
        } catch (err) {
          reject(err);
        }
      }
    }

    return rcon;
  } catch (err) {
    console.error("❌ RCON startup failed:", err.message);
    isConnected = false;
    setTimeout(connectRcon, 5000);
  }
}

// Direct send logic using callbacks from the package
function sendRconNow(cmd) {
  return new Promise((resolve, reject) => {
    try {
      rcon.send(cmd, (msg) => {
        resolve(msg);
      }, (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Public send function with queue support
async function sendRconCommand(cmd, timeout = 10000) {
  return new Promise(async (resolve, reject) => {
    // If not connected yet, queue the command
    if (!isConnected || !rcon) {
      console.warn(`⚠️ RCON offline, queueing command: ${cmd}`);
      commandQueue.push({ cmd, resolve, reject });
      connectRcon(); // Attempt (re)connect
      return;
    }

    try {
      // Send immediately if rcon is ready
      const timer = setTimeout(() => reject(new Error("RCON command timed out")), timeout);
      const res = await sendRconNow(cmd);
      clearTimeout(timer);

      console.log(`📤 RCON > ${cmd}`);
      resolve(res);
    } catch (err) {
      console.error(`❌ RCON command failed: ${cmd} -`, err.message);
      reject(err);
    }
  });
}

module.exports = { connectRcon, sendRconCommand };
