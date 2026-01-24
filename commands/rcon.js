const { SlashCommandBuilder } = require("discord.js");
const { RCON_ROLE_ID, MOD_LOG_CHANNEL } = require("../config");
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
    .addSubcommand(sub => sub.setName("userlist").setDescription("List all players online"))
    .addSubcommand(sub => sub.setName("serverstatus").setDescription("Check server status"))
    .addSubcommand(sub => sub.setName("playerlist").setDescription("List all players currently online")),

  execute: async function(interaction) {
    // ===== PERMISSION CHECK =====
    if (!interaction.member.roles.cache.has(RCON_ROLE_ID)) {
      return interaction.reply({ content: "🚫 You do not have permission to use RCON commands", ephemeral: true });
    }

    // ===== DEFER REPLY =====
    await interaction.deferReply({ ephemeral: true });

    // ===== BUILD RCON COMMAND =====
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
      case "serverstatus": cmd = "#serverstatus"; break;
      case "playerlist": cmd = "#playerlist"; break;

      default:
        return interaction.editReply({ content: "❌ Unknown RCON command" });
    }

    // ===== SEND TO RCON =====
    try {
      const res = await sendRconCommand(cmd);
      await interaction.editReply({ content: `✅ Command executed: \`${cmd}\`\n\`\`\`${res || "No response"}\`\`\`` });

      // ===== LOG TO MOD CHANNEL =====
      const logCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
      if (logCh) logCh.send(`🖥 RCON: ${interaction.user.tag} ran \`${cmd}\``).catch(() => {});

    } catch (err) {
      console.error("❌ RCON execution error:", err);
      await interaction.editReply({ content: `❌ Failed to execute RCON command: \`${cmd}\`` });
    }
  }
};
