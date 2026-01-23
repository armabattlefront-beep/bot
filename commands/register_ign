const { SlashCommandBuilder } = require("discord.js");
const { register } = require("../database/gamertags");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register_ign")
    .setDescription("Register your in-game gamertag")
    .addStringOption(opt => 
      opt.setName("gamertag")
         .setDescription("Your in-game name")
         .setRequired(true)
    ),

  async execute(interaction) {
    const gamertag = interaction.options.getString("gamertag");
    register(interaction.user.id, gamertag);
    interaction.reply({ content: `✅ Registered **${gamertag}** as your in-game name.`, ephemeral: true });
  }
};
