const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { MOD_LOG_CHANNEL } = require("../config");
const { sendRconCommand } = require("../rconClient");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rcon")
    .setDescription("Staff-only Arma Reforger server commands")
    .addSubcommand(sub =>
      sub.setName("say")
        .setDescription("Broadcast a message in-game")
        .addStringOption(opt => opt.setName("message").setDescription("Message to broadcast").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("kick")
        .setDescription("Kick a player")
        .addStringOption(opt => opt.setName("player").setDescription("Player name").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("ban")
        .setDescription("Ban a player")
        .addStringOption(opt => opt.setName("player").setDescription("Player name").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason").setRequired(false))
    )
    .addSubcommand(sub => sub.setName("restart").setDescription("Restart the mission"))
    .addSubcommand(sub => sub.setName("reassign").setDescription("Reassign roles"))
    .addSubcommand(sub => sub.setName("lock").setDescription("Lock server"))
    .addSubcommand(sub => sub.setName("unlock").setDescription("Unlock server"))
    .addSubcommand(sub => sub.setName("shutdown").setDescription("Shutdown server"))
    .addSubcommand(sub => sub.setName("restartserver").setDescription("Shutdown & restart server"))
    .addSubcommand(sub =>
      sub.setName("mission")
        .setDescription("Change mission")
        .addStringOption(opt => opt.setName("filename").setDescription("Mission filename").setRequired(true))
        .addStringOption(opt => opt.setName("difficulty").setDescription("Difficulty (optional)").setRequired(false))
    )
    .addSubcommand(sub => sub.setName("userlist").setDescription("List all players online")),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    let cmd = "";

    switch (sub) {
      case "say":
        const message = interaction.options.getString("message");
        cmd = `#say "${message}"`;
        break;
      case "kick":
        const kickPlayer = interaction.options.getString("player");
        const kickReason = interaction.options.getString("reason") || "";
        cmd = `#kick "${kickPlayer}" "${kickReason}"`;
        break;
      case "ban":
        const banPlayer = interaction.options.getString("player");
        const banReason = interaction.options.getString("reason") || "";
        cmd = `#exec ban "${banPlayer}" "${banReason}"`;
        break;
      case "restart": cmd = "#restart"; break;
      case "reassign": cmd = "#reassign"; break;
      case "lock": cmd = "#lock"; break;
      case "unlock": cmd = "#unlock"; break;
      case "shutdown": cmd = "#shutdown"; break;
      case "restartserver": cmd = "#restartserver"; break;
      case "mission":
        const file = interaction.options.getString("filename");
        const diff = interaction.options.getString("difficulty") || "";
        cmd = `#mission ${file} ${diff}`.trim();
        break;
      case "userlist": cmd = "#userlist"; break;
      default:
        return interaction.reply({ content: "❌ Unknown RCON command", ephemeral: true });
    }

    const res = await sendRconCommand(cmd);
    await interaction.reply({ content: `✅ Command executed: \`${cmd}\`\n\`\`\`${res || "No response"}\`\`\``, ephemeral: true });

    const logCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
    if (logCh) logCh.send(`🖥 RCON: ${interaction.user.tag} ran \`${cmd}\``).catch(() => {});
  },
};
