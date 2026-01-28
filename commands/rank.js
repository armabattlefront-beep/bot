const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { loadLevels, getRankName, getNextLevelXP } = require("../xp");
const Canvas = require("@napi-rs/canvas");

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
      const progress = Math.min(currentXP / nextLevelXP, 1);

      const width = 800;
      const height = 250;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ===== BACKGROUND =====
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f2027");
      gradient.addColorStop(0.5, "#203a43");
      gradient.addColorStop(1, "#2c5364");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ===== PROGRESS BAR =====
      ctx.fillStyle = "#222";
      ctx.fillRect(0, height - 45, width, 30);

      ctx.fillStyle = "#00ff00";
      ctx.fillRect(0, height - 45, width * progress, 30);

      // ===== BORDER =====
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, width, height);

      // ===== TEXT SETTINGS (SAFE) =====
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Username
      ctx.font = "bold 36px Arial";
      ctx.fillText(interaction.user.username, 220, 30);

      // Rank
      ctx.font = "bold 26px Arial";
      ctx.fillText(`Rank: ${getRankName(userData.level)}`, 220, 80);

      // Level
      ctx.fillText(`Level: ${userData.level}`, 220, 115);

      // XP
      ctx.fillText(`XP: ${currentXP} / ${nextLevelXP}`, 220, 150);

      // ===== AVATAR =====
      const avatar = await Canvas.loadImage(
        interaction.user.displayAvatarURL({ extension: "png", size: 256 })
      );

      ctx.save();
      ctx.beginPath();
      ctx.arc(110, 125, 90, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 20, 35, 180, 180);
      ctx.restore();

      // ===== NEXT RANK =====
      let nextRank = "Top Rank!";
      if (userData.level < 15) nextRank = "Sergeant";
      else if (userData.level < 30) nextRank = "Commander";
      else if (userData.level < 50) nextRank = "General";

      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 24px Arial";
      ctx.fillText(`Next Rank: ${nextRank}`, 520, 40);

      // ===== SEND =====
      const attachment = new AttachmentBuilder(
        await canvas.encode("png"),
        { name: "rank_card.png" }
      );

      await interaction.reply({ files: [attachment] });

    } catch (err) {
      console.error("❌ Error generating rank card:", err);
      await interaction.reply({
        content: "❌ Failed to generate rank card",
        ephemeral: true
      });
    }
  }
};
