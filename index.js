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
const {
  addXP,
  getUser,
  getMetrics,
  toggleDoubleXP,
  isDoubleXP
} = require("./database/xp");
const { getPoll, updatePoll } = require("./database/polls");

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
// XP COOLDOWNS
// ==================================================
const messageCooldowns = new Map(); // userId -> timestamp
const reactionCooldowns = new Map(); // userId -> timestamp
const voiceTimes = new Map(); // userId -> join timestamp
const XP = getMetrics();

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
      } else if (interaction.customId === "ticket_close" && ticket.handleCloseButton) {
        await ticket.handleCloseButton(interaction);
      }

      // ===== Poll Button Handling =====
      if (interaction.customId.startsWith("poll_option_") || interaction.customId.startsWith("poll_custom_")) {
        const msgId = interaction.message.id;
        const poll = getPoll(msgId);
        if (!poll) return;

        // Custom response
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
          await interaction.showModal(modal);
          return;
        }

        // Regular option vote
        const index = parseInt(interaction.customId.split("_")[2]);
        const option = poll.options[index];
        if (!option) return;

        // Remove previous vote
        for (const opt of Object.keys(poll.votes)) {
          poll.votes[opt] = poll.votes[opt].filter(uid => uid !== interaction.user.id);
        }

        poll.votes[option].push(interaction.user.id);
        updatePoll(msgId, poll);

        const { EmbedBuilder } = require("discord.js");
        const newEmbed = new EmbedBuilder()
          .setTitle(`📊 ${poll.question}`)
          .setColor(0x3498db)
          .setFooter({ text: `Poll ends in ${Math.max(0, Math.floor((poll.expires - Date.now()) / 60000))} minutes` })
          .setTimestamp()
          .setDescription(
            poll.options.map(opt => {
              const count = poll.votes[opt]?.length || 0;
              return `**${opt}** — ${count} vote${count === 1 ? "" : "s"}`;
            }).join("\n")
          );

        await interaction.update({ embeds: [newEmbed] });
      }

      return;
    }

    // --------- Modal Submit (Custom Poll Response) ---------
    if (interaction.isModalSubmit() && interaction.customId.startsWith("poll_modal_")) {
      const msgId = interaction.customId.split("_")[2];
      const poll = getPoll(msgId);
      if (!poll) return;

      const customOption = interaction.fields.getTextInputValue("customOption").trim();
      if (!customOption) return interaction.reply({ content: "❌ Invalid response.", ephemeral: true });

      // Add new option if not exists
      if (!poll.options.includes(customOption)) {
        poll.options.push(customOption);
        poll.votes[customOption] = [interaction.user.id];
      } else {
        poll.votes[customOption].push(interaction.user.id);
      }

      updatePoll(msgId, poll);

      // Update buttons and embed
      const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
      const newRow = new ActionRowBuilder();
      poll.options.forEach((opt, idx) => {
        newRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_option_${idx}_${Date.now()}`)
            .setLabel(opt)
            .setStyle(ButtonStyle.Primary)
        );
      });
      if (poll.allowCustom) {
        newRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_custom_${Date.now()}`)
            .setLabel("Custom Response")
            .setStyle(ButtonStyle.Secondary)
        );
      }

      const channel = await client.channels.fetch(poll.channelId);
      const pollMsg = await channel.messages.fetch(msgId);

      const newEmbed = new EmbedBuilder()
        .setTitle(`📊 ${poll.question}`)
        .setColor(0x3498db)
        .setFooter({ text: `Poll ends in ${Math.max(0, Math.floor((poll.expires - Date.now()) / 60000))} minutes` })
        .setTimestamp()
        .setDescription(
          poll.options.map(opt => {
            const count = poll.votes[opt]?.length || 0;
            return `**${opt}** — ${count} vote${count === 1 ? "" : "s"}`;
          }).join("\n")
        );

      await interaction.reply({ content: "✅ Your response has been added!", ephemeral: true });
      await pollMsg.edit({ embeds: [newEmbed], components: [newRow] });
      return;
    }

    // --------- Select Menus ---------
    if (interaction.isStringSelectMenu()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handlePrioritySelect) await ticket.handlePrioritySelect(interaction);
      return;
    }

    // --------- Other Modals (tickets) ---------
    if (interaction.isModalSubmit()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handleModalSubmit) await ticket.handleModalSubmit(interaction, client);
      return;
    }

  } catch (err) {
    console.error("INTERACTION ERROR:", err);
    if (!interaction.replied && !interaction.deferred) {
      try { await interaction.reply({ content: "❌ Something went wrong.", ephemeral: true }); } catch {}
    }
  }
});

// ==================================================
// MESSAGE XP
// ==================================================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (config.SAFE_CHANNELS.includes(message.channel.id)) return;

  const now = Date.now();
  const last = messageCooldowns.get(message.author.id) || 0;
  if (now - last < config.MESSAGE_COOLDOWN) return;
  messageCooldowns.set(message.author.id, now);

  // Base message XP
  const { leveledUp, level } = addXP(message.author.id, XP.message);

  // Attachments XP
  if (message.attachments.size > 0) {
    let bonusXP = 0;
    message.attachments.forEach(att => {
      if (att.contentType?.startsWith("image")) bonusXP += XP.image;
      else if (att.contentType?.startsWith("video")) bonusXP += XP.video;
    });
    if (bonusXP > 0) addXP(message.author.id, bonusXP);
  }

  if (leveledUp) {
    const lvlChannel = client.channels.cache.get(config.LEVEL_CHANNEL_ID);
    if (lvlChannel) lvlChannel.send(`🎉 <@${message.author.id}> reached level **${level}**!`);
  }
});

// ==================================================
// REACTION XP
// ==================================================
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const now = Date.now();
  const last = reactionCooldowns.get(user.id) || 0;
  if (now - last < 10000) return;
  reactionCooldowns.set(user.id, now);

  addXP(user.id, XP.reaction);
});

// ==================================================
// VOICE XP
// ==================================================
client.on("voiceStateUpdate", (oldState, newState) => {
  const member = newState.member;
  if (!member || member.user.bot) return;
  const userId = member.id;

  if (!oldState.channelId && newState.channelId) voiceTimes.set(userId, Date.now());
  if (oldState.channelId && !newState.channelId) {
    const joinTime = voiceTimes.get(userId);
    if (!joinTime) return;
    const minutes = Math.floor((Date.now() - joinTime) / 60000);
    if (minutes > 0) addXP(userId, minutes * XP.voiceMinute);
    voiceTimes.delete(userId);
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

module.exports = { client, toggleDoubleXP, isDoubleXP };
