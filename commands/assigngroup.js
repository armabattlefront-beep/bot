const { SlashCommandBuilder } = require("discord.js");
const { getEvent, saveEvent } = require("../database/events");
const { isStaff } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("assigngroup")
    .setDescription("Assign squad or squad leader")
    .addStringOption(o =>
      o.setName("event").setDescription("Event ID").setRequired(true))
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o =>
      o.setName("group").setDescription("Squad name").setRequired(true))
    .addBooleanOption(o =>
      o.setName("leader").setDescription("Set as squad leader")),

  async execute(interaction) {
    if (!isStaff(interaction.member))
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    const event = getEvent(interaction.options.getString("event"));
    const userId = interaction.options.getUser("user").id;
    const group = interaction.options.getString("group");
    const leader = interaction.options.getBoolean("leader");

    const user = event.signups.find(u => u.id === userId);
    if (!user)
      return interaction.reply({ content: "❌ User not in event.", ephemeral: true });

    user.group = group;
    if (leader !== null) user.squadLeader = leader;

    saveEvent(event.id, event);

    interaction.reply(`✅ <@${userId}> assigned to **${group}** ${leader ? "⭐ Squad Leader" : ""}`);
  }
};
