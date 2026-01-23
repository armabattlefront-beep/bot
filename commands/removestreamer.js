const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { removeStreamer, getAllStreamers } = require("../database/streamers");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removestreamer")
    .setDescription("Remove a streamer from the Live Now list")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Exact name of the streamer to remove")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const name = interaction.options.getString("name");

    const all = getAllStreamers();
    const streamer = all.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (!streamer) {
      return interaction.reply({ content: `❌ No streamer found with name "${name}"`, ephemeral: true });
    }

    try {
      removeStreamer(streamer.id);
      interaction.reply({ content: `✅ Removed streamer "${streamer.name}" from the Live Now list.` });

      // Log to mod channel
      const logCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
      if (logCh) logCh.send(`🗑️ Streamer "${streamer.name}" removed by ${interaction.user.tag}`);
    } catch (err) {
      console.error("Failed to remove streamer:", err);
      interaction.reply({ content: "❌ Failed to remove streamer. Check console.", ephemeral: true });
    }
  }
};
