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
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require("discord.js");
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
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      const ticket = client.commands.get("ticket");

      if (ticket) {
        if (interaction.customId.startsWith("ticket_type_") && ticket.handleButton)
          return ticket.handleButton(interaction);

        if (interaction.customId === "ticket_close" && ticket.handleCloseButton)
          return ticket.handleCloseButton(interaction);
      }

      // Poll buttons
      if (
        interaction.customId.startsWith("poll_option_") ||
        interaction.customId.startsWith("poll_custom_")
      ) {
        const msgId = interaction.message.id;
        const poll = polls.getPoll(msgId);
        if (!poll) return;

        if (interaction.customId.startsWith("poll_custom")) {
          const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
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
          return interaction.showModal(modal);
        }

        // Normal vote
        const index = parseInt(interaction.customId.split("_")[2]);
        const option = poll.options[index];
        if (!option) return;

        for (const opt of Object.keys(poll.votes)) {
          poll.votes[opt] = poll.votes[opt].filter((uid) => uid !== interaction.user.id);
        }

        poll.votes[option].push(interaction.user.id);
        polls.updatePoll(msgId, poll);

        const newEmbed = new EmbedBuilder()
          .setTitle(`📊 ${poll.question}`)
          .setColor(0x3498db)
          .setFooter({
            text: `Poll ends in ${Math.max(0, Math.floor((poll.expires - Date.now()) / 60000))} minutes`
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

        return interaction.update({ embeds: [newEmbed] });
      }
    }

    if (interaction.isModalSubmit()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handleModalSubmit) return ticket.handleModalSubmit(interaction, client);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handlePrioritySelect) return ticket.handlePrioritySelect(interaction);
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
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  polls.init(client);

  console.log("✅ Poll system initialised.");
});

// ==================================================
// LOGIN
// ==================================================
client.login(process.env.TOKEN)
  .then(() => console.log("🔑 Login attempt sent"))
  .catch((err) => console.error("❌ Failed to login:", err));

module.exports = { client };
