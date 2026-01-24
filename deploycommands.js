const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
    console.error("❌ Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID");
    process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`⚠️ ${file} missing data or execute`);
    }
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    try {
        console.log(`🚀 Registering ${commands.length} guild commands...`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log(`✅ Successfully registered ${data.length} commands.`);
    } catch (err) {
        console.error("❌ Command registration failed:", err);
    }
})();
