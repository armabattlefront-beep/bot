// =======================
// ENV + PROCESS SAFETY
// =======================
require("dotenv").config();

process.on("unhandledRejection", reason => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", err => {
  console.error("❌ Uncaught Exception:", err);
});

// =======================
// EXPRESS KEEP-ALIVE + DASHBOARD
// =======================
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (_, res) =>
  res.status(200).send("BattleFront Madness bot online")
);

app.get("/health", (_, res) =>
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

for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
  const command = require(path.join(commandsPath, file));

  if (command?.data && command?.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`⚠️ ${file} missing data or execute()`);
  }
}

// =======================
// REGISTER SLASH COMMANDS
// =======================
async function registerCommands() {
  const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

  if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error("❌ Missing TOKEN, CLIENT_ID, or GUILD_ID");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const body = client.commands.map(cmd => cmd.data.toJSON());

  try {
    console.log(`⚡ Deploying ${body.length} guild commands...`);
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body }
    );
    console.log("✅ Slash commands deployed.");
  } catch (err) {
    console.error("❌ Command deployment failed:", err);
  }
}

// =======================
// BOT READY (clientReady)
// =======================
client.once("clientReady", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  await registerCommands();

  // =======================
  // RCON INITIALISATION
  // =======================
  try {
    const { connectRcon, sendRconCommand } = require("./rconClient");

    await connectRcon();
    console.log("✅ UDP RCON connected");

    // One-time safe test (non-blocking)
    sendRconCommand("playerList", 15000)
      .then(res => console.log("📡 RCON test OK"))
      .catch(err =>
        console.warn("⚠️ RCON test failed (non-fatal):", err.message)
      );

  } catch (err) {
    console.error("❌ RCON startup failed:", err);
  }
});

// =======================
// DATABASE INIT
// =======================
require("./database/db");

// =======================
// XP SYSTEM
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
  if (!XP || !amount) return;

  const user = getUser(userId);
  const totalXP = addXP(userId, amount);

  if (totalXP >= nextXP(user.level)) {
    const newLevel = user.level + 1;
    setLevel(userId, newLevel);

    const channel = client.channels.cache.get(LEVEL_CHANNEL_ID);
    if (channel) {
      channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎉 Level Up!")
            .setDescription(`<@${userId}> reached **Level ${newLevel}**`)
            .setColor(0x1abc9c)
            .setTimestamp()
        ]
      }).catch(() => {});
    }
  }
}

// =======================
// MESSAGE XP + KILLFEED
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
    console.error(`❌ Command ${interaction.commandName} failed:`, err);

    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: "❌ Command execution failed",
        ephemeral: true
      }).catch(() => {});
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
if (!process.env.TOKEN) {
  throw new Error("❌ TOKEN not set in environment");
}

client.login(process.env.TOKEN);
