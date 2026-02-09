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
app.listen(process.env.PORT || 8080, () => console.log("🌐 Express server running"));

// ==================================================
// DISCORD CLIENT
// ==================================================
const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");

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
// INTERACTION HANDLER
// ==================================================
client.on("interactionCreate", async (interaction) => {
  try {
    // --------- Slash Commands ---------
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }

    // --------- Buttons ---------
    if (interaction.isButton()) {
      const ticket = client.commands.get("ticket");
      if (!ticket) return;

      if (interaction.customId.startsWith("ticket_type_") && ticket.handleButton) {
        await ticket.handleButton(interaction);
      } else if (interaction.customId.startsWith("ticket_close_") && ticket.handleCloseButton) {
        await ticket.handleCloseButton(interaction);
      }
      return;
    }

    // --------- Select Menus ---------
    if (interaction.isStringSelectMenu()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handlePrioritySelect) await ticket.handlePrioritySelect(interaction);
      return;
    }

    // --------- Modals ---------
    if (interaction.isModalSubmit()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handleModalSubmit) await ticket.handleModalSubmit(interaction, client);
      return;
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
// READY
// ==================================================
client.once("clientReady", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// ==================================================
// LOGIN
// ==================================================
if (!process.env.TOKEN) throw new Error("❌ TOKEN not set in .env");
client.login(process.env.TOKEN);

module.exports = { client };
