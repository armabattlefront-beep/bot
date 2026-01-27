const Rcon = require("@hidev/udp-rcon");

let rcon = null;
let isConnected = false;
let commandQueue = [];

const RCON_PORT = 5002;
const RCON_HOST = process.env.RCON_HOST || "136.243.133.169";
const RCON_PASSWORD = process.env.RCON_PASSWORD;

async function connectRcon() {
  if (isConnected && rcon) return rcon;

  try {
    console.log(`🔄 Connecting to UDP RCON (${RCON_HOST}:${RCON_PORT})...`);

    rcon = new Rcon(RCON_HOST, RCON_PORT, RCON_PASSWORD);

    await rcon.connect();
    isConnected = true;
    console.log("✅ UDP RCON ready");

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
    console.error("❌ RCON startup failed:", err.message);
    isConnected = false;
    setTimeout(connectRcon, 5000); // retry after 5s
  }
}

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

module.exports = {
  connectRcon,
  sendRconCommand
};
