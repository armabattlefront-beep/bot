const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getAllStreamers, addStreamer } = require("../database/streamers");
const { LIVE_ANNOUNCE_CHANNEL_ID } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("livenow")
    .setDescription("Announce a streamer is live (Twitch, YouTube, TikTok)")
    .addStringOption(opt =>
      opt.setName("link")
        .setDescription("Streamer URL")
        .setRequired(true)
    ),

  async execute(interaction) {
    const link = interaction.options.getString("link");
    let platform, id, name;

    try {
      const url = new URL(link);

      if (url.hostname.includes("twitch.tv")) {
        platform = "twitch";
        id = url.pathname.replace(/^\/+|\/+$/g, "");
        name = id;
      } else if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
        platform = "youtube";
        if (url.hostname.includes("youtu.be")) {
          id = url.pathname.replace(/^\/+|\/+$/g, "");
        } else {
          id = url.searchParams.get("channel") || url.searchParams.get("user");
          if (!id) throw new Error("Cannot extract YouTube ID from link");
        }
        name = id;
      } else if (url.hostname.includes("tiktok.com")) {
        platform = "tiktok";
        id = url.pathname.split("/")[1];
        name = id;
      } else {
        throw new Error("Unsupported platform");
      }
    } catch (err) {
      return interaction.reply({ content: `⚠️ Invalid link: ${err.message}`, ephemeral: true });
    }

    // Add to database if not already present
    const all = getAllStreamers();
    if (!all.some(s => s.id === id && s.platform === platform)) {
      addStreamer({ id, name, platform });
    }

    // Send embed in LIVE ANNOUNCE channel
    const channel = interaction.client.channels.cache.get(LIVE_ANNOUNCE_CHANNEL_ID);
    if (!channel) return interaction.reply({ content: "⚠️ Live announce channel not found", ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(`🔴 ${name} is LIVE on ${platform}!`)
      .setDescription(`[Click here to watch](${link})`)
      .setColor(0xff0000)
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    // Assign LIVE NOW role if it exists
    const guild = interaction.guild;
    const liveRole = guild.roles.cache.find(r => r.name === "LIVE NOW");
    if (liveRole) {
      const member = guild.members.cache.get(interaction.user.id);
      if (member && !member.roles.cache.has(liveRole.id)) {
        await member.roles.add(liveRole).catch(() => null);
      }
    }

    interaction.reply({ content: `✅ ${name} has been announced as live!`, ephemeral: true });
  }
};