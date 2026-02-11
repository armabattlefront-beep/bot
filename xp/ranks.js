// xp/ranks.js

const rankTiers = [
  "Recruit",
  "Private",
  "Lance Corporal",
  "Corporal",
  "Sergeant",
  "Staff Sergeant",
  "Warrant Officer",
  "Lieutenant",
  "Captain",
  "Major",
  "Colonel",
  "Brigadier",
  "General",
  "Field Marshal"
];

function getRankName(level) {
  const tierSize = Math.ceil(200 / rankTiers.length);
  const index = Math.min(
    Math.floor((level - 1) / tierSize),
    rankTiers.length - 1
  );

  return `${rankTiers[index]} • Level ${level}`;
}

module.exports = {
  getRankName
};
