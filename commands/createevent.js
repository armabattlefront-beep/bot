const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { saveEvent, getAllEvents } = require("../database/events");
const eventRoles = require("../eventRoles.json");

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
    .addStringOption(opt =>
      opt.setName("date")
        .setDescription("Event date (YYYY-MM-DD)")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("time")
        .setDescription("Event time (HH:MM, 24h)")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("groupsize")
        .setDescription("Squad size (optional)")
    )
    .addStringOption(opt =>
      opt.setName("voicechannel")
        .setDescription("Voice channel ID for Discord event")
    ),

  async execute(interaction) {
    // =======================
    // PERMISSION CHECK
    // =======================
    const memberRoles = interaction.member.roles.cache.map(r => r.id);
    const allowed = memberRoles.some(r =>
      eventRoles.allowedRoles.includes(r)
    );

    if (!allowed) {
      return interaction.reply({
        content: "🚫 You do not have permission to create events.",
        ephemeral: true
      });
    }

    // =======================
    // INPUT COLLECTION
    // =======================
    const name = interaction.options.getString("name").trim();
    const description = interaction.options.getString("description").trim();
    const maxPlayers = interaction.options.getInteger("maxplayers");
    const date = interaction.options.getString("date");
    const time = interaction.options.getString("time");
    const groupSize = interaction.options.getInteger("groupsize") ?? null;
    const voiceChannelId = interaction.options.getString("voicechannel");

    // =======================
    // DATE VALIDATION (CRITICAL)
    // =======================
    const startTime = new Date(`${date}T${time}:00`);

    if (isNaN(startTime.getTime())) {
      return interaction.reply({
        content: "❌ Invalid date or time format. Use YYYY-MM-DD and HH:MM (24h).",
        ephemeral: true
      });
    }

    if (startTime < new Date()) {
      return interaction.reply({
        content: "❌ Event time must be in the future.",
        ephemeral: true
      });
    }

    // =======================
    // EVENT ID + DUPLICATE CHECK
    // =======================
    const eventId = name.toLowerCase().replace(/[^a-z0-9]/gi, "_");
    const allEvents = getAllEvents();

    if (allEvents[eventId]) {
      return interaction.reply({
        content: "❌ An event with this name already exists.",
        ephemeral: true
      });
    }

    // =======================
    // SAVE TO DATABASE (SAFE DATA ONLY)
    // =======================
    saveEvent(eventId, {
      id: eventId,
      name,
      description,
      maxPlayers,
      groupSize,
      date,
      time,
      timestamp: startTime.getTime(),
      signups: []
    });

    // =======================
    // CONFIRMATION EMBED
    // =======================
    const embed = new EmbedBuilder()
      .setTitle(`🆕 Event Created: ${name}`)
      .setDescription(description)
      .addFields(
        { name: "Max Players", value: `${maxPlayers}`, inline: true },
        { name: "Group Size", value: groupSize ? `${groupSize}` : "N/A", inline: true },
        { name: "Date", value: date, inline: true },
        { name: "Time", value: time, inline: true }
      )
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // =======================
    // DISCORD SCHEDULED EVENT
    // =======================
    if (voiceChannelId) {
      try {
        const discordEvent =
          await interaction.guild.scheduledEvents.create({
            name,
            description: `${description}\n\nMax Players: ${maxPlayers}`,
            scheduledStartTime: startTime,
            privacyLevel: 2, // GUILD_ONLY
            entityType: 2,   // VOICE
            channel: voiceChannelId
          });

        await interaction.followUp({
          content: `✅ Discord Scheduled Event created: **${discordEvent.name}**`,
          ephemeral: true
        });
      } catch (err) {
        console.error("❌ Discord event creation failed:", err);

        await interaction.followUp({
          content: "⚠️ Event saved, but Discord Scheduled Event failed to create.",
          ephemeral: true
        });
      }
    }
  }
};
