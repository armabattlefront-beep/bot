const { Rcon } = require("rcon-client");

let rcon = null;
let isConnected = false;
let isConnecting = false;
let commandQueue = [];

// =========================
// RCON CONFIG (SINGLE SOURCE)
// =========================
const RCON_PORT = 5002;

const RCON_CONFIG = {
  host: process.env.RCON_HOST || "136.243.133.169",
  port: RCON_PORT,
  password: process.env.RCON_PASSWORD,
  tcp: false,
  challenge: false
};

// Hard fail if someone tries to override the port
if (process.env.RCON_PORT && parseInt(process.env.RCON_PORT) !== RCON_PORT) {
  console.error("❌ RCON_PORT override detected. Port 5002 is mandatory.");
  process.exit(1);
}

// =========================
// CONNECT FUNCTION
// =========================
async function connectRcon() {
  if (isConnected && rcon) return rcon;
  if (isConnecting) return;

  isConnecting = true;
  console.log(`🔄 Connecting to RCON (${RCON_CONFIG.host}:${RCON_PORT})...`);

  try {
    rcon = new Rcon(RCON_CONFIG);

    rcon.on("connect", () => {
      console.log("🔌 RCON socket connected");
    });

    rcon.on("ready", () => {
      isConnected = true;
      isConnecting = false;
      console.log("✅ RCON ready (port 5002 confirmed)");
    });

    rcon.on("end", () => {
      console.warn("⚠️ RCON disconnected, retrying in 3s...");
      isConnected = false;
      isConnecting = false;
      setTimeout(connectRcon, 3000);
    });

    rcon.on("error", (err) => {
      console.error("❌ RCON error:", err.message);
    });

    await rcon.connect();

    // Flush queued commands
    if (commandQueue.length > 0) {
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

    return rcon;

  } catch (err) {
    console.error("❌ RCON connection failed:", err.message);
    isConnected = false;
    isConnecting = false;
    setTimeout(connectRcon, 5000);
  }
}

// =========================
// SEND COMMAND FUNCTION
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
      const client = await connectRcon();

      const timer = setTimeout(() => {
        reject(new Error("RCON command timed out"));
      }, timeout);

      const res = await client.send(cmd);
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
