module.exports = {
    // =========================
    // XP SYSTEM
    // =========================
    XP: {
        MESSAGE: parseInt(process.env.XP_MESSAGE || "5", 10),
        REACTION: parseInt(process.env.XP_REACTION || "3", 10),
        VOICE_PER_MINUTE: parseInt(process.env.XP_VOICE_PER_MINUTE || "2", 10)
    },

    LEVEL_XP: parseInt(process.env.LEVEL_XP || "100", 10),
    MESSAGE_COOLDOWN: parseInt(process.env.MESSAGE_COOLDOWN || "60000", 10),

    // =========================
    // CHANNELS
    // =========================
    LEVEL_CHANNEL_ID: process.env.LEVEL_CHANNEL_ID || "1373687876268724254",

    SAFE_CHANNELS: process.env.SAFE_CHANNELS
        ? process.env.SAFE_CHANNELS.split(",")
        : [
            "1332754586179473632",
            "1332753537456803851",
            "1435659408783708161"
        ],

    MOD_LOG_CHANNEL: process.env.MOD_LOG_CHANNEL || "1463209423907455057",
    LIVE_ANNOUNCE_CHANNEL_ID: process.env.LIVE_ANNOUNCE_CHANNEL_ID || "123456789012345678",

    // =========================
    // STAFF ROLES
    // =========================
    STAFF_ROLE_IDS: {
        moderators: "1332756114386849843", // In-game / Discord Reports
        admins: "1332756164366172212",     // Technical Support
        support: "1387785600140185771",    // General Community Support
        wellbeing: "1470212013979471973"   // Wellbeing / Mental Health
    },

    // =========================
    // TICKET SYSTEM
    // =========================
    TICKET_TYPES: [
        "inGame",          // In-game report
        "discordReport",   // Discord report
        "technical",       // Technical issue
        "discordSupport",  // Discord support
        "wellbeing"        // Community / wellbeing support
    ],

    // Channel where all tickets are posted (thread-based system)
    TICKET_BOARD_CHANNEL: process.env.TICKET_BOARD_CHANNEL || "123456789012345678",

    // =========================
    // ANTI-SPAM / RAID
    // =========================
    RAID_JOIN_THRESHOLD: parseInt(process.env.RAID_JOIN_THRESHOLD || "5", 10),
    RAID_JOIN_INTERVAL: parseInt(process.env.RAID_JOIN_INTERVAL || "10000", 10),

    SPAM_LIMIT: parseInt(process.env.SPAM_LIMIT || "5", 10),
    SPAM_INTERVAL: parseInt(process.env.SPAM_INTERVAL || "60000", 10),

    // =========================
    // STREAMERS (NO DEFAULT DATA)
    // =========================
    STREAMERS: [],

    // =========================
    // API KEYS
    // =========================
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || null,
    TWITCH_OAUTH_TOKEN: process.env.TWITCH_OAUTH_TOKEN || null,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || null
};
