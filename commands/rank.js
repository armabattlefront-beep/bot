// commands/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserXPData, getRankCardURL } = require("../database/xpEngine");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your BattleFront rank or another member's rank")
    .addUserOption(option =>
      option.setName("target")
        .setDescription("The user to check")
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("target") || interaction.user;

    // Fetch all XP/Level/Prestige data in one call
    const xpData = getUserXPData(user.id);
    if (!xpData) {
      return interaction.reply({
        content: `❌ No XP data found for <@${user.id}>.`,
        ephemeral: true
      });
    }

    const { xp, level, prestige, nextLevelXP } = xpData;

    const embed = new EmbedBuilder()
      .setTitle(`🎖️ BattleFront Rank Card: ${user.tag}`)
      .setColor(0x1abc9c)
      .addFields(
        { name: "Level", value: `${level}`, inline: true },
        { name: "Prestige", value: `${prestige}`, inline: true },
        { name: "XP", value: `${xp} / ${nextLevelXP}`, inline: true }
      )
      .setFooter({ text: "Earn XP by chatting, reacting, playing, and more!" })
      .setTimestamp();

    // Optional: attach dynamic rank card image
    const rankCardURL = getRankCardURL(user.id);
    if (rankCardURL) embed.setImage(rankCardURL);

    await interaction.reply({ embeds: [embed] });
  }
};
