const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Path to your eventRoles.json
const rolesFilePath = path.join(__dirname, "../eventRoles.json");
let eventRoles = require(rolesFilePath);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editeventroles")
    .setDescription("Edit which roles can use /createevent")
    .addStringOption(option =>
      option.setName("action")
        .setDescription("Add, remove, or list roles")
        .setRequired(true)
        .addChoices(
          { name: "add", value: "add" },
          { name: "remove", value: "remove" },
          { name: "list", value: "list" }
        )
    )
    .addRoleOption(option =>
      option.setName("role")
        .setDescription("Role to add or remove (required for add/remove)")
    ),

  async execute(interaction) {
    const action = interaction.options.getString("action");
    const role = interaction.options.getRole("role");

    // List all allowed roles
    if (action === "list") {
      const rolesList = eventRoles.allowedRoles
        .map(id => `<@&${id}>`)
        .join(", ") || "No roles currently allowed.";
      return interaction.reply({ content: `✅ Allowed roles: ${rolesList}`, ephemeral: true });
    }

    // Ensure role is provided for add/remove
    if (!role) {
      return interaction.reply({ content: "❌ You must specify a role to add or remove.", ephemeral: true });
    }

    // Verify role exists on server
    const roleExists = interaction.guild.roles.cache.has(role.id);
    if (!roleExists) {
      return interaction.reply({ content: "❌ That role does not exist on this server.", ephemeral: true });
    }

    // Add role
    if (action === "add") {
      if (eventRoles.allowedRoles.includes(role.id)) {
        return interaction.reply({ content: "⚠️ That role is already allowed.", ephemeral: true });
      }
      eventRoles.allowedRoles.push(role.id);
    }

    // Remove role
    if (action === "remove") {
      if (!eventRoles.allowedRoles.includes(role.id)) {
        return interaction.reply({ content: "⚠️ That role is not in the allowed list.", ephemeral: true });
      }
      eventRoles.allowedRoles = eventRoles.allowedRoles.filter(id => id !== role.id);
    }

    // Save changes to JSON
    fs.writeFileSync(rolesFilePath, JSON.stringify(eventRoles, null, 2));

    return interaction.reply({ content: `✅ Allowed roles updated successfully.`, ephemeral: true });
  }
};
