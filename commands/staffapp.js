const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { addStaffApplication, getStaffApplications } = require("../database/staffApplications");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staffapp")
    .setDescription("Apply to become a staff member")
    .addStringOption(opt =>
      opt.setName("username")
        .setDescription("Your Discord username or gamertag")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("reason")
        .setDescription("Why you want to join staff")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("experience")
        .setDescription("Any relevant experience")
        .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.options.getString("username");
    const reason = interaction.options.getString("reason");
    const experience = interaction.options.getString("experience") || "None";

    // Add application
    const added = addStaffApplication(userId, { username, reason, experience, status: "pending" });
    if (!added) {
      return interaction.reply({ content: "⚠️ You already have a pending staff application.", ephemeral: true });
    }

    interaction.reply({ content: "✅ Staff application submitted! You will be notified once reviewed.", ephemeral: true });

    // Notify mod channel
    const logCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
    if (logCh) {
      const embed = new EmbedBuilder()
        .setTitle("📝 New Staff Application")
        .setDescription(`<@${userId}> submitted a staff application`)
        .addFields(
          { name: "Username", value: username, inline: true },
          { name: "Reason", value: reason, inline: false },
          { name: "Experience", value: experience, inline: false }
        )
        .setColor(0xffd700)
        .setTimestamp();
      logCh.send({ embeds: [embed] });
    }
  }
};
