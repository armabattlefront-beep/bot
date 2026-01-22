const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Delete messages in bulk")
        .addIntegerOption(opt =>
            opt.setName("amount")
                .setDescription("Number of messages (1–100)")
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!isStaff(interaction.member))
            return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

        const amount = interaction.options.getInteger("amount");
        if (amount < 1 || amount > 100)
            return interaction.reply({ content: "❌ 1–100 only.", ephemeral: true });

        const messages = await interaction.channel.bulkDelete(amount, true);

        interaction.client.channels.cache.get(MOD_LOG_CHANNEL)
            ?.send(`🧹 **${messages.size} messages purged** in ${interaction.channel}`);

        interaction.reply({ content: `🧹 Deleted ${messages.size} messages.`, ephemeral: true });
    }
};
