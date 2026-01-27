const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { createEvent, deleteEvent, getAllEvents, getEvent, signupEvent, assignStatus, assignGroups } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventapp")
    .setDescription("Sign up or manage events")
    .addSubcommand(sub => sub.setName("create").setDescription("Create an event")
      .addStringOption(o => o.setName("name").setDescription("Event name").setRequired(true))
      .addIntegerOption(o => o.setName("maxplayers").setDescription("Max players").setRequired(true)))
    .addSubcommand(sub => sub.setName("delete").setDescription("Delete an event")
      .addStringOption(o => o.setName("id").setDescription("Event ID").setRequired(true)))
    .addSubcommand(sub => sub.setName("view").setDescription("View all events"))
    .addSubcommand(sub => sub.setName("signup").setDescription("Sign up for an event")
      .addStringOption(o => o.setName("id").setDescription("Event ID").setRequired(true)))
    .addSubcommand(sub => sub.setName("assign").setDescription("Assign participant status")
      .addStringOption(o => o.setName("id").setDescription("Event ID").setRequired(true))
      .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
      .addStringOption(o => o.setName("status").setDescription("firstTeam/substitute").setRequired(true)))
    .addSubcommand(sub => sub.setName("groups").setDescription("Assign groups of 6 to participants")
      .addStringOption(o => o.setName("id").setDescription("Event ID").setRequired(true))),
  
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "signup") {
      const id = interaction.options.getString("id");
      const success = signupEvent(id, interaction.user.id);
      if (!success) return interaction.reply({ content: "⚠️ Could not sign up (maybe full or already signed up).", ephemeral: true });
      return interaction.reply({ content: "✅ Signed up for event!" });
    }

    if (!isStaff(interaction.member)) return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    if (sub === "create") {
      const name = interaction.options.getString("name");
      const maxPlayers = interaction.options.getInteger("maxplayers");
      const id = createEvent(name, maxPlayers);
      if (!id) return interaction.reply({ content: "⚠️ Event already exists." });
      return interaction.reply({ content: `✅ Event created: ${name}` });
    }

    if (sub === "delete") {
      const id = interaction.options.getString("id");
      const success = deleteEvent(id);
      if (!success) return interaction.reply({ content: "❌ Event not found." });
      return interaction.reply({ content: "✅ Event deleted." });
    }

    if (sub === "view") {
      const events = getAllEvents();
      if (!events.length) return interaction.reply({ content: "No events found." });
      const list = events.map(e => `${e.name} (${e.participants.length}/${e.maxPlayers})`).join("\n");
      return interaction.reply({ content: list });
    }

    if (sub === "assign") {
      const id = interaction.options.getString("id");
      const user = interaction.options.getUser("user");
      const status = interaction.options.getString("status").toLowerCase();
      if (!["firstteam", "substitute"].includes(status)) return interaction.reply({ content: "Invalid status.", ephemeral: true });
      const success = assignStatus(id, user.id, status);
      if (!success) return interaction.reply({ content: "❌ Could not assign status.", ephemeral: true });
      return interaction.reply({ content: `✅ ${user.tag} set as ${status}` });
    }

    if (sub === "groups") {
      const id = interaction.options.getString("id");
      const success = assignGroups(id);
      if (!success) return interaction.reply({ content: "❌ Could not assign groups.", ephemeral: true });
      return interaction.reply({ content: "✅ Groups assigned!" });
    }
  }
};
