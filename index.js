// =======================
// PROCESS SAFETY (NEVER CRASH)
// =======================
process.on("unhandledRejection", reason => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", err => {
  console.error("❌ Uncaught Exception:", err);
});

// =======================
// KEEP-ALIVE + DASHBOARD
// =======================
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.status(200).send("BattleFront Madness bot online"));
app.get("/health", (req, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));

// Dashboard
const { app: dashboardApp, io } = require("./dashboard/server");
app.use("/dashboard", dashboardApp);

// =======================
// DISCORD IMPORTS
// =======================
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require("discord.js");
const fs = require("fs");

// =======================
// DATABASE
// =======================
const { getUser, addXP, setLevel } = require("./database/xp");
const { getDiscordByGamertag } = require("./database/gamertags");
const polls = require("./database/polls");

// =======================
// CONFIG
// =======================
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
  KILLFEED_CHANNEL_ID
} = require("./config");

// =======================
// FETCH
// =======================
let fetch;
(async () => { fetch = (await import("node-fetch")).default; })();

// =======================
// CLIENT
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
// COMMANDS
// =======================
client.commands = new Collection();
for (const file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

// =======================
// XP HELPERS
// =======================
const nextXP = lvl => 100 + lvl * 50;
const rankName = lvl => lvl >= 50 ? "General" : lvl >= 30 ? "Colonel" : lvl >= 15 ? "Sergeant" : "Recruit";

function giveXP(userId, amount) {
  if (!XP) return;
  const user = getUser(userId);
  const newXP = addXP(userId, amount);

  if (newXP >= nextXP(user.level)) {
    const lvl = user.level + 1;
    setLevel(userId, lvl);

    const ch = client.channels.cache.get(LEVEL_CHANNEL_ID);
    if (ch) ch.send({
      embeds: [new EmbedBuilder()
        .setTitle("🎉 Level Up!")
        .setDescription(`<@${userId}> reached **Level ${lvl}**`)
        .setColor(0x1abc9c)
        .setTimestamp()
      ]
    }).catch(() => {});

    io.emit("xpUpdate", { userId, level: lvl, xp: newXP, rank: rankName(lvl), nextXP: nextXP(lvl) });
  }
}

// =======================
// MESSAGE XP HANDLER
// =======================
const messageCooldown = new Set();
const botMessageTracker = new Map();

client.on("messageCreate", async message => {
  if (!message.guild) return;

  // Bot spam auto-ban
  if (message.author.bot) {
    if (!STAFF_ROLE_IDS.includes(message.author.id)) {
      const now = Date.now();
      if (!botMessageTracker.has(message.author.id)) botMessageTracker.set(message.author.id, []);
      const times = botMessageTracker.get(message.author.id);
      times.push(now);
      while (times[0] < now - SPAM_INTERVAL) times.shift();
      if (times.length >= SPAM_LIMIT) {
        try {
          const member = await message.guild.members.fetch(message.author.id).catch(() => null);
          if (!member) return;
          await member.ban({ reason: "Bot spam detected" });
          logAction(`🚨 Banned bot ${member.user.tag} for spam`);
        } catch (err) { console.warn("⚠️ Auto-ban failed:", err.message); }
      }
    }
    return;
  }

  // Regular message XP
  if (!messageCooldown.has(message.author.id)) {
    if (XP?.MESSAGE) giveXP(message.author.id, XP.MESSAGE);
    messageCooldown.add(message.author.id);
    setTimeout(() => messageCooldown.delete(message.author.id), MESSAGE_COOLDOWN);
  }

  // Killfeed XP
  if (message.channel.id === KILLFEED_CHANNEL_ID) {
    const killRegex = /^(.+?) killed .+$/i;
    const match = message.content.match(killRegex);
    if (match) {
      const killerTag = match[1];
      const discordId = getDiscordByGamertag(killerTag);
      if (discordId) {
        giveXP(discordId, XP?.KILL || 50);
        const modCh = client.channels.cache.get(MOD_LOG_CHANNEL);
        if (modCh) modCh.send({
          embeds: [new EmbedBuilder()
            .setTitle("💥 Kill XP")
            .setDescription(`<@${discordId}> got ${XP?.KILL || 50} XP for a kill (${killerTag})`)
            .setColor(0xff0000)
            .setTimestamp()
          ]
        }).catch(() => {});
      }
    }
  }
});

// =======================
// REACTIONS
// =======================
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) try { await reaction.fetch(); } catch { return; }
  if (XP?.REACTION) giveXP(user.id, XP.REACTION);
});

