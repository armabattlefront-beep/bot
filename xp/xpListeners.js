// xp/xpListeners.js

const { addXP } = require("./xpEngine");
const { getUser, updateUser } = require("../database/xp");

const MESSAGE_COOLDOWN = 15000; // 15 seconds
const VOICE_INTERVAL = 60000; // 1 minute
const BASE_MESSAGE_XP = 15;
const MEDIA_BONUS_XP = 10;
const REACTION_GIVE_XP = 2;
const REACTION_RECEIVE_XP = 3;
const VOICE_XP_PER_MINUTE = 12;

const activeVoice = new Map();

// ==============================
// MESSAGE XP
// ==============================

function handleMessage(message) {
  if (!message.guild) return;
  if (message.author.bot) return;

  const user = getUser(message.author.id);
  const now = Date.now();

  if (now - user.lastMessage < MESSAGE_COOLDOWN) return;

  let xpGain = BASE_MESSAGE_XP;

  if (message.attachments.size > 0) xpGain += MEDIA_BONUS_XP;
  if (message.content.length > 120) xpGain += 5;

  const result = addXP(message.author.id, xpGain, "message");

  updateUser(message.author.id, {
    lastMessage: now,
    messages: user.messages + 1
  });

  if (result.leveledUp) {
    message.channel.send(
      `🎖️ <@${message.author.id}> advanced to **Level ${result.newLevel}**!`
    );
  }
}

// ==============================
// REACTION XP
// ==============================

function handleReaction(reaction, user) {
  if (user.bot) return;
  if (!reaction.message.guild) return;

  addXP(user.id, REACTION_GIVE_XP, "reaction_given");

  if (reaction.message.author && !reaction.message.author.bot) {
    addXP(reaction.message.author.id, REACTION_RECEIVE_XP, "reaction_received");
  }

  const giver = getUser(user.id);
  updateUser(user.id, {
    reactionsGiven: giver.reactionsGiven + 1
  });

  const receiver = getUser(reaction.message.author.id);
  updateUser(reaction.message.author.id, {
    reactionsReceived: receiver.reactionsReceived + 1
  });
}

// ==============================
// VOICE XP
// ==============================

function handleVoiceUpdate(oldState, newState) {
  const userId = newState.id;

  if (!oldState.channel && newState.channel) {
    activeVoice.set(userId, Date.now());
  }

  if (oldState.channel && !newState.channel) {
    const joinedAt = activeVoice.get(userId);
    if (!joinedAt) return;

    const minutes = Math.floor((Date.now() - joinedAt) / VOICE_INTERVAL);

    if (minutes > 0) {
      addXP(userId, minutes * VOICE_XP_PER_MINUTE, "voice");

      const user = getUser(userId);
      updateUser(userId, {
        voiceMinutes: user.voiceMinutes + minutes
      });
    }

    activeVoice.delete(userId);
  }
}

module.exports = {
  handleMessage,
  handleReaction,
  handleVoiceUpdate
};
