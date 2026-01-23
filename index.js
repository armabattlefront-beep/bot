// =======================
// ENV + PROCESS SAFETY
// =======================
require('dotenv').config();
process.on("unhandledRejection", reason => console.error("❌ Unhandled Rejection:", reason));
process.on("uncaughtException", err => console.error("❌ Uncaught Exception:", err));

// =======================
// EXPRESS KEEP-ALIVE + DASHBOARD
// =======================
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.status(200).send("BattleFront Madness bot online"));
app.get("/health", (req, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));

const { app: dashboardApp, io } = require("./dashboard/server");
app.use("/dashboard", dashboardApp);

// =======================
// DISCORD CLIENT
// =======================
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, REST, Routes } = require("discord.js");
const fs = require("fs");

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
// LOAD COMMANDS
// =======================
client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

// =======================
// REGISTER SLASH COMMANDS
// =======================
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  const commands = client.commands.map(c => c.data.toJSON());
  try {
    console.log(`⚡ Deploying ${commands.length} commands...`);
    await rest.put(Routes.applicationCommands(process.env.BOT_CLIENT_ID), { body: commands });
    console.log("✅ Commands deployed successfully.");
  } catch (err) { console.error("❌ Failed to deploy commands:", err); }
}

// =======================
// BOT READY
// =======================
client.once("clientReady", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  await registerCommands();
});

// =======================
// DATABASE
// =======================
const db = require("./database/db"); // handles creating ./data/database.db safely

// =======================
// XP HANDLING
// =======================
const { getUser, addXP, setLevel } = require("./database/xp");
const { getDiscordByGamertag } = require("./database/gamertags");
const { XP, MESSAGE_COOLDOWN, LEVEL_CHANNEL_ID, STAFF_ROLE_IDS, KILLFEED_CHANNEL_ID } = require("./config");

const nextXP = lvl => 100 + lvl * 50;
const rankName = lvl => lvl >= 50 ? "General" : lvl >= 30 ? "Colonel" : lvl >= 15 ? "Sergeant" : "Recruit";

function giveXP(userId, amount) {
  if (!XP) return;
  const user = getUser(userId);
  const newXP = addXP(userId, amount);

  if (newXP >= nextXP(user.level)) {
    const lvl = user.level + 1;
    setLevel(userId, lvl);

    const ch = client.channels.cache.get(LEVEL_CHANNEL_ID);
    if (ch) ch.send({
      embeds: [new EmbedBuilder()
        .setTitle("🎉 Level Up!")
        .setDescription(`<@${userId}> reached **Level ${lvl}**`)
        .setColor(0x1abc9c)
        .setTimestamp()
      ]
    }).catch(() => {});
  }
}

// =======================
// MESSAGE XP
// =======================
const messageCooldown = new Set();
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  if (!messageCooldown.has(message.author.id)) {
    if (XP?.MESSAGE) giveXP(message.author.id, XP.MESSAGE);
    messageCooldown.add(message.author.id);
    setTimeout(() => messageCooldown.delete(message.author.id), MESSAGE_COOLDOWN);
  }

  // KILLFEED XP
  if (message.channel.id === KILLFEED_CHANNEL_ID) {
    const match = message.content.match(/^(.+?) killed .+$/i);
    if (match) {
      const discordId = getDiscordByGamertag(match[1]);
      if (discordId) giveXP(discordId, XP?.KILL || 50);
    }
  }
});

// =======================
// COMMAND HANDLER
// =======================
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try { await cmd.execute(i); }
  catch (e) { console.error(e); if (!i.replied) i.reply({ content: "❌ Command error", ephemeral: true }); }
});

// =======================
// SERVER START
// =======================
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

const TOKEN = process.env.TOKEN;
if (!TOKEN) throw new Error("No TOKEN in .env found");
client.login(TOKEN);
