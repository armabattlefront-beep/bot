const { SlashCommandBuilder } = require("discord.js");
const { addApplication, getAllApplications, updateStatus } = require("../database/apps");
const { isStaff } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staffapp")
    .setDescription("Submit or manage staff applications")
    .addSubcommand(sub => sub
      .setName("submit")
      .setDescription("Submit a staff application")
      .addStringOption(o => o.setName("q1").setDescription("Why do you want to be staff?").setRequired(true))
      .addStringOption(o => o.setName("q2").setDescription("Experience / Skills").setRequired(true)))
    .addSubcommand(sub => sub
      .setName("view")
      .setDescription("Staff: View all applications"))
    .addSubcommand(sub => sub
      .setName("accept")
      .setDescription("Staff: Accept an application")
      .addStringOption(o => o.setName("userid").setDescription("Discord user ID").setRequired(true)))
    .addSubcommand(sub => sub
      .setName("reject")
      .setDescription("Staff: Reject an application")
      .addStringOption(o => o.setName("userid").setDescription("Discord user ID").setRequired(true))),
  
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    
    if (sub === "submit") {
      const q1 = interaction.options.getString("q1");
      const q2 = interaction.options.getString("q2");
      const success = addApplication(interaction.user.id, { q1, q2 });
      if (!success) return interaction.reply({ content: "⚠️ You already have a pending application.", ephemeral: true });
      return interaction.reply({ content: "✅ Application submitted!" });
    }
    
    if (!isStaff(interaction.member)) return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    if (sub === "view") {
      const apps = getAllApplications();
      if (!apps.length) return interaction.reply({ content: "No applications found." });
      const list = apps.map(a => `<@${a.id}> - ${a.status}`).join("\n");
      return interaction.reply({ content: list });
    }

    if (sub === "accept" || sub === "reject") {
      const userId = interaction.options.getString("userid");
      const status = sub === "accept" ? "accepted" : "rejected";
      const success = updateStatus(userId, status);
      if (!success) return interaction.reply({ content: "❌ Application not found." });
      return interaction.reply({ content: `✅ Application ${status} for <@${userId}>` });
    }
  }
};
