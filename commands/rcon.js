const { SlashCommandBuilder } = require("discord.js");
const { sendRconCommand } = require("../rconClient");
const { isStaff } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rcon")
    .setDescription("Send a command to the Arma Reforger server via RCON")
    .addStringOption(opt =>
      opt.setName("command")
        .setDescription("The command to send")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Only allow staff to use RCON commands
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const cmd = interaction.options.getString("command");

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await sendRconCommand(cmd, 10000); // 10s timeout
      const replyText = result ? `📤 Command executed:\n\`\`\`\n${result}\n\`\`\`` : "✅ Command sent successfully (no output).";
      await interaction.editReply({ content: replyText });
    } catch (err) {
      console.error("RCON command error:", err);
      await interaction.editReply({ content: `❌ Failed to send RCON command: ${err.message}` });
    }
  }
};
