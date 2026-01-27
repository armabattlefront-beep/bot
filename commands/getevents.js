const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getAllEvents } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getevents")
    .setDescription("List all currently open events"),

  async execute(interaction) {
    const events = getAllEvents();
    const openEvents = Object.values(events).filter(ev => ev.signups.length < ev.maxPlayers);

    if (openEvents.length === 0) {
      return interaction.reply({ content: "❌ There are no open events right now.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 Open Events")
      .setColor(0x1abc9c)
      .setTimestamp();

    openEvents.forEach(ev => {
      const spotsLeft = ev.maxPlayers - ev.signups.length;
      embed.addFields({
        name: ev.name,
        value: `Max Players: ${ev.maxPlayers}\nGroup Size: ${ev.groupSize || "N/A"}\nSpots Left: ${spotsLeft}`,
        inline: false
      });
    });

    interaction.reply({ embeds: [embed] });
  }
};
