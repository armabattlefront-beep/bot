const { Rcon } = require("rcon-client");

let rcon = null;
let isConnected = false;
let commandQueue = [];

// =========================
// RCON CONFIG
// =========================
const RCON_CONFIG = {
  host: process.env.RCON_HOST || "136.243.133.169",
  port: parseInt(process.env.RCON_PORT) || 5002,
  password: process.env.RCON_PASSWORD,
  tcp: true,
  challenge: false
};

// =========================
// CONNECT FUNCTION
// =========================
async function connectRcon() {
  if (isConnected && rcon) return rcon;

  console.log("🔄 Attempting RCON connection...");

  try {
    rcon = new Rcon(RCON_CONFIG);

    rcon.on("connect", () => console.log("🔌 RCON socket connected"));
    rcon.on("ready", () => console.log("✅ RCON ready"));
    rcon.on("end", () => {
      console.warn("⚠️ RCON disconnected, reconnecting in 3s...");
      isConnected = false;
      setTimeout(connectRcon, 3000);
    });
    rcon.on("error", (err) => console.error("❌ RCON Error:", err.message));

    await rcon.connect();
    isConnected = true;
    console.log("✅ RCON connected and ready");

    // Send queued commands
    if (commandQueue.length > 0) {
      console.log(`📦 Sending ${commandQueue.length} queued RCON command(s)`);
      const queue = [...commandQueue];
      commandQueue = [];
      for (const { cmd, resolve, reject } of queue) {
        try {
          const res = await rcon.send(cmd);
          console.log(`📤 Queued command sent: ${cmd}`);
          resolve(res);
        } catch (err) {
          console.error(`❌ Queued command failed: ${cmd} - ${err.message}`);
          reject(err);
        }
      }
    }

    return rcon;

  } catch (err) {
    console.error("❌ RCON connection failed:", err.message);
    setTimeout(connectRcon, 5000);
  }
}

// =========================
// SEND COMMAND FUNCTION
// =========================
async function sendRconCommand(cmd, timeout = 10000) {
  return new Promise(async (resolve, reject) => {
    // If disconnected, queue the command
    if (!isConnected) {
      console.warn(`⚠️ RCON not connected, queuing command: ${cmd}`);
      commandQueue.push({ cmd, resolve, reject });
      connectRcon(); // Ensure connection attempt
      return;
    }

    try {
      const client = await connectRcon();

      // Timeout safeguard
      const timer = setTimeout(() => {
        console.error(`⏱️ RCON command timeout: ${cmd}`);
        reject(new Error("RCON command timed out"));
      }, timeout);

      const res = await client.send(cmd);
      clearTimeout(timer);

      console.log(`✅ RCON command executed: ${cmd}`);
      resolve(res);

    } catch (err) {
      console.error(`❌ RCON command failed: ${cmd} - ${err.message}`);
      reject(err);
    }
  });
}

// =========================
// EXPORTS
// =========================
module.exports = { connectRcon, sendRconCommand };
