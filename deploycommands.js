const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const { clientId, guildId } = require("./config.json");

// Use environment variable first, fallback to config.json (for local testing)
const token = process.env.TOKEN || require("./config.json").token;

if (!token) {
    console.error("❌ No Discord token found! Set TOKEN environment variable or add it to config.json");
    process.exit(1);
}

const commands = [];

// Load all command files
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`⚠️ Command at ./commands/${file} is missing "data" or "execute" property`);
    }
}

// Register commands with Discord
const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log(`✅ Successfully reloaded ${data.length} commands.`);
    } catch (error) {
        console.error(error);
    }
})();
