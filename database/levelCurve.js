// database/levelCurve.js

function xpForLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

function getLevelFromXp(totalXp) {
  let level = 1;
  let xpNeeded = xpForLevel(level);

  while (totalXp >= xpNeeded) {
    totalXp -= xpNeeded;
    level++;
    xpNeeded = xpForLevel(level);
  }

  return {
    level,
    xp: totalXp,
    xpNeeded
  };
}

module.exports = {
  xpForLevel,
  getLevelFromXp
};