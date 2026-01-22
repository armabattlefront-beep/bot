const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const { token, clientId, guildId } = require("./config.json"); // Make sure this file exists

const commands = [];

// If your commands are directly inside commands/ folder (no subfolders)
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`The command at ./commands/${file} is missing "data" and/or "execute" property`);
    }
}

// Register commands with Discord
const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
