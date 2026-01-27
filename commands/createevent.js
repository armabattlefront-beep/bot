const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { saveEvent, getAllEvents } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createevent")
    .setDescription("Create a new event")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Event name")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("maxplayers")
        .setDescription("Maximum number of participants")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("groupsize")
        .setDescription("Squad/group size for the event")
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("modchannel")
        .setDescription("Channel ID for mod notifications")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const name = interaction.options.getString("name");
    const maxPlayers = interaction.options.getInteger("maxplayers");
    const groupSize = interaction.options.getInteger("groupsize") || 0;
    const modChannel = interaction.options.getString("modchannel") || "";

    const eventId = name.toLowerCase().replace(/\s+/g, "_");
    const allEvents = getAllEvents();

    if (allEvents[eventId]) {
      return interaction.reply({ content: "❌ Event with that name already exists.", ephemeral: true });
    }

    const newEvent = {
      name,
      maxPlayers,
      groupSize,
      modChannel,
      signups: []
    };

    saveEvent(eventId, newEvent);

    const embed = new EmbedBuilder()
      .setTitle(`✅ Event Created: ${name}`)
      .addFields(
        { name: "Max Players", value: `${maxPlayers}`, inline: true },
        { name: "Group Size", value: `${groupSize || "N/A"}`, inline: true },
        { name: "Mod Channel", value: `${modChannel || "None"}`, inline: true }
      )
      .setColor(0x1abc9c)
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
