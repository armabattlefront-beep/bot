const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { signupEvent, getAllEvents, getEvent } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventapp")
    .setDescription("Sign up for a BattleFront event")
    .addStringOption(opt =>
      opt.setName("event")
         .setDescription("Select the event to join")
         .setRequired(true)
         .setAutocomplete(true) // enable autocomplete
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const events = getAllEvents();
    const choices = events.map(ev => ev.name);
    const filtered = choices.filter(ev => ev.toLowerCase().includes(focused.toLowerCase()));
    await interaction.respond(filtered.map(name => ({ name, value: name })));
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    const eventName = interaction.options.getString("event");

    const event = getEvent(eventName.toLowerCase().replace(/\s+/g, "_"));
    if (!event) return interaction.reply({ content: `❌ Event "${eventName}" not found.`, ephemeral: true });

    // Check if full
    if (event.participants.length >= event.maxPlayers) {
      return interaction.reply({ content: `⚠️ Event full. You're on the waiting list.`, ephemeral: true });
    }

    // Sign up
    signupEvent(eventName.toLowerCase().replace(/\s+/g, "_"), userId);

    interaction.reply({
      content: `✅ You have signed up for **${event.name}**!\nRemaining spots: ${event.maxPlayers - event.participants.length}`
    });

    // Optionally notify mod channel if set
    const modChannel = interaction.client.channels.cache.get(event.modChannel || "");
    if (modChannel) {
      const embed = new EmbedBuilder()
        .setTitle("📝 Event Signup")
        .setDescription(`<@${userId}> signed up for **${event.name}**`)
        .addFields({ name: "Remaining Spots", value: `${event.maxPlayers - event.participants.length}`, inline: true })
        .setColor(0x1abc9c)
        .setTimestamp();
      modChannel.send({ embeds: [embed] });
    }
  }
};
