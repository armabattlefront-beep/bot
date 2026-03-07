const { addXP } = require("../database/xpEngine");

// Config XP amounts
const XP_CONFIG = {
  message: 5,
  reaction: 2,
  voiceMinute: 1
};

module.exports.initXPListeners = (client) => {
  // ---------------------------
  // MESSAGE XP
  // ---------------------------
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    try {
      const { levelUp, level } = addXP(message.author.id, XP_CONFIG.message);
      if (levelUp) {
        message.channel.send(`🎉 <@${message.author.id}> reached level **${level}**!`);
      }
    } catch (err) {
      console.error("XP MESSAGE ERROR:", err);
    }
  });

  // ---------------------------
  // REACTION XP
  // ---------------------------
  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    try {
      if (reaction.partial) await reaction.fetch();
      const { levelUp, level } = addXP(user.id, XP_CONFIG.reaction);
      if (levelUp) {
        const channel = reaction.message.channel;
        channel.send(`🎉 <@${user.id}> reached level **${level}**!`);
      }
    } catch (err) {
      console.error("XP REACTION ERROR:", err);
    }
  });

  // ---------------------------
  // VOICE XP
  // ---------------------------
  const voiceTimestamps = {}; // Track join times

  client.on("voiceStateUpdate", (oldState, newState) => {
    try {
      const userId = newState.member.id;
      if (!userId) return;

      // Joined voice
      if (!oldState.channelId && newState.channelId) {
        voiceTimestamps[userId] = Date.now();
      }

      // Left voice
      if (oldState.channelId && !newState.channelId) {
        const joinTime = voiceTimestamps[userId];
        if (!joinTime) return;

        const minutes = Math.floor((Date.now() - joinTime) / 60000);
        const xpGained = minutes * XP_CONFIG.voiceMinute;
        if (xpGained > 0) {
          const { levelUp, level } = addXP(userId, xpGained);
          if (levelUp) {
            const channel = oldState.guild.systemChannel || oldState.channel;
            if (channel)
              channel.send(`🎉 <@${userId}> reached level **${level}** from voice chat!`);
          }
        }
        delete voiceTimestamps[userId];
      }
    } catch (err) {
      console.error("XP VOICE ERROR:", err);
    }
  });
};