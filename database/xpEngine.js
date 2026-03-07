// database/xpEngine.js
const { getUser, updateUser, logXP } = require("./xp");
const { getGlobalMultiplier } = require("./xpSettings");
const { xpRequiredForLevel, calculateLevelFromXP, MAX_LEVEL } = require("../xp/levelCurve");

function prestigeMultiplier(prestige) {
  return 1 + (prestige * 0.05);
}

function addXP(userId, baseAmount, reason = "unknown") {
  const user = getUser(userId);

  const globalMulti = getGlobalMultiplier();
  const prestigeMulti = prestigeMultiplier(user.prestige);

  const finalAmount = Math.floor(baseAmount * globalMulti * prestigeMulti);

  const newTotalXp = user.totalXp + finalAmount;

  const newLevel = calculateLevelFromXP(newTotalXp);
  const currentLevelXp = xpRequiredForLevel(newLevel - 1);
  const remainingXp = newTotalXp - sumXpToLevel(newLevel - 1);

  updateUser(userId, {
    xp: remainingXp,
    level: newLevel,
    totalXp: newTotalXp
  });

  logXP(userId, finalAmount, reason);

  return {
    leveledUp: newLevel > user.level,
    newLevel,
    amountGained: finalAmount
  };
}

// Helper: sum of XP required up to a certain level
function sumXpToLevel(level) {
  let sum = 0;
  for (let i = 1; i <= level; i++) {
    sum += xpRequiredForLevel(i);
  }
  return sum;
}

function canPrestige(userId) {
  const user = getUser(userId);
  return user.level >= MAX_LEVEL && user.prestige < 10;
}

function prestigeUser(userId) {
  const user = getUser(userId);
  if (!canPrestige(userId)) return false;

  updateUser(userId, {
    xp: 0,
    level: 1,
    prestige: user.prestige + 1,
    totalXp: 0
  });

  return true;
}

module.exports = {
  addXP,
  canPrestige,
  prestigeUser,
  prestigeMultiplier
};