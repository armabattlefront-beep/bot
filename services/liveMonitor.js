// services/liveMonitor.js
const { EmbedBuilder } = require("discord.js");
const { getAllStreamers } = require("../database/streamers");
const config = require("../config");
const { getTwitchToken, refreshTwitchToken } = require("./twitchToken");

// ----------------------
// AUTO INSTALL AXIOS (v1.6.6, CommonJS safe)
// ----------------------
let axios;
try {
  axios = require("axios");
} catch {
  console.log("📦 Axios not found, installing v1.6.6...");
  const { execSync } = require("child_process");
  execSync("npm install axios@1.6.6", { stdio: "inherit" });
  axios = require("axios");
}

// ----------------------
// LIVE CACHE
// ----------------------
const liveCache = new Set();

// ----------------------
// CHECK STREAMERS
// ----------------------
async function checkTwitch(streamer) {
  if (!config.TWITCH_CLIENT_ID) return null;

  // ensure token is valid
  const token = getTwitchToken() || (await refreshTwitchToken());
  if (!token) return null;

  try {
    const res = await axios.get(
      `https://api.twitch.tv/helix/streams?user_id=${streamer.id}`,
      {
        headers: {
          "Client-ID": config.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res.data.data.length ? res.data.data[0] : null;
  } catch (err) {
    console.error("Twitch check failed:", err.message);
    return null;
  }
}

async function checkYouTube(streamer) {
  if (!config.YOUTUBE_API_KEY) return null;
  try {
    const res = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${streamer.id}&eventType=live&type=video&key=${config.YOUTUBE_API_KEY}`
    );
    return res.data.items.length ? res.data.items[0] : null;
  } catch (err) {
    console.error("YouTube check failed:", err.message);
    return null;
  }
}

async function checkTikTok(streamer) {
  try {
    const url = `https://www.tiktok.com/@${streamer.name}?lang=en`;
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });

    const match = res.data.match(/"isLiveStream":(true|false)/);
    if (match && match[1] === "true") return { live: true };
    return null;
  } catch (err) {
    console.error("TikTok check failed for", streamer.name, err.message);
    return null;
  }
}

// ----------------------
// MAIN LOOP
// ----------------------
async function checkStreams(client) {
  const streamers = getAllStreamers();
  const channel = client.channels.cache.get(config.LIVE_ANNOUNCE_CHANNEL_ID);
  if (!channel) return console.warn("⚠️ Live announce channel not found.");

  const guilds = client.guilds.cache;

  for (const streamer of streamers) {
    let liveData = null;

    if (streamer.platform === "twitch") liveData = await checkTwitch(streamer);
    if (streamer.platform === "youtube") liveData = await checkYouTube(streamer);
    if (streamer.platform === "tiktok") liveData = await checkTikTok(streamer);

    // REMOVE ROLE IF NOT LIVE
    if (!liveData) {
      liveCache.delete(streamer.id);

      for (const guild of guilds.values()) {
        const member = guild.members.cache.find(
          (m) => m.user.username.toLowerCase() === streamer.name.toLowerCase()
        );
        if (member && member.roles.cache.has(config.LIVE_ROLE_ID)) {
          member.roles.remove(config.LIVE_ROLE_ID).catch(() => {});
        }
      }
      continue;
    }

    // SKIP ALREADY ANNOUNCED
    if (liveCache.has(streamer.id)) continue;
    liveCache.add(streamer.id);

    // ADD ROLE
    for (const guild of guilds.values()) {
      const member = guild.members.cache.find(
        (m) => m.user.username.toLowerCase() === streamer.name.toLowerCase()
      );
      if (member && !member.roles.cache.has(config.LIVE_ROLE_ID)) {
        member.roles.add(config.LIVE_ROLE_ID).catch(() => {});
      }
    }

    // BUILD EMBED
    let streamUrl =
      streamer.platform === "twitch"
        ? `https://twitch.tv/${streamer.name}`
        : streamer.platform === "youtube"
        ? `https://youtube.com/channel/${streamer.id}`
        : `https://www.tiktok.com/@${streamer.name}?lang=en`;

    const embed = new EmbedBuilder()
      .setTitle(`🔴 ${streamer.name} is LIVE`)
      .setDescription(`[Watch the stream here](${streamUrl})`)
      .setColor(0xff0000)
      .setFooter({ text: "BattleFront Madness Creator Team" })
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
    console.log(`LIVE DETECTED: ${streamer.name} (${streamer.platform})`);
  }
}

// ----------------------
// START MONITOR
// ----------------------
function startLiveMonitor(client) {
  console.log("📡 Live monitor started");
  checkStreams(client); // run immediately
  setInterval(() => checkStreams(client), 60000); // check every 60s
}

module.exports = { startLiveMonitor };