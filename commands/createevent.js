const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { createEvent } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createevent")
    .setDescription("Create a new BattleFront event")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Event name")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("maxspots")
        .setDescription("Maximum participants")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("modchannel")
        .setDescription("Channel ID for mod notifications")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member))
      return interaction.reply({ content: "🚫 Staff only", ephemeral: true });

    const name = interaction.options.getString("name");
    const maxSpots = interaction.options.getInteger("maxspots");
    const modChannel = interaction.options.getString("modchannel") || null;

    const created = createEvent(name, maxSpots, modChannel);
    if (!created) return interaction.reply({ content: `⚠️ Event "${name}" already exists.`, ephemeral: true });

    interaction.reply({ content: `✅ Event "${name}" created with ${maxSpots} spots.` });
  }
};
