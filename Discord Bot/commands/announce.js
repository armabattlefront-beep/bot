const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("Post an embedded announcement")
        .addChannelOption(opt =>
            opt.setName("channel")
                .setDescription("Channel to post the announcement")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("title")
                .setDescription("Title of the announcement")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("description")
                .setDescription("Content of the announcement")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("color")
                .setDescription("Embed color in HEX (default blue)")
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName("mention")
                .setDescription("Role or @everyone mention (optional)")
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!isStaff(interaction.member))
            return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

        const channel = interaction.options.getChannel("channel");
        const title = interaction.options.getString("title");
        const description = interaction.options.getString("description");
        const color = interaction.options.getString("color") || "#3498db"; // default blue
        const mention = interaction.options.getString("mention") || null;

        if (!channel.isTextBased())
            return interaction.reply({ content: "❌ Not a text channel.", ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: `Announcement by ${interaction.user.tag}` });

        await channel.send({ content: mention, embeds: [embed] });

        interaction.client.channels.cache.get(MOD_LOG_CHANNEL)
            ?.send(`📢 Announcement posted in ${channel} by ${interaction.user.tag}`);

        interaction.reply({ content: `✅ Announcement sent in ${channel}`, ephemeral: true });
    }
};
