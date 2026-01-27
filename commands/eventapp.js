const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { addEventSignup, getEvent, getAllEvents } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventapp")
    .setDescription("Sign up for a BattleFront event")
    .addStringOption(opt => {
      const events = Object.values(getAllEvents())
        .filter(ev => ev.signups.length < ev.maxPlayers)
        .map(ev => ev.name);

      opt.setName("event")
        .setDescription("Select an event to join")
        .setRequired(true);

      if (events.length > 0) opt.addChoices(...events.map(e => ({ name: e, value: e })));
      return opt;
    }),

  async execute(interaction) {
    const userId = interaction.user.id;
    const eventName = interaction.options.getString("event");
    const eventId = eventName.toLowerCase().replace(/\s+/g, "_");
    const event = getEvent(eventId);

    if (!event) return interaction.reply({ content: `❌ Event "${eventName}" not found.`, ephemeral: true });

    // Check if full
    if (event.signups.length >= event.maxPlayers) {
      return interaction.reply({ content: `⚠️ Event full. You're on the waiting list.`, ephemeral: true });
    }

    // Add signup
    addEventSignup(eventId, { userId, role: "pending" });

    // Confirm to user
    await interaction.reply({
      content: `✅ You have signed up for **${event.name}**!\nRemaining spots: ${event.maxPlayers - event.signups.length}`
    });

    // Notify mod channel
    const modChannel = interaction.client.channels.cache.get(event.modChannel || "");
    if (modChannel) {
      const embed = new EmbedBuilder()
        .setTitle("📝 Event Signup")
        .setDescription(`<@${userId}> signed up for **${event.name}**`)
        .addFields(
          { name: "Remaining Spots", value: `${event.maxPlayers - event.signups.length}`, inline: true },
          { name: "Group Size", value: `${event.groupSize || "N/A"}`, inline: true }
        )
        .setColor(0x1abc9c)
        .setTimestamp();
      modChannel.send({ embeds: [embed] });
    }
  }
};
