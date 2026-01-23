const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post an embedded announcement")
    .addChannelOption(opt =>
      opt.setName("channel")
        .setDescription("Channel to post the announcement")
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName("title")
        .setDescription("Title of the announcement")
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName("body")
        .setDescription("Main body of the announcement (multi-line supported)")
        .setRequired(true))

    // Section 1
    .addStringOption(opt =>
      opt.setName("section1_title")
        .setDescription("Section 1 title")
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName("section1_body")
        .setDescription("Section 1 body")
        .setRequired(false))

    // Section 2
    .addStringOption(opt =>
      opt.setName("section2_title")
        .setDescription("Section 2 title")
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName("section2_body")
        .setDescription("Section 2 body")
        .setRequired(false))

    .addStringOption(opt =>
      opt.setName("color")
        .setDescription("Embed color in HEX (default blue)")
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName("mention")
        .setDescription("Role or @everyone mention (optional)")
        .setRequired(false)),

  async execute(interaction) {
    if (!isStaff(interaction.member))
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    const channel = interaction.options.getChannel("channel");
    const title = interaction.options.getString("title");
    const body = interaction.options.getString("body");
    const color = interaction.options.getString("color") || "#3498db";
    const mention = interaction.options.getString("mention") || null;

    if (!channel.isTextBased())
      return interaction.reply({ content: "❌ Not a text channel.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(body)
      .setColor(color)
      .setTimestamp()
      .setFooter({ text: `Announcement by ${interaction.user.tag}` });

    // Add sections if provided
    const s1Title = interaction.options.getString("section1_title");
    const s1Body = interaction.options.getString("section1_body");
    if (s1Title && s1Body) embed.addFields({ name: s1Title, value: s1Body });

    const s2Title = interaction.options.getString("section2_title");
    const s2Body = interaction.options.getString("section2_body");
    if (s2Title && s2Body) embed.addFields({ name: s2Title, value: s2Body });

    await channel.send({ content: mention, embeds: [embed] });

    interaction.client.channels.cache.get(MOD_LOG_CHANNEL)
      ?.send(`📢 Announcement posted in ${channel} by ${interaction.user.tag}`);

    return interaction.reply({ content: `✅ Announcement sent in ${channel}`, ephemeral: true });
  }
};