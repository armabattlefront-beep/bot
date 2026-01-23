// rconClient.js
const { Rcon } = require("rcon-client");

let rcon;
let isConnected = false;

const RCON_CONFIG = {
  host: "136.243.133.169",      // <-- fill this
  port: 5002,                  // <-- your RCON port
  password: "mbQYk3oQ59kW", // <-- your password
};

async function connectRcon() {
  if (isConnected) return rcon;

  try {
    rcon = new Rcon(RCON_CONFIG);
    await rcon.connect();
    isConnected = true;
    console.log("✅ RCON connected");

    rcon.on("end", () => {
      console.warn("⚠️ RCON disconnected, reconnecting...");
      isConnected = false;
      setTimeout(connectRcon, 5000);
    });

    rcon.on("error", (err) => {
      console.error("❌ RCON Error:", err.message);
    });

    return rcon;
  } catch (err) {
    console.error("❌ RCON Connection failed:", err.message);
    setTimeout(connectRcon, 5000); // retry in 5 sec
  }
}

async function sendRconCommand(cmd) {
  try {
    const client = await connectRcon();
    const res = await client.send(cmd);
    return res;
  } catch (err) {
    console.error("❌ RCON command failed:", err.message);
    return null;
  }
}

module.exports = { connectRcon, sendRconCommand };
