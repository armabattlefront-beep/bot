const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadLevels, getRankName } = require("../xp"); // adjust path if needed

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Show the top BattleFront ranks!")
        .addIntegerOption(option =>
            option.setName("top")
                  .setDescription("Number of top users to show (default 10)")
                  .setRequired(false)
        ),

    async execute(interaction) {
        const data = loadLevels();

        if (!data || Object.keys(data).length === 0) {
            return interaction.reply("No XP data found yet!");
        }

        // Convert object to array for sorting
        const leaderboard = Object.entries(data).map(([id, userData]) => ({
            id,
            xp: userData.xp,
            level: userData.level
        }));

        // Sort by level first, then XP
        leaderboard.sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            return b.xp - a.xp;
        });

        // Optional top N parameter
        const topCount = interaction.options.getInteger("top") || 10;
        const topUsers = leaderboard.slice(0, topCount);

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle("🎖️ BattleFront Leaderboard")
            .setColor("#00FF00")
            .setTimestamp();

        let description = "";
        for (let i = 0; i < topUsers.length; i++) {
            const user = topUsers[i];
            const rankName = getRankName(user.level);
            description += `**${i + 1}. <@${user.id}>** — ${rankName} | Level ${user.level} | ⭐ ${user.xp} XP\n`;
        }

        embed.setDescription(description);

        return interaction.reply({ embeds: [embed] });
    }
};