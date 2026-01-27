const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { loadLevels, getRankName, getNextLevelXP } = require("../xp");
const Canvas = require("@napi-rs/canvas"); // or "canvas" if you use that package
const path = require("path");
const fs = require("fs");

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

      // Canvas setup
      const width = 800;
      const height = 250;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);

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

      // Username
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px Sans";
      ctx.fillText(interaction.user.username, 180, 60);

      // Rank
      const rankName = getRankName(userData.level);
      ctx.font = "bold 30px Sans";
      ctx.fillText(`Rank: ${rankName}`, 180, 110);

      // Level
      ctx.fillText(`Level: ${userData.level}`, 180, 150);

      // XP
      ctx.fillText(`XP: ${currentXP} / ${nextLevelXP}`, 180, 190);

      // Smooth gradient progress bar
      const barWidth = width - 160;
      const barHeight = 30;
      const barX = 140;
      const barY = height - 60;

      // Background
      ctx.fillStyle = "#333";
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      // Gradient fill
      const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      gradient.addColorStop(0, "#00ff00"); // green
      gradient.addColorStop(0.5, "#ffff00"); // yellow
      gradient.addColorStop(1, "#ff4500"); // red
      ctx.fillStyle = gradient;
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);

      // Next rank hint
      let nextRank = "Top Rank!";
      if (userData.level < 15) nextRank = "Sergeant";
      else if (userData.level < 30) nextRank = "Commander";
      else if (userData.level < 50) nextRank = "General";

      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 26px Sans";
      ctx.fillText(`Next Rank: ${nextRank}`, 500, 50);

      // Add rank emblem if exists
      const emblemPath = path.join(__dirname, "../assets/ranks", `${rankName.toLowerCase()}.png`);
      if (fs.existsSync(emblemPath)) {
        const emblem = await Canvas.loadImage(emblemPath);
        ctx.drawImage(emblem, width - 110, 20, 80, 80);
      }

      // Convert to buffer and send
      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "rank_card.png"
      });

      await interaction.reply({ files: [attachment] });
    } catch (err) {
      console.error("❌ Error generating rank card:", err);
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Failed to generate rank card", ephemeral: true });
      }
    }
  }
};
