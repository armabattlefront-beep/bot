const { UDP_RCON } = require("@hidev/udp-rcon");

let rcon = null;
let isConnected = false;
let commandQueue = [];

// =========================
// CONFIG
// =========================
const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = parseInt(process.env.RCON_PORT, 10) || 5002;
const RCON_PASSWORD = process.env.RCON_PASSWORD;

// =========================
// CONNECT FUNCTION
// =========================
function connectRcon() {
  if (rcon && isConnected) return rcon;

  rcon = new UDP_RCON(RCON_HOST, RCON_PORT, RCON_PASSWORD);

  rcon.on("connect", () => {
    console.log(`🔌 RCON UDP socket ready: ${RCON_HOST}:${RCON_PORT}`);
    isConnected = true;

    // Flush queued commands
    if (commandQueue.length > 0) {
      const queue = [...commandQueue];
      commandQueue = [];
      queue.forEach(({ cmd, resolve, reject }) => {
        sendRconCommand(cmd).then(resolve).catch(reject);
      });
    }
  });

  rcon.on("error", (err) => {
    console.error("❌ RCON UDP error:", err.message);
    isConnected = false;
  });

  rcon.on("end", () => {
    console.warn("⚠️ RCON UDP connection ended, reconnecting in 3s...");
    isConnected = false;
    setTimeout(connectRcon, 3000);
  });

  return rcon;
}

// =========================
// SEND COMMAND
// =========================
function sendRconCommand(cmd, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!isConnected) {
      console.warn(`⚠️ RCON offline, queueing command: ${cmd}`);
      commandQueue.push({ cmd, resolve, reject });
      connectRcon();
      return;
    }

    const timer = setTimeout(() => reject(new Error("RCON UDP command timed out")), timeout);

    try {
      rcon.send(cmd, (res) => {
        clearTimeout(timer);
        console.log(`📤 RCON UDP > ${cmd}`);
        resolve(res);
      }, (err) => {
        clearTimeout(timer);
        reject(err);
      });
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

// =========================
// EXPORT
// =========================
module.exports = { connectRcon, sendRconCommand };
