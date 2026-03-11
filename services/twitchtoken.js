const axios = require("axios");
const config = require("../config");

let currentToken = config.TWITCH_OAUTH_TOKEN;

async function refreshTwitchToken() {
  if (!config.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    console.warn("⚠️ Twitch credentials missing. Skipping token refresh.");
    return null;
  }

  try {
    const res = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${config.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
    );

    currentToken = res.data.access_token;
    console.log("✅ Twitch App Access Token refreshed");
    return currentToken;
  } catch (err) {
    console.error("❌ Failed to refresh Twitch token:", err.message);
    return null;
  }
}

function getTwitchToken() {
  return currentToken;
}

module.exports = { refreshTwitchToken, getTwitchToken };