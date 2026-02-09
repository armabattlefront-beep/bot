// ==================================================
// ENV + SAFETY
// ==================================================
require("dotenv").config();

process.on("unhandledRejection", err => console.error("UNHANDLED:", err));
process.on("uncaughtException", err => console.error("UNCAUGHT:", err));

// ==================================================
// EXPRESS (KEEP ALIVE)
// ==================================================
const express = require("express");
const app = express();

app.get("/", (_, res) => res.send("BattleFront Madness bot online"));
app.listen(process.env.PORT || 8080, () => console.log("🌐 Express server running"));

// ==================================================
// DISCORD CLIENT
// ==================================================
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const config = require("./config");
const { addXP, getNextLevelXP } = require("./database/xp");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// ==================================================
// COMMAND LOADER
// ==================================================
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name) client.commands.set(command.data.name, command);
  else console.warn(`⚠️ Command ${file} missing data.name`);
}

// ==================================================
// XP / LEVEL HANDLING
// ==================================================
const messageCooldown = new Set();

function giveXP(userId, amount) {
  if (!userId || !amount) return;

  const { xp, level } = addXP(userId, amount);
  const nextLevel = getNextLevelXP(level);

  if (xp >= nextLevel) {
    const channel = client.channels.cache.get(config.LEVEL_CHANNEL_ID);
    if (channel) {
      channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎉 Level Up!")
            .setDescription(`<@${userId}> reached **Level ${level + 1}**`)
            .setColor(0x1abc9c)
            .setTimestamp()
        ]
      }).catch(() => {});
    }
  }
}

client.on("messageCreate", message => {
  if (!message.guild || message.author.bot) return;

  if (!messageCooldown.has(message.author.id)) {
    giveXP(message.author.id, config.XP?.MESSAGE || 5);
    messageCooldown.add(message.author.id);
    setTimeout(() => messageCooldown.delete(message.author.id), config.MESSAGE_COOLDOWN);
  }
});

// ==================================================
// INTERACTION HANDLER
// ==================================================
client.on("interactionCreate", async interaction => {
  try {
    const ticketCommand = client.commands.get("ticket");

    // ------------------------------
    // SLASH COMMANDS
    // ------------------------------
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
      return;
    }

    // ------------------------------
    // BUTTONS
    // ------------------------------
    if (interaction.isButton()) {
      if (!ticketCommand) return;

      if (interaction.customId.startsWith("ticket_type_")) {
        await ticketCommand.handleButton(interaction);
      } else if (interaction.customId.startsWith("ticket_close_")) {
        await ticketCommand.handleCloseButton(interaction);
      }
      return;
    }

    // ------------------------------
    // SELECT MENUS
    // ------------------------------
    if (interaction.isStringSelectMenu()) {
      if (!ticketCommand) return;

      if (interaction.customId.startsWith("ticket_priority_")) {
        await ticketCommand.handlePrioritySelect(interaction);
      }
      return;
    }

    // ------------------------------
    // MODALS
    // ------------------------------
    if (interaction.isModalSubmit()) {
      if (!ticketCommand) return;

      if (interaction.customId.startsWith("ticket_modal_")) {
        await ticketCommand.handleModalSubmit(interaction, client);
      }
      return;
    }

  } catch (err) {
    console.error("INTERACTION ERROR:", err);

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: "❌ Something went wrong. Please try again or contact staff.",
          ephemeral: true
        });
      } catch {}
    }
  }
});

// ==================================================
// READY
// ==================================================
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// ==================================================
// LOGIN
// ==================================================
if (!process.env.TOKEN) throw new Error("❌ TOKEN not set in .env");
client.login(process.env.TOKEN);

module.exports = { client, giveXP };
