// database/polls.js
const db = require("./db");
const { EmbedBuilder } = require("discord.js");

// =======================
// CREATE POLLS TABLE
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS polls (
    messageId TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    votes TEXT NOT NULL,
    expires INTEGER,
    channelId TEXT NOT NULL,
    allowCustom INTEGER DEFAULT 0
  )
`).run();

// =======================
// ADD POLL
// =======================
function addPoll(messageId, poll) {
  db.prepare(`
    INSERT INTO polls (messageId, question, options, votes, expires, channelId, allowCustom)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    messageId,
    poll.question,
    JSON.stringify(poll.options),
    JSON.stringify(poll.votes),
    poll.expires,
    poll.channelId,
    poll.allowCustom ? 1 : 0
  );
}

// =======================
// GET POLL
// =======================
function getPoll(messageId) {
  const row = db.prepare("SELECT * FROM polls WHERE messageId = ?").get(messageId);
  if (!row) return null;
  return {
    ...row,
    options: JSON.parse(row.options),
    votes: JSON.parse(row.votes),
    allowCustom: !!row.allowCustom
  };
}

// =======================
// UPDATE POLL
// =======================
function updatePoll(messageId, poll) {
  db.prepare(`
    UPDATE polls SET options = ?, votes = ?, expires = ?, allowCustom = ?
    WHERE messageId = ?
  `).run(
    JSON.stringify(poll.options),
    JSON.stringify(poll.votes),
    poll.expires,
    poll.allowCustom ? 1 : 0,
    messageId
  );
}

// =======================
// REMOVE POLL
// =======================
function removePoll(messageId) {
  db.prepare("DELETE FROM polls WHERE messageId = ?").run(messageId);
}

// =======================
// GET ALL POLLS
// =======================
function getAllPolls() {
  const rows = db.prepare("SELECT * FROM polls").all();
  return rows.map(r => ({
    ...r,
    options: JSON.parse(r.options),
    votes: JSON.parse(r.votes),
    allowCustom: !!r.allowCustom
  }));
}

// =======================
// INIT AUTO-CLOSE LOOP
// =======================
function init(client) {
  setInterval(async () => {
    const now = Date.now();
    const polls = getAllPolls();

    for (const poll of polls) {
      if (poll.expires && now >= poll.expires) {
        const channel = client.channels.cache.get(poll.channelId);
        if (!channel) continue;

        try {
          const msg = await channel.messages.fetch(poll.messageId).catch(() => null);
          if (!msg) continue;

          // Build results embed
          const embed = new EmbedBuilder()
            .setTitle(`📊 Poll Results: ${poll.question}`)
            .setColor(0x3498db)
            .setTimestamp();

          for (const option of poll.options) {
            const count = poll.votes[option]?.length || 0;
            embed.addFields({ name: option, value: `${count} votes`, inline: true });
          }

          await msg.edit({ embeds: [embed], components: [] });

        } catch (e) {
          console.warn("Poll auto-close error:", e.message);
        }

        removePoll(poll.messageId);
      }
    }
  }, 5000);
}

// =======================
// EXPORT
// =======================
module.exports = { init, addPoll, getPoll, updatePoll, removePoll, getAllPolls };
