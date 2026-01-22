const fs = require("fs");
const path = require("path");
const { LEVEL_CHANNEL_ID } = require("./config");
const { EmbedBuilder } = require("discord.js");

let client; // Discord client reference
const LEVELS_FILE = path.join(__dirname, "levels.json");

let levels = {};
if (fs.existsSync(LEVELS_FILE)) levels = JSON.parse(fs.readFileSync(LEVELS_FILE));

// XP settings
const BASE_XP = 100;       // XP for level 1
const MULTIPLIER = 1.15;   // Level difficulty multiplier
const XP_MULTIPLIER_PER_LEVEL = 1.05; // XP gained multiplier per level

function setClient(discordClient, levelChannelId) {
    client = discordClient;
}

// Get XP required for a given level
function xpForLevel(level) {
    return Math.floor(BASE_XP * Math.pow(level, MULTIPLIER));
}

// Add XP to a user with visual embed notification
function addXP(userId, amount, levelChannelId = LEVEL_CHANNEL_ID) {
    if (!levels[userId]) levels[userId] = { xp: 0, level: 0 };

    const userData = levels[userId];

    // Apply level-based XP multiplier
    amount = Math.floor(amount * Math.pow(XP_MULTIPLIER_PER_LEVEL, userData.level));
    userData.xp += amount;

    // Check for level up
    let leveledUp = false;
    while (userData.xp >= xpForLevel(userData.level + 1)) {
        userData.level += 1;
        leveledUp = true;
    }

    // Save levels
    saveLevels();

    // Notify in level channel using embed with progress bar
    if (leveledUp && client) {
        const channel = client.channels.cache.get(levelChannelId);
        if (channel) {
            const xpForNext = xpForLevel(userData.level + 1);
            const xpProgress = Math.min(userData.xp, xpForNext);
            const barLength = 20; // length of progress bar
            const filled = Math.round((xpProgress / xpForNext) * barLength);
            const empty = barLength - filled;
            const progressBar = "🟩".repeat(filled) + "⬛".repeat(empty);

            const embed = new EmbedBuilder()
                .setTitle(`🎉 Level Up!`)
                .setDescription(`<@${userId}> has reached **Level ${userData.level}**!`)
                .addFields(
                    { name: "XP Progress", value: `${userData.xp} / ${xpForNext}\n${progressBar}` }
                )
                .setThumbnail(client.users.cache.get(userId)?.displayAvatarURL({ dynamic: true }))
                .setColor(0x00FF00)
                .setTimestamp();

            channel.send({ embeds: [embed] });
        }
    }
}

// Load all levels
function loadLevels() {
    return levels;
}

// Get a user-friendly rank name
function getRankName(level) {
    if (level >= 50) return "General";
    if (level >= 30) return "Commander";
    if (level >= 15) return "Sergeant";
    return "Recruit";
}

// Save levels to disk
function saveLevels() {
    fs.writeFileSync(LEVELS_FILE, JSON.stringify(levels, null, 2));
}

module.exports = {
    setClient,
    addXP,
    loadLevels,
    getRankName,
    xpForLevel
};
