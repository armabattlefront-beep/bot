const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { loadLevels, getRankName, getNextLevelXP } = require("../xp");
const Canvas = require("@napi-rs/canvas"); // or "canvas" if you use that package

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your current rank, level, and XP as a BattleFront-style card"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const levels = loadLevels();
      const userData = levels[userId] || { xp: 0, level: 0 };

      const currentXP = userData.xp;
      const nextLevelXP = getNextLevelXP(userData.level);

      // Progress for bar
      const progress = Math.min(currentXP / nextLevelXP, 1);

      // Canvas setup
      const width = 800;
      const height = 250;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);

      // Accent bar
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(0, height - 40, width * progress, 40);

      // Border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, width, height);

      // Username
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px Sans";
      ctx.fillText(interaction.user.username, 180, 60);

      // Rank
      ctx.font = "bold 30px Sans";
      ctx.fillText(`Rank: ${getRankName(userData.level)}`, 180, 110);

      // Level
      ctx.fillText(`Level: ${userData.level}`, 180, 150);

      // XP
      ctx.fillText(`XP: ${currentXP} / ${nextLevelXP}`, 180, 190);

      // Avatar
      const avatar = await Canvas.loadImage(
        interaction.user.displayAvatarURL({ extension: "png", size: 256 })
      );
      ctx.save();
      ctx.beginPath();
      ctx.arc(100, 125, 100, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 0, 25, 200, 200);
      ctx.restore();

      // Next rank hint
      let nextRank = "Top Rank!";
      if (userData.level < 15) nextRank = "Sergeant";
      else if (userData.level < 30) nextRank = "Commander";
      else if (userData.level < 50) nextRank = "General";

      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 26px Sans";
      ctx.fillText(`Next Rank: ${nextRank}`, 500, 50);

      // Convert to buffer and send
      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "rank_card.png"
      });

      await interaction.reply({ files: [attachment] });

    } catch (err) {
      console.error("❌ Error generating rank card:", err);
      await interaction.reply({ content: "❌ Failed to generate rank card", ephemeral: true });
    }
  }
};
