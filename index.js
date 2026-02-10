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
const db = require("./database/db");
const { addXP, getMetrics, toggleDoubleXP, isDoubleXP } = require("./database/xp");
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
const messageCooldowns = new Map();
const reactionCooldowns = new Map();
const voiceTimes = new Map();
const XP = getMetrics(); // XP per action

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
      if (!ticket) return;

      if (interaction.customId.startsWith("ticket_type_") && ticket.handleButton) {
        await ticket.handleButton(interaction);
      } else if (interaction.customId === "ticket_close" && ticket.handleCloseButton) {
        await ticket.handleCloseButton(interaction);
      }

      // Poll handling
      if (interaction.customId.startsWith("poll_option_") || interaction.customId.startsWith("poll_custom_")) {
        const msgId = interaction.message.id;
        const poll = getPoll(msgId);
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
          await interaction.showModal(modal);
          return;
        }

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

    if (interaction.isModalSubmit()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handleModalSubmit) await ticket.handleModalSubmit(interaction, client);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      const ticket = client.commands.get("ticket");
      if (ticket?.handlePrioritySelect) await ticket.handlePrioritySelect(interaction);
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

  // Add XP directly to DB
  await addXP(message.author.id, XP.message);

  if (message.attachments.size > 0) {
    let bonusXP = 0;
    message.attachments.forEach(att => {
      if (att.contentType?.startsWith("image")) bonusXP += XP.image;
      else if (att.contentType?.startsWith("video")) bonusXP += XP.video;
    });
    if (bonusXP > 0) await addXP(message.author.id, bonusXP);
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

  await addXP(user.id, XP.reaction);
});

// ==================================================
// VOICE XP
// ==================================================
client.on("voiceStateUpdate", async (oldState, newState) => {
  const member = newState.member;
  if (!member || member.user.bot) return;
  const userId = member.id;

  if (!oldState.channelId && newState.channelId) voiceTimes.set(userId, Date.now());
  if (oldState.channelId && !newState.channelId) {
    const joinTime = voiceTimes.get(userId);
    if (!joinTime) return;
    const minutes = Math.floor((Date.now() - joinTime) / 60000);
    if (minutes > 0) await addXP(userId, minutes * XP.voiceMinute);
    voiceTimes.delete(userId);
  }
});

// ==================================================
// READY + POPULATE MISSING USERS
// ==================================================
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  for (const [guildId, guild] of client.guilds.cache) {
    try {
      await guild.members.fetch();
      let addedCount = 0;

      guild.members.cache.forEach(member => {
        if (member.user.bot) return;
        const exists = db.prepare("SELECT 1 FROM users WHERE userId = ?").get(member.id);
        if (!exists) {
          db.prepare("INSERT INTO users (userId, xp, level, prestige) VALUES (?, 0, 0, 0)").run(member.id);
          addedCount++;
        }
      });

      console.log(`✅ Populated ${addedCount} missing users for guild ${guild.name}`);
    } catch (err) {
      console.error(`❌ Failed to populate users for guild ${guild.name}:`, err);
    }
  }

  console.log("✅ DB populated with all guild members.");
});

// ==================================================
// LOGIN
// ==================================================
if (!process.env.TOKEN) throw new Error("❌ TOKEN not set in .env");
client.login(process.env.TOKEN);

module.exports = { client, toggleDoubleXP, isDoubleXP };
