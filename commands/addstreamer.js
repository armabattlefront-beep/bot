const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { addStreamer } = require("../database/streamers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addstreamer")
    .setDescription("Add a streamer to the Live Now list (just paste the URL)")
    .addStringOption(opt =>
      opt.setName("link")
        .setDescription("Streamer URL (Twitch, YouTube, TikTok)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Optional display name")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member))
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    const link = interaction.options.getString("link");
    let name = interaction.options.getString("name") || null;

    // Determine platform and extract ID
    let platform, id;
    try {
      const url = new URL(link);

      if (url.hostname.includes("twitch.tv")) {
        platform = "twitch";
        id = url.pathname.replace(/^\/+|\/+$/g, ""); // remove slashes
      } else if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
        platform = "youtube";
        if (url.hostname.includes("youtu.be")) {
          id = url.pathname.replace(/^\/+|\/+$/g, "");
        } else {
          id = url.searchParams.get("channel") || url.searchParams.get("user");
          if (!id) throw new Error("Cannot extract YouTube ID from link");
        }
      } else if (url.hostname.includes("tiktok.com")) {
        platform = "tiktok";
        id = url.pathname.split("/")[1]; // first path segment
      } else {
        throw new Error("Unsupported platform");
      }

      if (!name) name = id; // fallback to ID as name
    } catch (err) {
      return interaction.reply({ content: `⚠️ Invalid link or platform: ${err.message}`, ephemeral: true });
    }

    const success = addStreamer({ name, platform, id });
    if (!success)
      return interaction.reply({ content: "⚠️ Streamer already exists in the list.", ephemeral: true });

    return interaction.reply({ content: `✅ Added **${name}** (${platform}) to Live Now list.`, ephemeral: true });
  }
};