const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user from the server")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("User to ban")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for the ban")
                .setRequired(true)
        ),

    async execute(interaction) {
        const member = interaction.member;

        // Permission check
        if (!isStaff(member)) {
            return interaction.reply({
                content: "🚫 You do not have permission to use this command.",
                ephemeral: true
            });
        }

        const target = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");

        const guildMember = await interaction.guild.members.fetch(target.id).catch(() => null);

        // Safety checks
        if (!guildMember) {
            return interaction.reply({ content: "❌ User not found.", ephemeral: true });
        }

        if (target.id === member.id) {
            return interaction.reply({ content: "❌ You cannot ban yourself.", ephemeral: true });
        }

        if (isStaff(guildMember)) {
            return interaction.reply({
                content: "❌ You cannot ban another staff member.",
                ephemeral: true
            });
        }

        // Ban user
        await interaction.guild.members.ban(target.id, { reason });

        // Mod log embed
        const embed = new EmbedBuilder()
            .setTitle("🔨 User Banned")
            .setColor(0xFF0000)
            .addFields(
                { name: "User", value: `${target.tag} (${target.id})`, inline: false },
                { name: "Banned By", value: `${interaction.user.tag}`, inline: false },
                { name: "Reason", value: reason, inline: false }
            )
            .setTimestamp();

        const logChannel = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
        if (logChannel) logChannel.send({ embeds: [embed] });

        await interaction.reply({
            content: `✅ **${target.tag}** has been banned.`,
            ephemeral: true
        });
    }
};
