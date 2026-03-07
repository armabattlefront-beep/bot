const { SlashCommandBuilder } = require("discord.js");
const { getTop } = require("../database/xp");

module.exports = {

  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View XP leaderboard")
    .addIntegerOption(option =>
      option.setName("top")
      .setDescription("How many users")
      .setMinValue(5)
      .setMaxValue(25)
    ),

  async execute(interaction) {

    const limit = interaction.options.getInteger("top") || 10;

    const board = getTop(limit);

    let text = "🏆 **BattleFront Leaderboard**\n\n";

    board.forEach((u,i)=>{
      text += `${i+1}. <@${u.id}> — Level ${u.level} (Prestige ${u.prestige})\n`;
    });

    interaction.reply(text);

  }

};