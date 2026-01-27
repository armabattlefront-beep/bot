// =======================
// ENV + PROCESS SAFETY
// =======================
require("dotenv").config();

process.on("unhandledRejection", reason =>
  console.error("❌ Unhandled Rejection:", reason)
);
process.on("uncaughtException", err =>
  console.error("❌ Uncaught Exception:", err)
);

// =======================
// EXPRESS KEEP-ALIVE + DASHBOARD
// =======================
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) =>
  res.status(200).send("BattleFront Madness bot online")
);
app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", uptime: process.uptime() })
);

const { app: dashboardApp } = require("./dashboard/server");
app.use("/dashboard", dashboardApp);

// =======================
// DISCORD CLIENT
// =======================
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// =======================
// LOAD SLASH COMMANDS
// =======================
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`⚠️ ${file} missing data or execute`);
  }
}

// =======================
// REGISTER SLASH COMMANDS (AUTO)
// =======================
async function registerCommands() {
  const token = process.env.TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId || !guildId) {
    console.error("❌ Missing TOKEN, CLIENT_ID, or GUILD_ID");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);
  const commands = client.commands.map(cmd => cmd.data.toJSON());

  try {
    console.log(`⚡ Deploying ${commands.length} guild commands...`);

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log("✅ Slash commands deployed instantly.");
  } catch (err) {
    console.error("❌ Command deployment failed:", err);
  }
}

// =======================
// BOT READY
// =======================
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  await registerCommands();

  // =======================
  // RCON CONNECTION
  // =======================
  const { connectRcon, sendRconCommand } = require("./rconClient");

  try {
    await connectRcon();
    console.log("✅ UDP RCON ready");

    // =======================
    // TEST RCON COMMANDS
    // =======================
    // This is a one-time test snippet to check RCON connectivity
    (async () => {
      try {
        console.log("📡 Sending test RCON command: playerList");
        const response = await sendRconCommand("playerList", 15000); // 15s timeout
        console.log("✅ RCON Response:", response);
      } catch (err) {
        console.error("❌ RCON test command failed:", err);
      }
    })();

  } catch (err) {
    console.error("❌ RCON startup failed:", err);
  }
});

// =======================
// DATABASE
// =======================
require("./database/db");

// =======================
// XP HANDLING
// =======================
const { getUser, addXP, setLevel } = require("./database/xp");
const { getDiscordByGamertag } = require("./database/gamertags");
const {
  XP,
  MESSAGE_COOLDOWN,
  LEVEL_CHANNEL_ID,
  KILLFEED_CHANNEL_ID
} = require("./config");

const nextXP = lvl => 100 + lvl * 50;

function giveXP(userId, amount) {
  if (!XP) return;

  const user = getUser(userId);
  const newXP = addXP(userId, amount);

  if (newXP >= nextXP(user.level)) {
    const lvl = user.level + 1;
    setLevel(userId, lvl);

    const channel = client.channels.cache.get(LEVEL_CHANNEL_ID);
    if (channel) {
      channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎉 Level Up!")
            .setDescription(`<@${userId}> reached **Level ${lvl}**`)
            .setColor(0x1abc9c)
            .setTimestamp()
        ]
      }).catch(() => {});
    }
  }
}

// =======================
// MESSAGE XP
// =======================
const messageCooldown = new Set();

client.on("messageCreate", message => {
  if (!message.guild || message.author.bot) return;

  if (!messageCooldown.has(message.author.id)) {
    if (XP?.MESSAGE) giveXP(message.author.id, XP.MESSAGE);
    messageCooldown.add(message.author.id);
    setTimeout(
      () => messageCooldown.delete(message.author.id),
      MESSAGE_COOLDOWN
    );
  }

  if (message.channel.id === KILLFEED_CHANNEL_ID) {
    const match = message.content.match(/^(.+?) killed .+$/i);
    if (match) {
      const discordId = getDiscordByGamertag(match[1]);
      if (discordId) giveXP(discordId, XP?.KILL || 50);
    }
  }
});

// =======================
// SLASH COMMAND HANDLER
// =======================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      interaction.reply({
        content: "❌ Command execution failed",
        ephemeral: true
      });
    }
  }
});

// =======================
// START WEB SERVER
// =======================
app.listen(PORT, () =>
  console.log(`🌐 Web server running on port ${PORT}`)
);

// =======================
// LOGIN
// =======================
const TOKEN = process.env.TOKEN;
if (!TOKEN) throw new Error("❌ TOKEN not set in Railway");

client.login(TOKEN);
