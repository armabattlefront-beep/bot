const { SlashCommandBuilder } = require("discord.js");
const { createEvent } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createevent")
    .setDescription("Create a new BattleFront event")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Name of the event")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("maxplayers")
        .setDescription("Maximum number of players")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("groupsize")
        .setDescription("Optional: number of players per squad (default 6)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const name = interaction.options.getString("name");
    const maxPlayers = interaction.options.getInteger("maxplayers");
    const groupSize = interaction.options.getInteger("groupsize") || 6;

    const id = createEvent(name, maxPlayers, groupSize);
    if (!id) {
      return interaction.reply({ content: "⚠️ An event with that name already exists!", ephemeral: true });
    }

    interaction.reply({
      content: `✅ Event **${name}** created! Max Players: ${maxPlayers}, Group Size: ${groupSize}`
    });
  }
};
