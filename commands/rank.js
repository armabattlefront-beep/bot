const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const Canvas = require("@napi-rs/canvas");
const path = require("path");
const { getUser, getNextLevelXP, getRankName } = require("../xp"); // ✅ Correct imports

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your current rank, level, and XP"),

  async execute(interaction) {
    try {
      // ----------------------------
      // Fetch user data
      // ----------------------------
      const userId = interaction.user.id;
      const user = getUser(userId);

      const xp = Number(user.xp) || 0;
      const level = Number(user.level) || 0;
      const nextLevelXP = getNextLevelXP(level); // use xp.js function
      const progress = Math.min(xp / nextLevelXP, 1);

      // ----------------------------
      // Canvas setup
      // ----------------------------
      const width = 800;
      const height = 250;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#0b1c26";
      ctx.fillRect(0, 0, width, height);

      // Officer gold frame for higher levels
      if (level >= 30) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, width - 8, height - 8);
      }

      // Progress bar background
      ctx.fillStyle = "#1f2933";
      ctx.fillRect(40, 190, 720, 24);

      // Progress bar fill
      const grad = ctx.createLinearGradient(40, 190, 40 + 720 * progress, 214);
      grad.addColorStop(0, "#00ff99");
      grad.addColorStop(1, "#00ccff");
      ctx.fillStyle = grad;
      ctx.fillRect(40, 190, 720 * progress, 24);

      // ----------------------------
      // Text
      // ----------------------------
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Arial";
      ctx.fillText(interaction.user.username, 260, 60);

      ctx.font = "24px Arial";
      ctx.fillText(`Level: ${level}`, 260, 100);
      ctx.fillText(`XP: ${xp} / ${nextLevelXP}`, 260, 135);

      // Rank name + insignia
      const rankName = getRankName(level);
      let insigniaPath = "recruit.png"; // default
      // Map levels to insignia images
      if (level >= 5) insigniaPath = "private.png";
      if (level >= 10) insigniaPath = "corporal.png";
      if (level >= 20) insigniaPath = "sergeant.png";
      if (level >= 30) insigniaPath = "lieutenant.png";
      if (level >= 40) insigniaPath = "captain.png";
      if (level >= 50) insigniaPath = "major.png";

      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 26px Arial";
      ctx.fillText(`Rank: ${rankName}`, 260, 170);

      // Load insignia
      const insignia = await Canvas.loadImage(
        path.join(__dirname, "..", "assets", "insignia", insigniaPath)
      );
      ctx.drawImage(insignia, 200, 150, 40, 40);

      // Prestige badge if any
      if (user.prestige && user.prestige > 0) {
        const prestige = await Canvas.loadImage(
          path.join(__dirname, "..", "assets", "prestige", `prestige${user.prestige}.png`)
        );
        ctx.drawImage(prestige, 700, 30, 60, 60);
      }

      // User avatar
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

      // Create attachment
      const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: "rank.png" });

      // Reply
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
