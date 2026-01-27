const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { addEventSignup, getAllEvents } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventapp")
    .setDescription("Sign up for a BattleFront event"),

  async execute(interaction) {
    const events = Object.values(getAllEvents()).filter(ev => ev.signups.length < ev.maxPlayers);
    if (!events.length) {
      return interaction.reply({ content: "⚠️ There are no open events available.", ephemeral: true });
    }

    // Create dropdown options
    const options = events.map(ev => ({
      label: ev.name,
      value: ev.id,
      description: ev.description.substring(0, 100) // max 100 chars for Discord dropdown
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("event_select")
        .setPlaceholder("Select an event to join")
        .addOptions(options)
    );

    await interaction.reply({ content: "📋 Select an event to join:", components: [row], ephemeral: true });

    const filter = i => i.customId === "event_select" && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on("collect", async i => {
      const eventId = i.values[0];
      const event = events.find(ev => ev.id === eventId);
      if (!event) return i.update({ content: "❌ Event not found.", components: [], ephemeral: true });

      // Add signup
      if (event.signups.find(s => s.userId === interaction.user.id)) {
        return i.update({ content: "⚠️ You are already signed up for this event.", components: [], ephemeral: true });
      }

      event.signups.push({ userId: interaction.user.id, role: "pending" });
      addEventSignup(eventId, { userId: interaction.user.id, role: "pending" });

      const embed = new EmbedBuilder()
        .setTitle(`✅ Signed Up: ${event.name}`)
        .setDescription(event.description)
        .addFields(
          { name: "Max Players", value: `${event.maxPlayers}`, inline: true },
          { name: "Group Size", value: `${event.groupSize || "N/A"}`, inline: true },
          { name: "Date", value: `${event.date}`, inline: true },
          { name: "Time", value: `${event.time}`, inline: true },
          { name: "Remaining Spots", value: `${event.maxPlayers - event.signups.length}`, inline: true }
        )
        .setColor(0x1abc9c)
        .setTimestamp();

      await i.update({ content: null, embeds: [embed], components: [], ephemeral: true });

      // Optionally notify mod channel
      const modChannel = interaction.client.channels.cache.get(process.env.MOD_LOG_CHANNEL);
      if (modChannel) {
        modChannel.send({ content: `<@${interaction.user.id}> signed up for **${event.name}**` });
      }
    });

    collector.on("end", collected => {
      if (collected.size === 0) {
        interaction.editReply({ content: "⌛ Event selection timed out.", components: [], ephemeral: true }).catch(() => {});
      }
    });
  }
};
