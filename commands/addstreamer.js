const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { addStreamer } = require("../database/streamers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addstreamer")
    .setDescription("Add a streamer to the Live Now list")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Streamer display name")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("platform")
        .setDescription("Platform (twitch/youtube/tiktok)")
        .setRequired(true)
        .addChoices(
          { name: "Twitch", value: "twitch" },
          { name: "YouTube", value: "youtube" },
          { name: "TikTok", value: "tiktok" }
        )
    )
    .addStringOption(opt =>
      opt.setName("id")
        .setDescription("Platform-specific user/channel ID")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member))
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    const name = interaction.options.getString("name");
    const platform = interaction.options.getString("platform");
    const id = interaction.options.getString("id");

    const success = addStreamer({ name, platform, id });
    if (!success)
      return interaction.reply({ content: "⚠️ Streamer already exists in the list.", ephemeral: true });

    interaction.reply({ content: `✅ Added **${name}** (${platform}) to Live Now list.`, ephemeral: true });
  }
};
