const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Create a poll")
        .addStringOption(opt =>
            opt.setName("question")
                .setDescription("Poll question")
                .setRequired(true)
        )
        .addChannelOption(opt =>
            opt.setName("channel")
                .setDescription("Channel to post the poll")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("options")
                .setDescription("Comma-separated options (max 10)")
                .setRequired(false)
        )
        .addBooleanOption(opt =>
            opt.setName("allow_user_options")
                .setDescription("Allow users to add their own options")
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!isStaff(interaction.member))
            return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

        const question = interaction.options.getString("question");
        const optionsInput = interaction.options.getString("options") || "";
        const allowUserOptions = interaction.options.getBoolean("allow_user_options") || false;
        const channel = interaction.options.getChannel("channel");

        if (!channel.isTextBased())
            return interaction.reply({ content: "❌ Not a text channel.", ephemeral: true });

        const options = optionsInput.split(",").map(o => o.trim()).filter(o => o.length > 0).slice(0, 10);

        if (options.length === 0) options.push("Yes", "No"); // default yes/no poll

        const embed = new EmbedBuilder()
            .setTitle(`📊 Poll: ${question}`)
            .setDescription(options.map((o, i) => `${i + 1}. ${o}`).join("\n"))
            .setColor("#f1c40f")
            .setFooter({ text: `Poll created by ${interaction.user.tag}` })
            .setTimestamp();

        const pollMessage = await channel.send({ embeds: [embed] });

        const emojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
        for (let i = 0; i < options.length; i++) {
            await pollMessage.react(emojis[i]);
        }

        if (allowUserOptions) {
            await pollMessage.reply("✅ Users can add their own options by replying to this message (staff will have to update the poll manually).");
        }

        interaction.client.channels.cache.get(MOD_LOG_CHANNEL)
            ?.send(`📊 Poll posted in ${channel} by ${interaction.user.tag}: ${question}`);

        await interaction.reply({ content: `✅ Poll posted in ${channel}`, ephemeral: true });
    }
};
