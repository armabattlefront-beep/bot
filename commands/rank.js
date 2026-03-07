const { SlashCommandBuilder } = require("discord.js");
const { getUser, getRankPosition } = require("../database/xp");
const { getRankName } = require("../xp/ranks");

module.exports = {

  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("View your XP rank"),

  async execute(interaction) {

    const user = getUser(interaction.user.id);

    const rank = getRankPosition(interaction.user.id);

    const rankName = getRankName(user.level);

    interaction.reply(
      `🎖 **${interaction.user.username}**\n` +
      `Rank: ${rankName}\n` +
      `Level: ${user.level}\n` +
      `Prestige: ${user.prestige}\n` +
      `XP: ${user.totalXp}\n` +
      `Server Rank: #${rank}`
    );

  }

};