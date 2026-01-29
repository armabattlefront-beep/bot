const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getEvent, saveEvent } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventapp")
    .setDescription("Apply for a BattleFront event")
    .addStringOption(opt =>
      opt.setName("event")
        .setDescription("Select the event")
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const eventId = interaction.options.getString("event");
    const event = getEvent(eventId);

    if (!event)
      return interaction.reply({ content: "❌ Event not found.", ephemeral: true });

    if (!event.signups) event.signups = [];

    if (event.signups.find(u => u.id === userId))
      return interaction.reply({ content: "⚠️ You already applied.", ephemeral: true });

    const firstTeamCount = event.signups.filter(u => u.status === "firstTeam").length;
    const subCount = event.signups.filter(u => u.status === "sub").length;

    let status = "wait";
    if (firstTeamCount < event.maxPlayers) status = "firstTeam";
    else if (subCount < event.maxPlayers) status = "sub";

    event.signups.push({
      id: userId,
      status,
      group: null,
      squadLeader: false
    });

    saveEvent(eventId, event);

    interaction.reply({
      content: `✅ Applied to **${event.name}**\n📌 Status: **${status.toUpperCase()}**`,
      ephemeral: true
    });
  }
};
