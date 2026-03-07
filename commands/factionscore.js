const { SlashCommandBuilder } = require("discord.js");
const { getFactionScores } = require("../xp/factionSystem");

module.exports = {

  data: new SlashCommandBuilder()
    .setName("factionscore")
    .setDescription("View Russia vs NATO XP war"),

  async execute(interaction) {

    const scores = getFactionScores();

    interaction.reply(
      `⚔️ **Faction War**\n\n` +
      `🇷🇺 Russia: ${scores.russia} XP\n` +
      `🇺🇸 NATO: ${scores.nato} XP`
    );

  }

};