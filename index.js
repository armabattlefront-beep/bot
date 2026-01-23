// =======================
// KEEP-ALIVE + DASHBOARD
// =======================
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.status(200).send("BattleFront Madness bot online"));
app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", uptime: process.uptime() })
);

// =======================
// DASHBOARD INTEGRATION
// =======================
const { app: dashboardApp, io } = require("./dashboard/server");
app.use("/dashboard", dashboardApp);

// =======================
// DISCORD IMPORTS
// =======================
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder
} = require("discord.js");
const fs = require("fs");

// =======================
// DATABASE (XP PERSISTENCE)
// =======================
const { getUser, addXP, setLevel } = require("./database/xp");

const {
  XP,
  MESSAGE_COOLDOWN,
  LEVEL_CHANNEL_ID,
  SAFE_CHANNELS,
  MOD_LOG_CHANNEL,
  RAID_JOIN_THRESHOLD,
  RAID_JOIN_INTERVAL,
  SPAM_LIMIT,
  SPAM_INTERVAL,
  STAFF_ROLE_IDS,
  LIVE_ANNOUNCE_CHANNEL_ID,
  STREAMERS,
  TWITCH_CLIENT_ID,
  TWITCH_OAUTH_TOKEN,
  YOUTUBE_API_KEY
} = require("./config");

// =======================
// FETCH (DYNAMIC IMPORT)
// =======================
let fetch;
(async () => { fetch = (await import("node-fetch")).default; })();

// =======================
// DISCORD CLIENT SETUP
// =======================
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

// =======================
// COMMANDS SETUP
// =======================
client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`⚠️ Command ${file} missing data/execute`);
  }
}

// =======================
// XP HELPERS
// =======================
function getNextLevelXP(level) {
  return 100 + level * 50;
}

function getRankName(level) {
  if (level >= 50) return "General";
  if (level >= 30) return "Colonel";
  if (level >= 15) return "Sergeant";
  return "Recruit";
}

function giveXP(userId, amount) {
  if (!XP) return;

  const user = getUser(userId);
  const newXP = addXP(userId, amount);

  const nextXP = getNextLevelXP(user.level);

  if (newXP >= nextXP) {
    const newLevel = user.level + 1;
    setLevel(userId, newLevel);

    const channel = client.channels.cache.get(LEVEL_CHANNEL_ID);
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle("🎉 Level Up!")
        .setDescription(`✨ **<@${userId}>** reached **Level ${newLevel}**!`)
        .setColor(0x1abc9c)
        .setTimestamp();

      channel.send({ embeds: [embed] });
    }

    io.emit("xpUpdate", {
      userId,
      level: newLevel,
      xp: newXP,
      rank: getRankName(newLevel),
      nextXP: getNextLevelXP(newLevel)
    });
  }
}

// =======================
// MESSAGE XP + SPAM PROTECTION
// =======================
const messageCooldown = new Set();
const botMessageTracker = new Map();

client.on("messageCreate", message => {
  if (message.author.bot) {
    if (!STAFF_ROLE_IDS.includes(message.author.id)) {
      const now = Date.now();
      if (!botMessageTracker.has(message.author.id)) {
        botMessageTracker.set(message.author.id, []);
      }
      const timestamps = botMessageTracker.get(message.author.id);
      timestamps.push(now);
      while (timestamps[0] < now - SPAM_INTERVAL) timestamps.shift();
      if (timestamps.length >= SPAM_LIMIT) {
        message.guild.members.ban(message.author.id, { reason: "Bot spam detected" });
        logAction(`🚨 Banned bot ${message.author.tag} for spam`);
      }
    }
    return;
  }

  if (!messageCooldown.has(message.author.id)) {
    if (XP?.MESSAGE) giveXP(message.author.id, XP.MESSAGE);
    messageCooldown.add(message.author.id);
    setTimeout(() => messageCooldown.delete(message.author.id), MESSAGE_COOLDOWN);
  }
});

