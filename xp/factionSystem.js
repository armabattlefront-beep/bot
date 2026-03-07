const RUSSIA_ROLE = "RUSSIA_ROLE_ID";
const NATO_ROLE = "NATO_ROLE_ID";

let factionScores = {
  russia: 0,
  nato: 0
};

function awardFactionXP(member, amount) {

  if (member.roles.cache.has(RUSSIA_ROLE)) {
    factionScores.russia += amount;
  }

  if (member.roles.cache.has(NATO_ROLE)) {
    factionScores.nato += amount;
  }

}

function getFactionScores() {
  return factionScores;
}

module.exports = {
  awardFactionXP,
  getFactionScores
};