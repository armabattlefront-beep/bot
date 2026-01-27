const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { assignStatus, getEventApplications } = require("../database/apps");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("assignstatus")
    .setDescription("Assign first team or substitute status to a participant")
    .addStringOption(opt =>
      opt.setName("event")
        .setDescription("Select the event")
        .setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName("user")
        .setDescription("Select the user to assign")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("status")
        .setDescription("First team or substitute")
        .setRequired(true)
        .addChoices(
          { name: "First Team", value: "firstTeam" },
          { name: "Substitute", value: "sub" }
        )
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) 
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    const eventId = interaction.options.getString("event");
    const userId = interaction.options.getUser("user").id;
    const status = interaction.options.getString("status");

    const success = assignStatus(eventId, userId, status);
    if (!success) {
      return interaction.reply({ content: "❌ Failed to assign status. Check user/event.", ephemeral: true });
    }

    interaction.reply({ content: `✅ Assigned ${status} to <@${userId}> for **${eventId}**.` });
  }
};
