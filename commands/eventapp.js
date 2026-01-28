const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");

const { getAllEvents, addEventSignup } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventapp")
    .setDescription("Sign up for an open event"),

  async execute(interaction) {
    const allEvents = getAllEvents();

    // =======================
    // FILTER OPEN EVENTS
    // =======================
    const openEvents = Object.values(allEvents).filter(e => {
      const signups = Array.isArray(e.signups) ? e.signups : [];
      return signups.length < e.maxPlayers;
    });

    if (!openEvents.length) {
      return interaction.reply({
        content: "❌ No open events at the moment.",
        ephemeral: true
      });
    }

    // =======================
    // BUILD SELECT OPTIONS
    // =======================
    const options = openEvents.map(e => {
      const shortDesc =
        e.description.length > 80
          ? `${e.description.slice(0, 77)}...`
          : e.description;

      return {
        label:
          e.name.length > 25
            ? `${e.name.slice(0, 22)}...`
            : e.name,
        value: e.id,
        description: `${e.date} | ${e.time} | ${shortDesc}`.slice(0, 100)
      };
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("event_select")
      .setPlaceholder("Select an event to join")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: "Select an event to sign up:",
      components: [row],
      ephemeral: true
    });

    // =======================
    // COLLECTOR
    // =======================
    const collector = interaction.channel.createMessageComponentCollector({
      filter: i =>
        i.customId === "event_select" &&
        i.user.id === interaction.user.id,
      time: 60_000,
      max: 1
    });

    collector.on("collect", async i => {
      const eventId = i.values[0];
      const event = allEvents[eventId];

      if (!event) {
        return i.update({
          content: "❌ Event not found.",
          components: [],
          ephemeral: true
        });
      }

      // =======================
      // STAFF CHECK
      // =======================
      const member = await i.guild.members.fetch(i.user.id);
      const isStaff = member.roles.cache.some(r =>
        r.name.toLowerCase().includes("staff")
      );

      try {
        const success = addEventSignup(eventId, i.user.id, isStaff);

        if (!success) {
          return i.update({
            content: "❌ You are already signed up for this event.",
            components: [],
            ephemeral: true
          });
        }

        // =======================
        // BUILD SIGNUP LISTS
        // =======================
        const signups = event.signups ?? [];

        const playerSignups =
          signups
            .filter(s => !s.isStaff)
            .map(s => `<@${s.id}>`)
            .join(", ") || "None";

        const staffSignups =
          signups
            .filter(s => s.isStaff)
            .map(s => `<@${s.id}>`)
            .join(", ") || "None";

        // =======================
        // CONFIRMATION EMBED
        // =======================
        const embed = new EmbedBuilder()
          .setTitle(`✅ Signed Up: ${event.name}`)
          .setDescription(event.description)
          .addFields(
            { name: "Date", value: String(event.date), inline: true },
            { name: "Time", value: String(event.time), inline: true },
            {
              name: "Group Size",
              value: event.groupSize ? String(event.groupSize) : "N/A",
              inline: true
            },
            { name: "Players", value: playerSignups, inline: false },
            { name: "Staff", value: staffSignups, inline: false },
            {
              name: "Current Signups",
              value: `${signups.length}/${event.maxPlayers}`,
              inline: true
            }
          )
          .setColor(isStaff ? 0xff9900 : 0x00ff00)
          .setTimestamp();

        await i.update({
          content: "You have successfully signed up!",
          embeds: [embed],
          components: [],
          ephemeral: true
        });

      } catch (err) {
        console.error("❌ Event signup failed:", err);

        await i.update({
          content: "❌ Failed to sign up for the event.",
          components: [],
          ephemeral: true
        });
      }
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") {
        interaction.editReply({
          content: "⌛ Event signup timed out.",
          components: [],
          ephemeral: true
        }).catch(() => {});
      }
    });
  }
};
