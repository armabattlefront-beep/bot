const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadLevels, getRankName, getNextLevelXP } = require("../xp");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("Show your current rank, level, and XP"),
    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const levels = loadLevels();
            const userData = levels[userId] || { xp: 0, level: 0 };

            const nextLevelXP = getNextLevelXP(userData.level);
            const currentXP = userData.xp;

            // Progress bar
            const barLength = 25;
            const filled = Math.round((currentXP / nextLevelXP) * barLength);
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
                .setColor(0xffd700)
                .addFields(
                    { name: "Rank", value: `**${getRankName(userData.level)}**`, inline: true },
                    { name: "Level", value: `**${userData.level}**`, inline: true },
                    { name: "XP", value: `**${currentXP} / ${nextLevelXP}**\n${progressBar}`, inline: false },
                    { name: "Next Rank", value: `✨ ${nextRank}`, inline: true }
                )
                .setFooter({ text: "BattleFront Madness XP System" })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error executing /rank command:", error);
            await interaction.reply({ content: "❌ There was an error fetching your rank!", ephemeral: true });
        }
    }
};
