module.exports = {
    // =======================
    // XP SETTINGS
    // =======================
    XP: {
        MESSAGE: 10,           // XP per normal message
        REACTION: 5,          // XP per reaction
        VOICE_PER_MINUTE: 2   // XP per minute in voice
    },
    LEVEL_XP: 100,            // Base XP per level (can be customized)
    MESSAGE_COOLDOWN: 60000,  // 1 minute cooldown for message XP

    // =======================
    // CHANNEL IDS
    // =======================
    LEVEL_CHANNEL_ID: "1373687876268724254",          // Channel where level-up messages appear
    SAFE_CHANNELS: [                                  // Channels exempt from raid lockdown
        "1332754586179473632",
        "1332753537456803851"
    ],
    MOD_LOG_CHANNEL: "1463209423907455057",          // Channel for logging moderation/raid actions
    LIVE_ANNOUNCE_CHANNEL_ID: "123456789012345678",  // Channel for live stream announcements

    // =======================
    // STAFF ROLES
    // =======================
    STAFF_ROLE_IDS: [
        "1343247105833046098",
        "1359891673387368559",
        "1332756164366172212",
        "1332756114386849843",
        "1332756065430929408"
    ],

    // =======================
    // RAID / SPAM SETTINGS
    // =======================
    RAID_JOIN_THRESHOLD: 5,     // Number of joins in interval to trigger raid mode
    RAID_JOIN_INTERVAL: 10000,  // Interval in ms to count joins for raid detection (10s)
    SPAM_LIMIT: 5,              // Max messages from a bot in SPAM_INTERVAL before auto-ban
    SPAM_INTERVAL: 60000,       // Time in ms to track bot message spam (1 min)

    // =======================
    // LIVE STREAMERS
    // =======================
    STREAMERS: [
        { name: "Streamer1", platform: "twitch", id: "twitch_user_id", avatar: null },
        { name: "Streamer2", platform: "youtube", id: "youtube_channel_id", avatar: null },
        { name: "Streamer3", platform: "tiktok", id: "tiktok_username", avatar: null }
    ],

    // =======================
    // API KEYS
    // =======================
    TWITCH_CLIENT_ID: "your_twitch_client_id",
    TWITCH_OAUTH_TOKEN: "your_twitch_oauth_token",
    YOUTUBE_API_KEY: "your_youtube_api_key"
};
