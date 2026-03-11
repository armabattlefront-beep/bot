const { EmbedBuilder } = require("discord.js");
const { getAllStreamers } = require("../database/streamers");
const config = require("../config");

// Auto-load/install axios
let axios;
try {
  axios = require("axios");
} catch {
  console.log("📦 Axios not found, installing...");
  const { execSync } = require("child_process");
  execSync("npm install axios", { stdio: "inherit" });
  axios = require("axios");
}

// Cache to prevent duplicate announcements
const liveCache = new Set();

// ----------------------
// PLATFORM CHECKS
// ----------------------
async function checkTwitch(streamer) {
  if (!config.TWITCH_CLIENT_ID || !config.TWITCH_OAUTH_TOKEN) return null;
  try {
    const res = await axios.get(
      `https://api.twitch.tv/helix/streams?user_id=${streamer.platformId}`,
      {
        headers: {
          "Client-ID": config.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${config.TWITCH_OAUTH_TOKEN}`
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
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${streamer.platformId}&eventType=live&type=video&key=${config.YOUTUBE_API_KEY}`
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

  if (!channel) {
    console.warn("⚠️ Live announce channel not found.");
    return;
  }

  for (const streamer of streamers) {
    let liveData = null;

    if (streamer.platform === "twitch") liveData = await checkTwitch(streamer);
    if (streamer.platform === "youtube") liveData = await checkYouTube(streamer);
    if (streamer.platform === "tiktok") liveData = await checkTikTok(streamer);

    // Remove from cache & remove role if not live
    if (!liveData) {
      liveCache.delete(streamer.discordId);

      const guilds = client.guilds.cache;
      for (const guild of guilds.values()) {
        const member = guild.members.cache.get(streamer.discordId);
        if (member && member.roles.cache.has(config.LIVE_ROLE_ID)) {
          member.roles.remove(config.LIVE_ROLE_ID).catch(console.error);
        }
      }
      continue;
    }

    // Skip if already announced
    if (liveCache.has(streamer.discordId)) continue;
    liveCache.add(streamer.discordId);

    // Assign role
    const guilds = client.guilds.cache;
    for (const guild of guilds.values()) {
      const member = guild.members.cache.get(streamer.discordId);
      if (member && !member.roles.cache.has(config.LIVE_ROLE_ID)) {
        member.roles.add(config.LIVE_ROLE_ID).catch(console.error);
      }
    }

    // Build stream URL
    let streamUrl;
    if (streamer.platform === "twitch") streamUrl = `https://twitch.tv/${streamer.name}`;
    if (streamer.platform === "youtube") streamUrl = `https://youtube.com/channel/${streamer.platformId}`;
    if (streamer.platform === "tiktok") streamUrl = `https://www.tiktok.com/@${streamer.name}?lang=en`;

    const embed = new EmbedBuilder()
      .setTitle(`🔴 ${streamer.name} is LIVE`)
      .setDescription(`[Watch the stream here](${streamUrl})`)
      .setColor(0xff0000)
      .setFooter({ text: "BattleFront Madness Creator Team" })
      .setTimestamp();

    channel.send({ embeds: [embed] });
    console.log(`LIVE DETECTED: ${streamer.name} (${streamer.platform})`);
  }
}

// ----------------------
// START SERVICE
// ----------------------
function startLiveMonitor(client) {
  console.log("📡 Live monitor started");
  setInterval(() => {
    checkStreams(client);
  }, 60000); // check every 60 seconds
}

module.exports = { startLiveMonitor };