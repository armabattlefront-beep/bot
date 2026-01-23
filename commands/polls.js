// commands/poll.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { addPoll, getPoll, updatePoll } = require("../database/polls");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll with multiple options")
    .addStringOption(option => 
      option.setName("question")
            .setDescription("The poll question")
            .setRequired(true))
    .addStringOption(option =>
      option.setName("option1")
            .setDescription("Option 1")
            .setRequired(true))
    .addStringOption(option =>
      option.setName("option2")
            .setDescription("Option 2")
            .setRequired(true))
    .addStringOption(option =>
      option.setName("option3")
            .setDescription("Option 3")
            .setRequired(false))
    .addStringOption(option =>
      option.setName("option4")
            .setDescription("Option 4")
            .setRequired(false))
    .addIntegerOption(option =>
      option.setName("duration")
            .setDescription("Poll duration in minutes (default 5)")
            .setRequired(false)),

  async execute(interaction) {
    const question = interaction.options.getString("question");
    const options = [
      interaction.options.getString("option1"),
      interaction.options.getString("option2"),
      interaction.options.getString("option3"),
      interaction.options.getString("option4"),
    ].filter(Boolean);

    const duration = interaction.options.getInteger("duration") || 5;
    const expireTime = Date.now() + duration * 60 * 1000;

    const votes = {};
    options.forEach(opt => votes[opt] = 0);

    const row = new ActionRowBuilder();
    options.forEach((opt, i) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_${i}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Primary)
      );
    });

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${question}`)
      .setDescription(options.map((o, i) => `**${i+1}.** ${o}`).join("\n"))
      .setColor(0x3498db)
      .setFooter({ text: `Poll ends in ${duration} minutes` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    // Save poll to DB
    addPoll(msg.id, {
      question,
      votes,
      expires: expireTime,
      channelId: interaction.channelId
    });
  }
};
