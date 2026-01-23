// database/polls.js
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const dbDir = path.join(__dirname, "../data");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const POLL_FILE = path.join(dbDir, "polls.json");
let polls = {};

// Load polls from file
if (fs.existsSync(POLL_FILE)) {
  try { polls = JSON.parse(fs.readFileSync(POLL_FILE)); } 
  catch { polls = {}; }
}

function savePolls() {
  fs.writeFileSync(POLL_FILE, JSON.stringify(polls, null, 2));
}

// Initialize with client to handle auto-close
function init(client) {
  setInterval(async () => {
    const now = Date.now();
    for (const [msgId, poll] of Object.entries(polls)) {
      if (poll.expires && now >= poll.expires) {
        const channel = client.channels.cache.get(poll.channelId);
        if (!channel) continue;
        try {
          const msg = await channel.messages.fetch(msgId).catch(() => null);
          if (!msg) continue;

          // Build results embed
          const embed = new EmbedBuilder()
            .setTitle(`📊 Poll Results: ${poll.question}`)
            .setColor(0x3498db)
            .setTimestamp();

          for (const [option, votes] of Object.entries(poll.votes)) {
            embed.addFields({ name: option, value: `${votes} votes`, inline: true });
          }

          await msg.edit({ embeds: [embed], components: [] });
        } catch (e) {
          console.warn("Poll auto-close error:", e.message);
        }

        delete polls[msgId];
      }
    }
    savePolls();
  }, 5000);
}

// Poll helpers
function addPoll(messageId, pollData) {
  polls[messageId] = pollData;
  savePolls();
}

function getPoll(messageId) {
  return polls[messageId] || null;
}

function updatePoll(messageId, pollData) {
  if (!polls[messageId]) return;
  polls[messageId] = pollData;
  savePolls();
}

function removePoll(messageId) {
  delete polls[messageId];
  savePolls();
}

function getAllPolls() {
  return Object.entries(polls).map(([id, data]) => ({ id, ...data }));
}

module.exports = { init, addPoll, getPoll, updatePoll, removePoll, getAllPolls };
