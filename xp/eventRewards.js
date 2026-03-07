const { addXP } = require("./xpEngine");

function rewardEventWinner(userId) {

  addXP(userId, 1000, "event_win");

}

function rewardEventParticipation(userId) {

  addXP(userId, 250, "event_participation");

}

module.exports = {
  rewardEventWinner,
  rewardEventParticipation
};