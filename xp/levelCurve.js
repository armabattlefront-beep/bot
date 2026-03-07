const MAX_LEVEL = 200;

function xpRequiredForLevel(level) {
  if (level <= 1) return 250;
  return Math.floor(250 * Math.pow(level, 1.7));
}

function calculateLevelFromXP(totalXp) {

  let level = 1;
  let remaining = totalXp;

  for (let i = 1; i <= MAX_LEVEL; i++) {

    const required = xpRequiredForLevel(i);

    if (remaining >= required) {
      remaining -= required;
      level++;
    } else {
      break;
    }

  }

  return {
    level: Math.min(level, MAX_LEVEL),
    remainingXp: remaining
  };

}

module.exports = {
  MAX_LEVEL,
  xpRequiredForLevel,
  calculateLevelFromXP
};