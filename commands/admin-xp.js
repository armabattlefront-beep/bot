// commands/admin-xp.js
const { SlashCommandBuilder } = require("discord.js");
const { addXP, setLevel, toggleDoubleXP, isDoubleXP } = require("../database/xp");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin-xp")
    .setDescription("Admin XP management commands")
    .addSubcommand(sub =>
      sub
        .setName("givexp")
        .setDescription("Give XP to a user")
        .addUserOption(opt => opt.setName("user").setDescription("Target user").setRequired(true))
        .addIntegerOption(opt => opt.setName("amount").setDescription("Amount of XP").setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName("setlevel")
        .setDescription("Set a user's level")
        .addUserOption(opt => opt.setName("user").setDescription("Target user").setRequired(true))
        .addIntegerOption(opt => opt.setName("level").setDescription("New level").setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName("doublexp")
        .setDescription("Toggle double XP on/off")
    ),

  async execute(interaction) {
    try {
      // ---------- Admin check ----------
      if (!interaction.member.roles.cache.some(r => Object.values(config.STAFF_ROLE_IDS).includes(r.id))) {
        return interaction.reply({ content: "❌ You do not have permission.", ephemeral: true });
      }

      const sub = interaction.options.getSubcommand();

      if (sub === "givexp") {
        const target = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        // addXP now automatically handles DOUBLE XP
        const user = addXP(target.id, amount);

        return interaction.reply({
          content: `✅ Gave **${amount} XP** to <@${target.id}>${isDoubleXP() ? " (Double XP applied!)" : ""}.\n` +
                   `New Level: **${user.level}** | XP: **${user.xp}**`,
          ephemeral: true
        });
      }

      if (sub === "setlevel") {
        const target = interaction.options.getUser("user");
        const level = interaction.options.getInteger("level");

        setLevel(target.id, level);

        return interaction.reply({
          content: `✅ Set <@${target.id}>'s level to **${level}**.`,
          ephemeral: true
        });
      }

      if (sub === "doublexp") {
        const newState = toggleDoubleXP(); // toggles global double XP
        return interaction.reply({
          content: `⚡ Double XP is now **${newState ? "ENABLED" : "DISABLED"}**.`,
          ephemeral: true
        });
      }

    } catch (err) {
      console.error("❌ Admin XP command failed:", err);
      return interaction.reply({ content: "❌ Something went wrong.", ephemeral: true });
    }
  }
};
