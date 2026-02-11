const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserXPData, addXP } = require("../database/xpEngine");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("givexp")
    .setDescription("Gift XP to another user (max 15% of your own XP)")
    .addUserOption(option =>
      option.setName("target")
        .setDescription("User to gift XP to")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("Amount of XP to gift")
        .setRequired(true)
    ),

  async execute(interaction) {
    const giverId = interaction.user.id;
    const receiver = interaction.options.getUser("target");
    const amount = interaction.options.getInteger("amount");

    if (receiver.id === giverId) {
      return interaction.reply({ content: "❌ You cannot gift XP to yourself.", ephemeral: true });
    }

    const giverData = await getUserXPData(giverId);

    // Calculate max allowed gift (15% of giver's XP)
    const maxGift = Math.floor(giverData.xp * 0.15);
    if (amount > maxGift) {
      return interaction.reply({
        content: `❌ You can only gift up to 15% of your XP. Maximum allowed: ${maxGift} XP.`,
        ephemeral: true
      });
    }

    // Deduct from giver
    await addXP(giverId, -amount);
    // Add to receiver
    await addXP(receiver.id, amount);

    const receiverData = await getUserXPData(receiver.id);
    const newGiverData = await getUserXPData(giverId);

    const embed = new EmbedBuilder()
      .setTitle("🎁 XP Gifted")
      .setDescription(`<@${giverId}> gifted **${amount} XP** to <@${receiver.id}>!`)
      .addFields(
        { name: `${interaction.user.username}'s XP`, value: `${newGiverData.xp} XP | Level ${newGiverData.level}`, inline: true },
        { name: `${receiver.username}'s XP`, value: `${receiverData.xp} XP | Level ${receiverData.level}`, inline: true }
      )
      .setColor(0x3498db)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
