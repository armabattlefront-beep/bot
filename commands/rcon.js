module.exports = {
  // =========================
  // XP SETTINGS
  // =========================
  XP: {
    MESSAGE: parseInt(process.env.XP_MESSAGE || "5", 10),
    REACTION: parseInt(process.env.XP_REACTION || "3", 10),
    VOICE_PER_MINUTE: parseInt(process.env.XP_VOICE_PER_MINUTE || "2", 10)
  },
  LEVEL_XP: parseInt(process.env.LEVEL_XP || "100", 10),
  MESSAGE_COOLDOWN: parseInt(process.env.MESSAGE_COOLDOWN || "60000", 10),

  // =========================
  // CHANNEL IDS
  // =========================
  LEVEL_CHANNEL_ID: process.env.LEVEL_CHANNEL_ID || "1373687876268724254",
  SAFE_CHANNELS: process.env.SAFE_CHANNELS ? process.env.SAFE_CHANNELS.split(",") : [
    "1332754586179473632",
    "1332753537456803851"
  ],
  MOD_LOG_CHANNEL: process.env.MOD_LOG_CHANNEL || "1463209423907455057",
  LIVE_ANNOUNCE_CHANNEL_ID: process.env.LIVE_ANNOUNCE_CHANNEL_ID || "123456789012345678",

  // =========================
  // ROLES
  // =========================
  STAFF_ROLE_IDS: process.env.STAFF_ROLE_IDS ? process.env.STAFF_ROLE_IDS.split(",") : [
    "1343247105833046098",
    "1359891673387368559",
    "1332756164366172212",
    "1332756114386849843",
    "1332756065430929408"
  ],
  RCON_ROLE_ID: process.env.RCON_ROLE_ID || "123456789012345678", // <--- Your RCON role

  // =========================
  // RAID / SPAM SETTINGS
  // =========================
  RAID_JOIN_THRESHOLD: parseInt(process.env.RAID_JOIN_THRESHOLD || "5", 10),
  RAID_JOIN_INTERVAL: parseInt(process.env.RAID_JOIN_INTERVAL || "10000", 10),
  SPAM_LIMIT: parseInt(process.env.SPAM_LIMIT || "5", 10),
  SPAM_INTERVAL: parseInt(process.env.SPAM_INTERVAL || "60000", 10),

  // =========================
  // STREAMERS
  // =========================
  STREAMERS: process.env.STREAMERS ? JSON.parse(process.env.STREAMERS) : [
    { name: "Streamer1", platform: "twitch", id: "twitch_user_id" },
    { name: "Streamer2", platform: "youtube", id: "youtube_channel_id" },
    { name: "Streamer3", platform: "tiktok", id: "tiktok_username" }
  ],

  // =========================
  // API KEYS
  // =========================
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || "your_twitch_client_id",
  TWITCH_OAUTH_TOKEN: process.env.TWITCH_OAUTH_TOKEN || "your_twitch_oauth_token",
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "your_youtube_api_key"
};
