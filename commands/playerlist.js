// commands/playerlist.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { sendRconCommand } = require("../rconClient");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playerlist")
        .setDescription("Fetch current Arma Reforger server player list"),

    async execute(interaction) {
        await interaction.deferReply(); // Gives the bot time to fetch RCON data

        try {
            // Send the RCON command to get players
            const raw = await sendRconCommand("#userlist");

            if (!raw) {
                return interaction.editReply("❌ Could not fetch player list. Server may be offline.");
            }

            // Example: parse raw response
            // Adjust this parsing depending on your RCON server output
            // Typical output: "1. Player1\n2. Player2\n..."
            const lines = raw.split("\n").filter(l => l.trim() !== "");
            const playerCount = lines.length;

            const embed = new EmbedBuilder()
                .setTitle("🎮 Arma Reforger Player List")
                .setDescription(lines.length ? lines.join("\n") : "No players online")
                .setColor("#2ecc71")
                .setFooter({ text: `Players online: ${playerCount}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error("❌ Error fetching player list:", err);
            await interaction.editReply("❌ Error fetching player list.");
        }
    },
};