// =======================
// VOICE
// =======================
const voiceUsers = new Map();
client.on("voiceStateUpdate", (oldState, newState) => {
  const id = newState.id;
  if (!oldState.channelId && newState.channelId) voiceUsers.set(id, Date.now());
  if (oldState.channelId && !newState.channelId) {
    const joined = voiceUsers.get(id);
    if (!joined) return;
    const mins = Math.floor((Date.now() - joined) / 60000);
    if (mins > 0 && XP?.VOICE_PER_MINUTE) giveXP(id, mins * XP.VOICE_PER_MINUTE);
    voiceUsers.delete(id);
  }
});

// =======================
// COMMAND INTERACTIONS
// =======================
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try { await cmd.execute(i); }
  catch (e) { console.error(e); if (!i.replied) i.reply({ content: "❌ Command error", ephemeral: true }); }
});

// =======================
// RAID PROTECTION
// =======================
let raidMode = false;
const recentJoins = [];

client.on("guildMemberAdd", m => {
  if (raidMode) m.timeout(60000, "Raid lockdown").catch(() => {});
  recentJoins.push(Date.now());
  while (recentJoins[0] < Date.now() - RAID_JOIN_INTERVAL) recentJoins.shift();
  if (recentJoins.length >= RAID_JOIN_THRESHOLD && !raidMode) {
    raidMode = true;
    lockDownServer();
    logAction("🚨 RAID DETECTED — lockdown enabled");
  }
});

function lockDownServer() {
  client.guilds.cache.forEach(g => g.channels.cache.forEach(c => {
    if (!SAFE_CHANNELS.includes(c.id)) {
      c.permissionOverwrites.edit(g.roles.everyone, { SendMessages: false, Connect: false }).catch(() => {});
    }
  }));
}

function logAction(msg) {
  const ch = client.channels.cache.get(MOD_LOG_CHANNEL);
  if (ch) ch.send(msg).catch(() => {});
}

// =======================
// POLLS INIT
// =======================
polls.init(client);

// =======================
// LIVE CHECKER
// =======================
const liveStatus = {};
async function checkLive() {
  if (!fetch) return;
  const ch = client.channels.cache.get(LIVE_ANNOUNCE_CHANNEL_ID);
  if (!ch) return;

  for (const s of STREAMERS) {
    try {
      let isLive = false; let url = "";
      if (s.platform === "twitch") {
        const r = await fetch(`https://api.twitch.tv/helix/streams?user_id=${s.id}`, { headers: { "Client-ID": TWITCH_CLIENT_ID, Authorization: `Bearer ${TWITCH_OAUTH_TOKEN}` } });
        if (!r.ok) continue;
        const d = await r.json().catch(() => null);
        if (d?.data?.length) { isLive = true; url = `https://twitch.tv/${s.name}`; }
      }
      if (isLive && !liveStatus[s.name]) {
        liveStatus[s.name] = true;
        ch.send({ embeds: [new EmbedBuilder().setTitle(`🔴 ${s.name} is LIVE`).setURL(url).setColor(0xff0000)] }).catch(() => {});
      }
      if (!isLive) liveStatus[s.name] = false;
      io.emit("liveUpdate", { streamer: s.name, isLive, url });
    } catch (e) { console.warn("Live check failed", e.message); }
  }
}
setInterval(checkLive, 60000);

// =======================
// SERVER START
// =======================
app.listen(PORT, () => console.log(`🌐 Web server on port ${PORT}`));

const TOKEN = process.env.TOKEN;
if (!TOKEN) process.exit(1);

client.once("ready", () => console.log(`🤖 Logged in as ${client.user.tag}`));
client.login(TOKEN);
