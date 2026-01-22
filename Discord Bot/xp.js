const fs = require("fs");
const path = "./levels.json";

function loadLevels() {
    if (!fs.existsSync(path)) return {};
    return JSON.parse(fs.readFileSync(path, "utf-8"));
}

function saveLevels(levels) {
    fs.writeFileSync(path, JSON.stringify(levels, null, 2));
}

function addXP(userId, amount) {
    const levels = loadLevels();
    if (!levels[userId]) levels[userId] = { xp: 0, level: 0, username: null };
    levels[userId].xp += amount;
    while (levels[userId].xp >= getNextLevelXP(levels[userId].level)) {
        levels[userId].xp -= getNextLevelXP(levels[userId].level);
        levels[userId].level++;
    }
    saveLevels(levels);
    return levels[userId];
}

function getNextLevelXP(level) {
    return 100 + level * 50;
}

function getRankName(level) {
    const ranks = ["Recruit", "Private", "Corporal", "Sergeant", "Lieutenant", "Captain", "Major", "Colonel", "General"];
    return ranks[Math.min(level, ranks.length - 1)];
}

let clientInstance = null;
function setClient(client) { clientInstance = client; }

module.exports = { addXP, loadLevels, getNextLevelXP, getRankName, setClient };
