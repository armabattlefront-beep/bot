// ==================================================
// ENV + PROCESS SAFETY
// ==================================================
require("dotenv").config();

process.on("unhandledRejection", err =>
  console.error("❌ Unhandled Rejection:", err)
);
process.on("uncaughtException", err =>
  console.error("❌ Uncaught Exception:", err)
);

// ==================================================
// EXPRESS KEEP-ALIVE + DASHBOARD
// ==================================================
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
  StringSelectMenuBuilder
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
  if (command?.data?.name && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`⚠️ ${file} missing data or execute()`);
  }
}

// ==================================================
// SLASH COMMAND REGISTRATION
// ==================================================
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
    console.log("✅ Slash commands deployed");
  } catch (err) {
    console.error("❌ Slash command deploy failed:", err);
  }
}

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

    sendRconCommand("playerList", 15000)
      .then(() => console.log("📡 RCON test OK"))
      .catch(err =>
        console.warn("⚠️ RCON test failed (non-fatal):", err.message)
      );
  } catch (err) {
    console.error("❌ RCON startup failed:", err);
  }
});

// ==================================================
// DATABASE INIT
// ==================================================
require("./database/db");

// ==================================================
// XP SYSTEM
// ==================================================
const { getUser, addXP, setLevel } = require("./database/xp");
const { getDiscordByGamertag } = require("./database/gamertags");
const {
  XP,
  MESSAGE_COOLDOWN,
  LEVEL_CHANNEL_ID,
  KILLFEED_CHANNEL_ID,
  MOD_LOG_CHANNEL
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

// ==================================================
// MESSAGE XP + KILLFEED
// ==================================================
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

// ==================================================
// INTERACTION HANDLER
// ==================================================
client.on("interactionCreate", async interaction => {
  try {
    // ---------------- SLASH COMMANDS ----------------
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    }

    // ---------------- AUTOCOMPLETE ----------------
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) await command.autocomplete(interaction);
    }

    // ---------------- SELECT MENUS ----------------
    if (interaction.isStringSelectMenu()) {
      const { getEvent, getAllEvents, saveEvent } = require("./database/events");
      const [prefix] = interaction.customId.split("_");

      // -------- VIEW EVENT --------
      if (prefix === "view") {
        const event = getEvent(interaction.values[0]);
        if (!event)
          return interaction.update({ content: "❌ Event not found.", components: [] });

        const embed = new EmbedBuilder()
          .setTitle(`🗂️ Event: ${event.name}`)
          .setDescription(event.description || "No description provided.")
          .addFields(
            { name: "Max Players", value: `${event.maxPlayers}`, inline: true },
            { name: "Group Size", value: event.groupSize || "N/A", inline: true },
            { name: "Participants", value: `${event.signups.length}`, inline: true },
            { name: "Date", value: event.date || "N/A", inline: true },
            { name: "Time", value: event.time || "N/A", inline: true }
          )
          .setColor(0x1abc9c)
          .setTimestamp();

        const squads = {};
        for (const p of event.signups) {
          const g = p.group || "Unassigned";
          if (!squads[g]) squads[g] = [];
          squads[g].push(`<@${p.id}>${p.squadLeader ? " ⭐" : ""}`);
        }
        for (const [g, members] of Object.entries(squads)) {
          embed.addFields({
            name: `Squad ${g}`,
            value: members.join("\n"),
            inline: true
          });
        }

        return interaction.update({ embeds: [embed], components: [] });
      }

      // -------- DELETE EVENT --------
      if (prefix === "delete") {
        const events = getAllEvents();
        const event = events[interaction.values[0]];
        if (!event)
          return interaction.update({ content: "❌ Event not found.", components: [] });

        delete events[event.id];
        saveEvent(null, events);

        await interaction.update({
          content: `🗑️ Event **${event.name}** deleted.`,
          components: []
        });

        const logCh = client.channels.cache.get(MOD_LOG_CHANNEL);
        if (logCh)
          logCh.send(`🗑️ ${interaction.user.tag} deleted event **${event.name}**`);
      }
    }

    // ---------------- PAGINATION BUTTONS ----------------
    if (interaction.isButton()) {
      const { getAllEvents } = require("./database/events");
      const [prefix, dir, pageStr] = interaction.customId.split("_");
      if (!["view", "assign", "edit"].includes(prefix)) return;

      let page = parseInt(pageStr, 10);
      if (dir === "next") page++;
      if (dir === "prev") page--;

      const events = Object.values(getAllEvents()).filter(ev => ev.timestamp > Date.now());
      const { buildEventMenu } = require("./utils/paginatedMenu");
      const { rows } = buildEventMenu(events, page, `${prefix}_event`);

      await interaction.update({ components: rows });
    }
  } catch (err) {
    console.error("❌ Interaction error:", err);
    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({ content: "❌ Something went wrong.", ephemeral: true }).catch(() => {});
    }
  }
});

// ==================================================
// START WEB SERVER
// ==================================================
app.listen(PORT, () =>
  console.log(`🌐 Web server running on port ${PORT}`)
);

// ==================================================
// LOGIN
// ==================================================
if (!process.env.TOKEN) throw new Error("❌ TOKEN not set");
client.login(process.env.TOKEN);
