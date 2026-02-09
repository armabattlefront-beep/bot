// ==================================================
// ENV + PROCESS SAFETY
// ==================================================
require("dotenv").config();

process.on("unhandledRejection", err => console.error("❌ Unhandled Rejection:", err));
process.on("uncaughtException", err => console.error("❌ Uncaught Exception:", err));

// ==================================================
// EXPRESS KEEP-ALIVE + DASHBOARD
// ==================================================
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (_, res) => res.status(200).send("BattleFront Madness bot online"));
app.get("/health", (_, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));

try {
  const { app: dashboardApp } = require("./dashboard/server");
  app.use("/dashboard", dashboardApp);
} catch (err) {
  console.warn("⚠️ Dashboard server not found or failed to load:", err.message);
}

// ==================================================
// DISCORD CLIENT
// ==================================================
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  InteractionResponseFlags
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

// ==================================================
// COMMAND LOADING
// ==================================================
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name && command.execute) client.commands.set(command.data.name, command);
  else console.warn(`⚠️ ${file} missing data or execute()`);
}

// ==================================================
// SLASH COMMAND REGISTRATION
// ==================================================
async function registerCommands() {
  const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;
  if (!TOKEN || !CLIENT_ID || !GUILD_ID) return console.error("❌ Missing TOKEN, CLIENT_ID, or GUILD_ID");

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const body = client.commands.map(cmd => cmd.data.toJSON());

  try {
    console.log(`⚡ Deploying ${body.length} guild commands...`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
    console.log("✅ Slash commands deployed");
  } catch (err) {
    console.error("❌ Slash command deploy failed:", err);
  }
}

// ==================================================
// DATABASE INIT
// ==================================================
try {
  require("./database/db");
} catch (err) {
  console.error("❌ Database init failed:", err.message);
}
let getUser, addXP, setLevel, getDiscordByGamertag;
try {
  ({ getUser, addXP, setLevel } = require("./database/xp"));
  ({ getDiscordByGamertag } = require("./database/gamertags"));
} catch (err) {
  console.error("❌ Database modules not found. Make sure ./database/xp.js and ./database/gamertags.js exist.", err.message);
}

const { XP, MESSAGE_COOLDOWN, LEVEL_CHANNEL_ID, KILLFEED_CHANNEL_ID } = require("./config");
const nextXP = lvl => 100 + lvl * 50;

// ==================================================
// XP HANDLING
// ==================================================
function giveXP(userId, amount) {
  if (!XP || !amount || !getUser || !addXP || !setLevel) return;
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

// ==================================================
// MESSAGE XP + KILLFEED
// ==================================================
const messageCooldown = new Set();

client.on("messageCreate", message => {
  if (!message.guild || message.author.bot) return;

  if (!messageCooldown.has(message.author.id)) {
    if (XP?.MESSAGE) giveXP(message.author.id, XP.MESSAGE);
    messageCooldown.add(message.author.id);
    setTimeout(() => messageCooldown.delete(message.author.id), MESSAGE_COOLDOWN);
  }

  if (message.channel.id === KILLFEED_CHANNEL_ID) {
    const match = message.content.match(/^(.+?) killed .+$/i);
    if (match && getDiscordByGamertag) {
      const discordId = getDiscordByGamertag(match[1]);
      if (discordId) giveXP(discordId, XP?.KILL || 50);
    }
  }
});

// ==================================================
// TICKET SYSTEM
// ==================================================
const ticketCommand = client.commands.get("ticket");

client.on("interactionCreate", async interaction => {
  try {
    // ---- BUTTONS ----
    if (interaction.isButton() && ticketCommand) {
      await ticketCommand.handleButton(interaction);
    }

    // ---- MODALS ----
    if (interaction.isModalSubmit() && ticketCommand) {
      await ticketCommand.handleModalSubmit(interaction, client);
    }

    // ---- SLASH COMMANDS ----
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
    }

    // ---- AUTOCOMPLETE ----
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) await command.autocomplete(interaction);
    }

    // ---- STRING SELECT MENUS ----
    if (interaction.isStringSelectMenu()) {
      const [prefix] = interaction.customId.split("_");
      const value = interaction.values[0];

      if (prefix === "ticketPriority") {
        let text, color;
        switch (value) {
          case "low": text = "Low Priority selected ✅"; color = 0x3498db; break;
          case "medium": text = "Medium Priority selected ⚠️"; color = 0xf1c40f; break;
          case "high": text = "High Priority selected 🔥"; color = 0xe74c3c; break;
          default: text = "Unknown priority ❌"; color = 0x95a5a6;
        }

        const embed = new EmbedBuilder()
          .setTitle("Ticket Priority Updated")
          .setDescription(text)
          .setColor(color)
          .setTimestamp();

        await interaction.update({
          embeds: [embed],
          components: [],
          flags: InteractionResponseFlags.Ephemeral
        });
      }
    }

  } catch (err) {
    console.error("❌ Interaction handler error:", err);
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Something went wrong.",
        flags: InteractionResponseFlags.Ephemeral
      });
    }
  }
});

// ==================================================
// WELCOME / ONBOARDING
// ==================================================
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || "123456789012345678";

client.on("guildMemberAdd", async member => {
  try {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`Welcome to ${member.guild.name}!`)
      .setDescription(
        `Hey <@${member.id}>! Welcome to **BattleFront Madness**!\n\n` +
        `📌 Make sure to read the rules.\n` +
        `🛠️ Need support? Use the /ticket command.\n` +
        `🎮 Check out our events and community channels.\n` +
        `💡 Have fun and enjoy your time here!`
      )
      .setColor(0x3498db)
      .setTimestamp();

    await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
  } catch (err) {
    console.error("❌ Welcome message failed:", err);
  }
});

// ==================================================
// READY + RCON
// ==================================================
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  await registerCommands();

  try {
    const { connectRcon, sendRconCommand } = require("./rconClient");
    await connectRcon();
    console.log("✅ UDP RCON connected");

    await sendRconCommand("playerList", 15000);
    console.log("📡 RCON test OK");
  } catch (err) {
    console.warn("⚠️ RCON test failed (non-fatal):", err.message);
  }
});

// ==================================================
// START WEB SERVER
// ==================================================
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// ==================================================
// LOGIN
// ==================================================
if (!process.env.TOKEN) throw new Error("❌ TOKEN not set");
client.login(process.env.TOKEN);

module.exports = { client };
