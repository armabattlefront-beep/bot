const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const Canvas = require("@napi-rs/canvas");
const { getUser } = require("../xp"); // 🔥 USE DATABASE XP

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your current rank, level, and XP"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const user = getUser(userId);

      const xp = Number(user.xp) || 0;
      const level = Number(user.level) || 0;

      const nextLevelXP = (level + 1) * 1000;
      const progress = Math.min(xp / nextLevelXP, 1);

      const width = 800;
      const height = 250;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#0b1c26";
      ctx.fillRect(0, 0, width, height);

      // Progress bar background
      ctx.fillStyle = "#1f2933";
      ctx.fillRect(40, 190, 720, 24);

      // Progress bar fill
      ctx.fillStyle = "#00ff99";
      ctx.fillRect(40, 190, 720 * progress, 24);

      // Border
      ctx.strokeStyle = "#00ff99";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, width, height);

      // Text (FORCE SAFE FONT)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Arial";

      // Username
      ctx.fillText(interaction.user.username, 260, 60);

      ctx.font = "24px Arial";
      ctx.fillText(`Level: ${level}`, 260, 100);
      ctx.fillText(`XP: ${xp} / ${nextLevelXP}`, 260, 135);

      // Rank name
      let rankName = "Recruit";
      if (level >= 5) rankName = "Private";
      if (level >= 10) rankName = "Corporal";
      if (level >= 20) rankName = "Sergeant";
      if (level >= 30) rankName = "Lieutenant";
      if (level >= 40) rankName = "Captain";
      if (level >= 50) rankName = "Major";

      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 26px Arial";
      ctx.fillText(`Rank: ${rankName}`, 260, 170);

      // Avatar
      const avatar = await Canvas.loadImage(
        interaction.user.displayAvatarURL({ extension: "png", size: 256 })
      );

      ctx.save();
      ctx.beginPath();
      ctx.arc(140, 125, 90, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 50, 35, 180, 180);
      ctx.restore();

      const attachment = new AttachmentBuilder(
        await canvas.encode("png"),
        { name: "rank.png" }
      );

      await interaction.reply({ files: [attachment] });

    } catch (err) {
      console.error("❌ Rank card error:", err);
      await interaction.reply({
        content: "❌ Failed to generate rank card.",
        ephemeral: true
      });
    }
  }
};
