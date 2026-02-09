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
        : ["1332754586179473632", "1332753537456803851", "1435659408783708161"],
    MOD_LOG_CHANNEL: process.env.MOD_LOG_CHANNEL || "1463209423907455057",
    LIVE_ANNOUNCE_CHANNEL_ID: process.env.LIVE_ANNOUNCE_CHANNEL_ID || "123456789012345678",

    // =========================
    // STAFF ROLES
    // =========================
    STAFF_ROLE_IDS: {
        moderators: "1332756114386849843",
        admins: "1332756164366172212",
        support: "1387785600140185771",
        wellbeing: "1470212013979471973"
    },

    // =========================
    // TICKET SYSTEM
    // =========================
    TICKET_BOARD_CHANNEL: "1470416063476007044", // <-- NEW Text channel ID

    // =========================
    // WELCOME / ONBOARDING
    // =========================
    WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID || "1332754523252330529",
    RULES_CHANNEL_ID: process.env.RULES_CHANNEL_ID || "1356976524657692930",
    INTRO_CHANNEL_ID: process.env.INTRO_CHANNEL_ID || "1459653729468022834",
    ROLES_INFO_CHANNEL_ID: process.env.ROLES_INFO_CHANNEL_ID || "123456789012345678",
    NEW_MEMBER_ROLE_ID: process.env.NEW_MEMBER_ROLE_ID || "",

    // =========================
    // ANTI-SPAM / RAID
    // =========================
    RAID_JOIN_THRESHOLD: parseInt(process.env.RAID_JOIN_THRESHOLD || "5", 10),
    RAID_JOIN_INTERVAL: parseInt(process.env.RAID_JOIN_INTERVAL || "10000", 10),
    SPAM_LIMIT: parseInt(process.env.SPAM_LIMIT || "5", 10),
    SPAM_INTERVAL: parseInt(process.env.SPAM_INTERVAL || "60000", 10),

    // =========================
    // STREAMERS
    // =========================
    STREAMERS: [],

    // =========================
    // API KEYS
    // =========================
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || null,
    TWITCH_OAUTH_TOKEN: process.env.TWITCH_OAUTH_TOKEN || null,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || null
};
