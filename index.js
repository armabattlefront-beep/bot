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
app.listen(process.env.PORT || 8080);

// ==================================================
// DISCORD CLIENT
// ==================================================
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction
  ]
});

// ==================================================
// COMMAND LOADER
// ==================================================
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;

  const command = require(path.join(commandsPath, file));
  if (command?.data?.name) {
    client.commands.set(command.data.name, command);
  }
}

// ==================================================
// INTERACTION ROUTER (SAFE)
// ==================================================
client.on("interactionCreate", async interaction => {
  try {
    // ------------------------------
    // SLASH COMMANDS
    // ------------------------------
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
      return;
    }

    // ------------------------------
    // BUTTONS
    // ------------------------------
    if (interaction.isButton()) {
      const ticket = client.commands.get("ticket");
      if (!ticket?.handleButton) return;

      await ticket.handleButton(interaction);
      return;
    }

    // ------------------------------
    // SELECT MENUS
    // ------------------------------
    if (interaction.isStringSelectMenu()) {
      const ticket = client.commands.get("ticket");
      if (!ticket?.handlePrioritySelect) return;

      await ticket.handlePrioritySelect(interaction);
      return;
    }

    // ------------------------------
    // MODALS
    // ------------------------------
    if (interaction.isModalSubmit()) {
      const ticket = client.commands.get("ticket");
      if (!ticket?.handleModalSubmit) return;

      await ticket.handleModalSubmit(interaction, client);
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
client.login(process.env.TOKEN);
