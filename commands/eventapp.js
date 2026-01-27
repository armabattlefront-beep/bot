const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { addEventSignup, getEvent, getAllEvents } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventapp")
    .setDescription("Sign up for a BattleFront event")
    .addStringOption(opt =>
      opt.setName("event")
        .setDescription("Select the event to join")
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const eventName = interaction.options.getString("event");

    const event = getEvent(eventName);
    if (!event) return interaction.reply({ content: `❌ Event "${eventName}" not found.`, ephemeral: true });

    // Check if full
    if (event.signups.length >= event.maxSpots) {
      return interaction.reply({ content: `⚠️ Event full. You're on the waiting list.`, ephemeral: true });
    }

    // Add signup
    addEventSignup(eventName, { userId, role: "pending" });

    // Notify user
    interaction.reply({
      content: `✅ You have signed up for **${eventName}**!\nRemaining spots: ${event.maxSpots - event.signups.length}`
    });

    // Notify mod channel
    const modChannel = interaction.client.channels.cache.get(event.modChannel || "");
    if (modChannel) {
      const embed = new EmbedBuilder()
        .setTitle("📝 Event Signup")
        .setDescription(`<@${userId}> signed up for **${eventName}**`)
        .addFields({ name: "Remaining Spots", value: `${event.maxSpots - event.signups.length}`, inline: true })
        .setColor(0x1abc9c)
        .setTimestamp();
      modChannel.send({ embeds: [embed] });
    }
  }
};