// =======================
// REACTION XP
// =======================
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  if (XP?.REACTION) giveXP(user.id, XP.REACTION);
});

// =======================
// VOICE XP
// =======================
const voiceUsers = new Map();

client.on("voiceStateUpdate", (oldState, newState) => {
  const userId = newState.id;

  if (!oldState.channelId && newState.channelId) {
    voiceUsers.set(userId, Date.now());
  }

  if (oldState.channelId && !newState.channelId) {
    const joinedAt = voiceUsers.get(userId);
    if (!joinedAt) return;
    const minutes = Math.floor((Date.now() - joinedAt) / 60000);
    if (minutes > 0 && XP?.VOICE_PER_MINUTE) {
      giveXP(userId, minutes * XP.VOICE_PER_MINUTE);
    }
    voiceUsers.delete(userId);
  }
});

// =======================
// COMMAND HANDLER
// =======================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      interaction.reply({ content: "❌ Command error", ephemeral: true });
    }
  }
});

// =======================
// RAID PROTECTION
// =======================
let raidMode = false;
const recentJoins = [];

client.on("guildMemberAdd", member => {
  if (raidMode) member.timeout(60000, "Raid lockdown active");

  recentJoins.push(Date.now());
  while (recentJoins[0] < Date.now() - RAID_JOIN_INTERVAL) recentJoins.shift();

  if (recentJoins.length >= RAID_JOIN_THRESHOLD && !raidMode) {
    raidMode = true;
    lockDownServer();
    logAction("🚨 RAID DETECTED — server locked");
  }
});

function lockDownServer() {
  client.guilds.cache.forEach(guild => {
    guild.channels.cache.forEach(channel => {
      if (!SAFE_CHANNELS.includes(channel.id)) {
        channel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: false,
          Connect: false
        });
      }
    });
  });
}

function logAction(message) {
  const logChannel = client.channels.cache.get(MOD_LOG_CHANNEL);
  if (logChannel) logChannel.send(message);
}

// =======================
// LIVE STATUS CHECKER
// =======================
const liveStatus = {};

async function checkLive() {
  if (!fetch) return;
  const channel = client.channels.cache.get(LIVE_ANNOUNCE_CHANNEL_ID);
  if (!channel) return;

  for (const streamer of STREAMERS) {
    try {
      let isLive = false;
      let url = "";

      if (streamer.platform === "twitch") {
        const res = await fetch(`https://api.twitch.tv/helix/streams?user_id=${streamer.id}`, {
          headers: {
            "Client-ID": TWITCH_CLIENT_ID,
            "Authorization": `Bearer ${TWITCH_OAUTH_TOKEN}`
          }
        });
        const data = await res.json();
        if (data.data?.length) {
          isLive = true;
          url = `https://twitch.tv/${streamer.name}`;
        }
      }

      if (isLive && !liveStatus[streamer.name]) {
        liveStatus[streamer.name] = true;
        channel.send({ embeds: [
          new EmbedBuilder()
            .setTitle(`🔴 ${streamer.name} is LIVE!`)
            .setURL(url)
            .setColor(0xff0000)
            .setTimestamp()
        ]});
      }

      if (!isLive) liveStatus[streamer.name] = false;
      io.emit("liveUpdate", { streamer: streamer.name, isLive, url });

    } catch (err) {
      console.error(`Live check failed for ${streamer.name}`, err);
    }
  }
}

function startLiveChecker() {
  setInterval(checkLive, 60000);
}

// =======================
// SERVER START
// =======================
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// =======================
// DISCORD LOGIN
// =======================
const BOT_TOKEN = process.env.TOKEN;
if (!BOT_TOKEN) {
  console.error("❌ TOKEN missing");
  process.exit(1);
}

client.once("clientReady", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  startLiveChecker();
});

client.login(BOT_TOKEN);
