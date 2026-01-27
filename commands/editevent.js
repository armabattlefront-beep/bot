const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getEvent, saveEvent } = require("../database/events");
const { isStaff } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editevent")
    .setDescription("Edit an existing event")
    .addStringOption(opt =>
      opt.setName("event")
        .setDescription("Event name to edit")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("maxplayers")
        .setDescription("Set maximum number of participants")
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName("groupsize")
        .setDescription("Set squad size for this event")
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("modchannel")
        .setDescription("Set a new mod notification channel ID")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const eventName = interaction.options.getString("event");
    const eventId = eventName.toLowerCase().replace(/\s+/g, "_");
    const event = getEvent(eventId);

    if (!event) return interaction.reply({ content: `❌ Event "${eventName}" not found.`, ephemeral: true });

    const maxPlayers = interaction.options.getInteger("maxplayers");
    const groupSize = interaction.options.getInteger("groupsize");
    const modChannel = interaction.options.getString("modchannel");

    if (maxPlayers) event.maxPlayers = maxPlayers;
    if (groupSize) event.groupSize = groupSize;
    if (modChannel) event.modChannel = modChannel;

    saveEvent(eventId, event);

    const embed = new EmbedBuilder()
      .setTitle(`✏️ Event Updated: ${event.name}`)
      .addFields(
        { name: "Max Players", value: `${event.maxPlayers}`, inline: true },
        { name: "Group Size", value: `${event.groupSize || "N/A"}`, inline: true },
        { name: "Mod Channel", value: `${event.modChannel || "None"}`, inline: true }
      )
      .setColor(0xffd700)
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
