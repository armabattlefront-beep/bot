const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { saveEvent, getAllEvents } = require("../database/events");
const fs = require("fs");

// Load allowed roles from JSON
const eventRoles = require("../eventRoles.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createevent")
    .setDescription("Create a new event")
    // Required options
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
    .addStringOption(opt =>
      opt.setName("date")
        .setDescription("Event date (e.g., 27/01/2026)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("time")
        .setDescription("Event time (e.g., 18:00 UTC)")
        .setRequired(true)
    )
    // Optional options
    .addIntegerOption(opt =>
      opt.setName("groupsize")
        .setDescription("Squad size (optional)")
        .setRequired(false)
    ),

  async execute(interaction) {
    // ✅ Dynamic staff check
    const memberRoles = interaction.member.roles.cache.map(r => r.id);
    const allowed = memberRoles.some(r => eventRoles.allowedRoles.includes(r));

    if (!allowed) {
      return interaction.reply({ content: "🚫 You do not have permission to create events.", ephemeral: true });
    }

    // Gather options
    const name = interaction.options.getString("name");
    const description = interaction.options.getString("description");
    const maxPlayers = interaction.options.getInteger("maxplayers");
    const date = interaction.options.getString("date");
    const time = interaction.options.getString("time");
    const groupSize = interaction.options.getInteger("groupsize") || null;

    // Generate event ID
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

    // Send embed confirmation
    const embed = new EmbedBuilder()
      .setTitle(`🆕 Event Created: ${name}`)
      .setDescription(description)
      .addFields(
        { name: "Max Players", value: `${maxPlayers}`, inline: true },
        { name: "Group Size", value: `${groupSize || "N/A"}`, inline: true },
        { name: "Date", value: date, inline: true },
        { name: "Time", value: time, inline: true }
      )
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
