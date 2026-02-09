// commands/poll.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction
} = require("discord.js");
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
            .setRequired(false))
    .addBooleanOption(option =>
      option.setName("allowcustom")
            .setDescription("Allow users to submit custom responses")
            .setRequired(false)),

  async execute(interaction) {
    const question = interaction.options.getString("question");
    const options = [
      interaction.options.getString("option1"),
      interaction.options.getString("option2"),
      interaction.options.getString("option3"),
      interaction.options.getString("option4"),
    ].filter(Boolean);

    if (options.length < 2)
      return interaction.reply({ content: "❌ You must provide at least 2 options.", ephemeral: true });

    const duration = interaction.options.getInteger("duration") || 5;
    const allowCustom = interaction.options.getBoolean("allowcustom") || false;
    const expireTime = Date.now() + duration * 60 * 1000;

    const votes = {};
    options.forEach(opt => votes[opt] = []);

    const row = new ActionRowBuilder();
    options.forEach((opt, i) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_option_${i}_${Date.now()}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Primary)
      );
    });

    if (allowCustom) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_custom_${Date.now()}`)
          .setLabel("Custom Response")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${question}`)
      .setDescription(options.map((o, i) => `**${i + 1}.** ${o}`).join("\n"))
      .setColor(0x3498db)
      .setFooter({ text: `Poll ends in ${duration} minutes` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    addPoll(msg.id, {
      question,
      options,
      votes,
      expires: expireTime,
      allowCustom,
      channelId: interaction.channelId
    });

    const collector = msg.createMessageComponentCollector({ time: duration * 60 * 1000 });

    collector.on("collect", async i => {
      if (!i.isButton()) return;

      const poll = getPoll(msg.id);
      if (!poll) return;

      // Handle custom response button
      if (i.customId.startsWith("poll_custom")) {
        const modal = new ModalBuilder()
          .setCustomId(`poll_modal_${msg.id}_${Date.now()}`)
          .setTitle("Submit a Custom Poll Response")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("customOption")
                .setLabel("Your Option")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Type your response here")
                .setRequired(true)
            )
          );

        await i.showModal(modal);
        return;
      }

      // Regular option vote
      const index = parseInt(i.customId.split("_")[2]);
      const option = poll.options[index];
      if (!option) return;

      // Remove previous vote
      for (const opt of Object.keys(poll.votes)) {
        poll.votes[opt] = poll.votes[opt].filter(uid => uid !== i.user.id);
      }

      poll.votes[option].push(i.user.id);
      updatePoll(msg.id, poll);

      const newEmbed = new EmbedBuilder()
        .setTitle(`📊 ${poll.question}`)
        .setColor(0x3498db)
        .setFooter({ text: `Poll ends in ${Math.max(0, Math.floor((poll.expires - Date.now())/60000))} minutes` })
        .setTimestamp()
        .setDescription(
          poll.options.map(opt => {
            const count = poll.votes[opt]?.length || 0;
            return `**${opt}** — ${count} vote${count === 1 ? "" : "s"}`;
          }).join("\n")
        );

      await i.update({ embeds: [newEmbed] });
    });

    // Handle modal submit for custom response
    client.on("interactionCreate", async i => {
      if (!i.isModalSubmit()) return;
      if (!i.customId.startsWith("poll_modal_")) return;

      const msgId = i.customId.split("_")[2];
      const poll = getPoll(msgId);
      if (!poll) return;

      const customOption = i.fields.getTextInputValue("customOption").trim();
      if (!customOption) return i.reply({ content: "❌ Invalid response.", ephemeral: true });

      // Add new option
      if (!poll.options.includes(customOption)) {
        poll.options.push(customOption);
        poll.votes[customOption] = [i.user.id];

        // Update buttons
        const newRow = new ActionRowBuilder();
        poll.options.forEach((opt, idx) => {
          newRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`poll_option_${idx}_${Date.now()}`)
              .setLabel(opt)
              .setStyle(ButtonStyle.Primary)
          );
        });

        if (poll.allowCustom) {
          newRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`poll_custom_${Date.now()}`)
              .setLabel("Custom Response")
              .setStyle(ButtonStyle.Secondary)
          );
        }

        updatePoll(msgId, poll);

        const channel = await client.channels.fetch(poll.channelId);
        const pollMsg = await channel.messages.fetch(msgId);
        await pollMsg.edit({ components: [newRow] });
      } else {
        poll.votes[customOption].push(i.user.id);
        updatePoll(msgId, poll);
      }

      // Update embed with vote counts
      const newEmbed = new EmbedBuilder()
        .setTitle(`📊 ${poll.question}`)
        .setColor(0x3498db)
        .setFooter({ text: `Poll ends in ${Math.max(0, Math.floor((poll.expires - Date.now())/60000))} minutes` })
        .setTimestamp()
        .setDescription(
          poll.options.map(opt => {
            const count = poll.votes[opt]?.length || 0;
            return `**${opt}** — ${count} vote${count === 1 ? "" : "s"}`;
          }).join("\n")
        );

      const channel = await client.channels.fetch(poll.channelId);
      const pollMsg = await channel.messages.fetch(msgId);
      await i.reply({ content: "✅ Your response has been added!", ephemeral: true });
      await pollMsg.edit({ embeds: [newEmbed] });
    });

    collector.on("end", async () => {
      const poll = getPoll(msg.id);
      if (!poll) return;

      const resultsEmbed = new EmbedBuilder()
        .setTitle(`📊 Poll Results: ${poll.question}`)
        .setColor(0x3498db)
        .setTimestamp()
        .setDescription(
          poll.options.map(opt => {
            const count = poll.votes[opt]?.length || 0;
            return `**${opt}** — ${count} vote${count === 1 ? "" : "s"}`;
          }).join("\n")
        );

      await msg.edit({ embeds: [resultsEmbed], components: [] });
    });

    return interaction.followUp({ content: "✅ Poll created successfully!", ephemeral: true });
  }
};
