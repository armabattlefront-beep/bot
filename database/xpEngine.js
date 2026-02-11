// xp/xpEngine.js
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

  let remainingXp = newTotalXp;
  let level = 1;

  for (let i = 1; i <= MAX_LEVEL; i++) {
    const needed = xpRequiredForLevel(i);
    if (remainingXp >= needed) {
      remainingXp -= needed;
      level++;
    } else {
      break;
    }
  }

  if (level > MAX_LEVEL) level = MAX_LEVEL;

  updateUser(userId, {
    xp: remainingXp,
    level,
    totalXp: newTotalXp
  });

  logXP(userId, finalAmount, reason);

  return {
    leveledUp: level > user.level,
    newLevel: level,
    amountGained: finalAmount
  };
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
