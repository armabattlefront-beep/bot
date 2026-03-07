const { getUser, updateUser, logXP } = require("../database/xp");
const { getGlobalMultiplier } = require("../database/xpSettings");
const { calculateLevelFromXP, MAX_LEVEL } = require("./levelCurve");

function prestigeMultiplier(prestige) {
  return 1 + prestige * 0.05;
}

function addXP(userId, baseAmount, reason = "unknown") {

  const user = getUser(userId);

  const globalMulti = getGlobalMultiplier();
  const prestigeMulti = prestigeMultiplier(user.prestige);

  const finalAmount = Math.floor(baseAmount * globalMulti * prestigeMulti);

  const newTotalXp = user.totalXp + finalAmount;

  const levelData = calculateLevelFromXP(newTotalXp);

  updateUser(userId, {
    xp: levelData.remainingXp,
    level: levelData.level,
    totalXp: newTotalXp
  });

  logXP(userId, finalAmount, reason);

  return {
    leveledUp: levelData.level > user.level,
    newLevel: levelData.level,
    amount: finalAmount
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
    totalXp: 0,
    prestige: user.prestige + 1
  });

  return true;
}

module.exports = {
  addXP,
  canPrestige,
  prestigeUser
};