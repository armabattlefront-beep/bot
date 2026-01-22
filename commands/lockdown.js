const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { SAFE_CHANNELS, MOD_LOG_CHANNEL } = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lockdown")
        .setDescription("Lock the server (raid mode)"),

    async execute(interaction) {
        if (!isStaff(interaction.member))
            return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

        const guild = interaction.guild;

        guild.channels.cache.forEach(channel => {
            if (!SAFE_CHANNELS.includes(channel.id)) {
                channel.permissionOverwrites.edit(
                    guild.roles.everyone,
                    { SendMessages: false, Connect: false }
                ).catch(() => {});
            }
        });

        interaction.client.channels.cache.get(MOD_LOG_CHANNEL)
            ?.send("🚨 **SERVER LOCKDOWN ENABLED**");

        interaction.reply({ content: "🔒 Server locked down.", ephemeral: true });
    }
};
