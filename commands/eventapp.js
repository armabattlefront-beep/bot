const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { signupEvent, getEvent, addToWaitingList } = require("../database/apps");

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
    const eventId = interaction.options.getString("event");

    const event = getEvent(eventId);
    if (!event) return interaction.reply({ content: `❌ Event "${eventId}" not found.`, ephemeral: true });

    // Check if user already signed up or waiting
    if (event.participants.find(p => p.id === userId) || event.waitingList?.includes(userId)) {
      return interaction.reply({ content: `⚠️ You are already signed up or on the waiting list for **${event.name}**.`, ephemeral: true });
    }

    const spotsLeft = event.maxPlayers - event.participants.length;

    if (spotsLeft > 0) {
      signupEvent(eventId, userId);
      interaction.reply({ content: `✅ You have signed up for **${event.name}**!\nRemaining spots: ${spotsLeft - 1}` });
    } else {
      addToWaitingList(eventId, userId);
      interaction.reply({ content: `⚠️ Event full. You have been added to the waiting list for **${event.name}**.` });
    }

    // Notify mod channel
    const modChannel = interaction.client.channels.cache.get(event.modChannel || "");
    if (modChannel) {
      const embed = new EmbedBuilder()
        .setTitle("📝 Event Signup")
        .setDescription(`<@${userId}> signed up for **${event.name}**`)
        .addFields({ name: "Remaining Spots", value: `${Math.max(spotsLeft - 1, 0)}`, inline: true })
        .setColor(0x1abc9c)
        .setTimestamp();
      modChannel.send({ embeds: [embed] });
    }
  }
};
