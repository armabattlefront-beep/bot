const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const { getAllEvents, getEvent, addEventSignup } = require("../database/events");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventapp")
    .setDescription("Sign up for a BattleFront event"),

  async execute(interaction) {
    try {
      const allEvents = getAllEvents();
      const openEvents = Object.values(allEvents).filter(e => e.signups.length < e.maxPlayers);

      if (!openEvents.length) {
        return interaction.reply({ content: "⚠️ There are no open events at the moment.", ephemeral: true });
      }

      // Build dropdown menu
      const options = openEvents.map(e => ({
        label: e.name,
        description: `${e.date} @ ${e.time} | Max: ${e.maxPlayers}`,
        value: e.id
      }));

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("event_signup")
          .setPlaceholder("Select an event to join")
          .addOptions(options)
      );

      await interaction.reply({ content: "Please select an event to sign up:", components: [row], ephemeral: true });

      // Wait for user selection
      const filter = i => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

      collector.on("collect", async i => {
        const eventId = i.values[0];
        const event = getEvent(eventId);

        if (!event) {
          return i.update({ content: "❌ Event not found.", components: [], ephemeral: true });
        }

        // Check if user already signed up
        if (event.signups.find(s => s.userId === i.user.id)) {
          return i.update({ content: "⚠️ You are already signed up for this event.", components: [], ephemeral: true });
        }

        // Check if event is full
        if (event.signups.length >= event.maxPlayers) {
          return i.update({ content: "⚠️ Event full. You're on the waiting list.", components: [], ephemeral: true });
        }

        // Add signup
        addEventSignup(eventId, { userId: i.user.id, role: "pending" });

        // Reply to user
        await i.update({ content: `✅ You have signed up for **${event.name}**!\nRemaining spots: ${event.maxPlayers - event.signups.length}`, components: [], ephemeral: true });

        // Notify mod channel
        const modCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
        if (modCh) {
          const embed = new EmbedBuilder()
            .setTitle("📝 Event Signup")
            .setDescription(`<@${i.user.id}> signed up for **${event.name}**`)
            .addFields({ name: "Remaining Spots", value: `${event.maxPlayers - event.signups.length}`, inline: true })
            .setColor(0x1abc9c)
            .setTimestamp();

          modCh.send({ embeds: [embed] });
        }
      });

      collector.on("end", collected => {
        if (!collected.size) {
          interaction.editReply({ content: "❌ You did not select an event in time.", components: [], ephemeral: true });
        }
      });
    } catch (err) {
      console.error(err);
      if (!interaction.replied) {
        interaction.reply({ content: "❌ Something went wrong while signing up.", ephemeral: true });
      }
    }
  }
};
