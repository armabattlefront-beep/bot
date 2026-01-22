const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("livenow")
        .setDescription("Announce that a streamer is live!")
        .addStringOption(option =>
            option.setName("platform")
                .setDescription("The streaming platform")
                .setRequired(true)
                .addChoices(
                    { name: "Twitch", value: "twitch" },
                    { name: "YouTube", value: "youtube" },
                    { name: "TikTok", value: "tiktok" }
                )
        )
        .addStringOption(option =>
            option.setName("username")
                .setDescription("Streamer username")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("url")
                .setDescription("Link to the stream")
                .setRequired(true)
        ),
    async execute(interaction) {
        const platform = interaction.options.getString("platform");
        const username = interaction.options.getString("username");
        const url = interaction.options.getString("url");

        const embed = new EmbedBuilder()
            .setTitle(`🔴 ${username} is LIVE on ${platform}!`)
            .setDescription(`[Click here to watch](${url})`)
            .setColor(0xff0000)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
