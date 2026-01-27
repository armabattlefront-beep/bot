const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { saveEvent, getAllEvents } = require("../database/events");
const { isStaff } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createevent")
    .setDescription("Create a new event")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Event name")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("description")
        .setDescription("Event description")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("maxplayers")
        .setDescription("Maximum participants")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("groupsize")
        .setDescription("Squad size (optional)")
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("date")
        .setDescription("Event date (e.g., 27/01/2026)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("time")
        .setDescription("Event time (e.g., 18:00 UTC)")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const name = interaction.options.getString("name");
    const description = interaction.options.getString("description");
    const maxPlayers = interaction.options.getInteger("maxplayers");
    const groupSize = interaction.options.getInteger("groupsize") || null;
    const date = interaction.options.getString("date");
    const time = interaction.options.getString("time");

    const eventId = name.toLowerCase().replace(/\s+/g, "_");
    const allEvents = getAllEvents();

    if (allEvents[eventId]) {
      return interaction.reply({ content: "❌ An event with this name already exists.", ephemeral: true });
    }

    // Save event
    saveEvent(eventId, {
      id: eventId,
      name,
      description,
      maxPlayers,
      groupSize,
      date,
      time,
      signups: []
    });

    // Short description for dropdown (max 90 chars)
    const shortDesc = description.length > 90 ? description.slice(0, 87) + "..." : description;

    const embed = new EmbedBuilder()
      .setTitle(`🆕 Event Created: ${name}`)
      .setDescription(description)
      .addFields(
        { name: "Max Players", value: `${maxPlayers}`, inline: true },
        { name: "Group Size", value: `${groupSize || "N/A"}`, inline: true },
        { name: "Date", value: date, inline: true },
        { name: "Time", value: time, inline: true }
      )
      .setFooter({ text: shortDesc }) // optional: show short desc in embed footer
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
