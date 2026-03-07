const { addXP } = require("./xpEngine");
const { getUser, updateUser } = require("../database/xp");

const MESSAGE_COOLDOWN = 15000;
const BASE_XP = 15;

const lastMessages = new Map();

function handleMessage(message) {

  if (!message.guild) return;
  if (message.author.bot) return;

  const now = Date.now();
  const last = lastMessages.get(message.author.id) || 0;

  if (now - last < MESSAGE_COOLDOWN) return;

  if (message.content.length < 5) return;

  let xp = BASE_XP;

  if (message.attachments.size > 0) xp += 10;
  if (message.content.length > 120) xp += 5;

  const result = addXP(message.author.id, xp, "message");

  const user = getUser(message.author.id);

  updateUser(message.author.id, {
    messages: user.messages + 1,
    lastMessage: now
  });

  lastMessages.set(message.author.id, now);

  if (result.leveledUp) {

    message.channel.send(
      `🎖️ <@${message.author.id}> reached **Level ${result.newLevel}**!`
    );

  }

}

function handleReaction(reaction, user) {

  if (user.bot) return;

  addXP(user.id, 2, "reaction_given");

  if (reaction.message.author && !reaction.message.author.bot) {

    addXP(reaction.message.author.id, 3, "reaction_received");

  }

}

function handleVoiceUpdate(oldState, newState) {

  if (!newState.channel) return;

  const userId = newState.id;

  addXP(userId, 10, "voice");

}

module.exports = {
  handleMessage,
  handleReaction,
  handleVoiceUpdate
};