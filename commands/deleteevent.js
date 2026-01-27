const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getAllEventApplications } = require("../database/apps");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteevent")
    .setDescription("Delete an existing event and all its signups")
    .addStringOption(opt =>
      opt.setName("event")
        .setDescription("Event ID to delete")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const eventId = interaction.options.getString("event");
    const events = getAllEventApplications();

    if (!events[eventId]) {
      return interaction.reply({ content: `❌ Event "${eventId}" not found.`, ephemeral: true });
    }

    // Delete event
    delete events[eventId];
    const fs = require("fs");
    const path = require("path");
    const FILE_PATH = path.join(__dirname, "../data/eventApplications.json");
    fs.writeFileSync(FILE_PATH, JSON.stringify(events, null, 2));

    interaction.reply({ content: `✅ Event "${eventId}" and all its signups have been deleted.` });

    // Log to mod channel
    const logCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
    if (logCh) logCh.send(`🗑️ Event "${eventId}" deleted by ${interaction.user.tag}`);
  }
};
