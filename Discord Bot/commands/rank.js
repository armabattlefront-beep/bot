const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadLevels, getRankName, xpForLevel } = require("../xp");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("Show your current rank, level, and XP"),
    async execute(interaction) {
        const userId = interaction.user.id;
        const levels = loadLevels();
        const userData = levels[userId] || { xp: 0, level: 0 };

        const nextLevelXP = xpForLevel(userData.level + 1);
        const currentXP = userData.xp;
        const xpProgress = Math.min(currentXP, nextLevelXP);

        // Create a clean progress bar
        const barLength = 25;
        const filled = Math.round((xpProgress / nextLevelXP) * barLength);
        const empty = barLength - filled;
        const progressBar = "🟩".repeat(filled) + "⬛".repeat(empty);

        // Next rank hint
        let nextRank = "Top Rank!";
        if (userData.level < 15) nextRank = "Sergeant";
        else if (userData.level < 30) nextRank = "Commander";
        else if (userData.level < 50) nextRank = "General";

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Rank`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor(0xffd700) // gold for boujee
            .addFields(
                { name: "Rank", value: `**${getRankName(userData.level)}**`, inline: true },
                { name: "Level", value: `**${userData.level}**`, inline: true },
                { name: "XP", value: `**${currentXP} / ${nextLevelXP}**\n${progressBar}`, inline: false },
                { name: "Next Rank", value: `✨ ${nextRank}`, inline: true }
            )
            .setFooter({ text: "BattleFront Madness XP System" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
