const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout a user (mute)")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("User to timeout")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("minutes")
                .setDescription("Duration in minutes")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("reason")
                .setDescription("Reason")
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!isStaff(interaction.member))
            return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

        const target = interaction.options.getUser("user");
        const minutes = interaction.options.getInteger("minutes");
        const reason = interaction.options.getString("reason");

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return interaction.reply({ content: "User not found.", ephemeral: true });

        if (isStaff(member))
            return interaction.reply({ content: "❌ Cannot timeout staff.", ephemeral: true });

        await member.timeout(minutes * 60 * 1000, reason);

        const embed = new EmbedBuilder()
            .setTitle("⏱️ User Timed Out")
            .setColor(0xFFAA00)
            .addFields(
                { name: "User", value: `${target.tag}` },
                { name: "Duration", value: `${minutes} minutes` },
                { name: "Reason", value: reason }
            )
            .setTimestamp();

        interaction.client.channels.cache.get(MOD_LOG_CHANNEL)?.send({ embeds: [embed] });

        interaction.reply({ content: `✅ ${target.tag} timed out.`, ephemeral: true });
    }
};
