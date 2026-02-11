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
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const config = require("./config");
const polls = require("./database/polls");

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
// COMMAND LOADER
// ==================================================
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;

  const command = require(path.join(commandsPath, file));

  if (command?.data?.name) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`⚠️ Command ${file} missing data.name`);
  }
}

// ==================================================
// INTERACTION HANDLER
// ==================================================
client.on("interactionCreate", async (interaction) => {
  try {
    // =======================
    // SLASH COMMANDS
    // =======================
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }

    // =======================
    // BUTTONS
    // =======================
    if (interaction.isButton()) {
      const ticket = client.commands.get("ticket");

      if (ticket) {
        if (interaction.customId.startsWith("ticket_type_") && ticket.handleButton) {
          await ticket.handleButton(interaction);
          return;
        }

        if (interaction.customId === "ticket_close" && ticket.handleCloseButton) {
          await ticket.handleCloseButton(interaction);
          return;
        }
      }

      // =======================
      // POLL BUTTONS
      // =======================
      if (
        interaction.customId.startsWith("poll_option_") ||
        interaction.customId.startsWith("poll_custom_")
      ) {
        const msgId = interaction.message.id;
        const poll = polls.getPoll(msgId);
        if (!poll) return;

        // Custom option modal
        if (interaction.customId.startsWith("poll_custom")) {
          const {
            ModalBuilder,
            ActionRowBuilder,
            TextInputBuilder,
            TextInputStyle
          } = require("discord.js");

          const modal = new ModalBuilder()
            .setCustomId(`poll_modal_${msgId}_${Date.now()}`)
            .setTitle("Submit a Custom Poll Response")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("customOption")
                  .setLabel("Your Option")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("Type your response here")
                  .setRequired(true)
              )
            );

          await interaction.showModal(modal);
          return;
        }

        // Normal vote
        const index = parseInt(interaction.customId.split("_")[2]);
        const option = poll.options[index];
        if (!option) return;

        // Remove previous votes
        for (const opt of Object.keys(poll.votes)) {
          poll.votes[opt] = poll.votes[opt].filter(
            (uid) => uid !== interaction.user.id
          );
        }

        poll.votes[option].push(interaction.user.id);
        polls.updatePoll(msgId, poll);

        const newEmbed = new EmbedBuilder()
          .setTitle(`📊 ${poll.question}`)
          .setColor(0x3498db)
          .setFooter({
            text: `Poll ends in ${Math.max(
              0,
              Math.floor((poll.expires - Date.now()) / 60000)
            )} minutes`
          })
          .setTimestamp()
          .setDescription(
            poll.options
              .map((opt) => {
                const count = poll.votes[opt]?.length || 0;
                return `**${opt}** — ${count} vote${count === 1 ? "" : "s"}`;
              })
              .join("\n")
          );

        await interaction.update({ embeds: [newEmbed] });
        return;
      }
    }

    // =======================
    // MODALS
    // =======================
    if (interaction.isModalSubmit()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handleModalSubmit)
        await ticket.handleModalSubmit(interaction, client);
      return;
    }

    // =======================
    // SELECT MENUS
    // =======================
    if (interaction.isStringSelectMenu()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handlePrioritySelect)
        await ticket.handlePrioritySelect(interaction);
      return;
    }

  } catch (err) {
    console.error("INTERACTION ERROR:", err);

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: "❌ Something went wrong.",
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

  // Start poll auto-close loop
  polls.init(client);

  console.log("✅ Poll system initialised.");
});

// ==================================================
// LOGIN
// ==================================================
if (!process.env.TOKEN)
  throw new Error("❌ TOKEN not set in .env");

client.login(process.env.TOKEN);

module.exports = { client };
