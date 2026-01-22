const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a user from the server")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("User to kick")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for the kick")
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
            return interaction.reply({ content: "❌ You cannot kick yourself.", ephemeral: true });
        }

        if (isStaff(guildMember)) {
            return interaction.reply({
                content: "❌ You cannot kick another staff member.",
                ephemeral: true
            });
        }

        // Kick user
        await guildMember.kick(reason);

        // Mod log embed
        const embed = new EmbedBuilder()
            .setTitle("👢 User Kicked")
            .setColor(0xFFA500)
            .addFields(
                { name: "User", value: `${target.tag} (${target.id})`, inline: false },
                { name: "Kicked By", value: `${interaction.user.tag}`, inline: false },
                { name: "Reason", value: reason, inline: false }
            )
            .setTimestamp();

        const logChannel = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
        if (logChannel) logChannel.send({ embeds: [embed] });

        await interaction.reply({
            content: `✅ **${target.tag}** has been kicked.`,
            ephemeral: true
        });
    }
};
