// ==================================================
// ENV + SAFETY
// ==================================================
require("dotenv").config();

process.on("unhandledRejection", (err) => console.error("UNHANDLED:", err));
process.on("uncaughtException", (err) => console.error("UNCAUGHT:", err));

// ==================================================
// EXPRESS (KEEP ALIVE)
// ==================================================
const express = require("express");
const app = express();

app.get("/", (_, res) => res.send("BattleFront Madness bot online"));
app.listen(process.env.PORT || 8080, () =>
  console.log("🌐 Express server running")
);

// ==================================================
// IMPORTS
// ==================================================
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const polls = require("./database/polls");
const { initServerUpdater } = require("./serverUpdater");

// XP SYSTEM
const { handleMessage, handleReaction, handleVoiceUpdate } = require("./xp/xpListeners");

// ==================================================
// DISCORD CLIENT
// ==================================================
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
// TOKEN CHECK
// ==================================================
if (!process.env.TOKEN) {
  console.error("❌ BOT TOKEN is missing in .env");
  process.exit(1);
} else {
  console.log("✅ BOT TOKEN found");
}

// ==================================================
// COMMAND LOADER
// ==================================================
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;

  try {
    const command = require(path.join(commandsPath, file));
    if (command?.data?.name) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Command ${file} missing data.name`);
    }
  } catch (err) {
    console.error(`❌ Failed to load command ${file}:`, err);
  }
}

// ==================================================
// INTERACTION HANDLER
// ==================================================
client.on("interactionCreate", async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }

    // Buttons (Tickets)
    if (interaction.isButton()) {
      const ticket = client.commands.get("ticket");
      if (!ticket) return;

      if (interaction.customId.startsWith("ticket_type_") && ticket.handleButton)
        return ticket.handleButton(interaction);

      if (interaction.customId === "ticket_close" && ticket.handleCloseButton)
        return ticket.handleCloseButton(interaction);
    }

    // Select menus (Ticket Priority)
    if (interaction.isStringSelectMenu()) {
      const ticket = client.commands.get("ticket");
      if (ticket && ticket.handlePrioritySelect) return ticket.handlePrioritySelect(interaction);
    }

    // Modals (Ticket Submit)
    if (interaction.isModalSubmit()) {
      const ticket = client.commands.get("ticket");
      if (ticket && ticket.handleModalSubmit) return ticket.handleModalSubmit(interaction, client);
    }
  } catch (err) {
    console.error("INTERACTION ERROR:", err);
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: "❌ Something went wrong.", ephemeral: true });
      } catch {}
    }
  }
});

// ==================================================
// XP EVENT LISTENERS
// ==================================================
client.on("messageCreate", handleMessage);
client.on("messageReactionAdd", handleReaction);
client.on("voiceStateUpdate", handleVoiceUpdate);

// ==================================================
// READY
// ==================================================
client.once("clientReady", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  // Poll system
  polls.init(client);
  console.log("✅ Poll system initialised.");

  // Initialize the Arma Reforger server updater
  await initServerUpdater(client);
  console.log("✅ Server updater initialised.");
});

// ==================================================
// LOGIN
// ==================================================
client.login(process.env.TOKEN)
  .then(() => console.log("🔑 Login attempt sent"))
  .catch((err) => console.error("❌ Failed to login:", err));

// ==================================================
// EXPORT CLIENT
// ==================================================
module.exports = { client };