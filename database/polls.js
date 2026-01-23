const fs = require("fs");
const path = require("path");

const POLL_FILE = path.join(__dirname, "polls.json");

let polls = {};

// =======================
// Load polls safely
// =======================
function loadPolls() {
  if (!fs.existsSync(POLL_FILE)) {
    polls = {};
    return;
  }
  try {
    const data = fs.readFileSync(POLL_FILE, "utf8");
    polls = JSON.parse(data) || {};
  } catch (err) {
    console.warn("⚠️ Failed to load polls.json, starting empty:", err.message);
    polls = {};
  }
}

// =======================
// Save polls safely
// =======================
function savePolls() {
  try {
    fs.writeFileSync(POLL_FILE, JSON.stringify(polls, null, 2));
  } catch (err) {
    console.error("❌ Failed to save polls.json:", err.message);
  }
}

// Initialize polls on startup
loadPolls();

// =======================
// Poll operations
// =======================
function getPoll(messageId) {
  return polls[messageId] || null;
}

function addPoll(messageId, pollData) {
  polls[messageId] = pollData;
  savePolls();
}

function updatePoll(messageId, pollData) {
  if (!polls[messageId]) return false;
  polls[messageId] = pollData;
  savePolls();
  return true;
}

function removePoll(messageId) {
  if (!polls[messageId]) return false;
  delete polls[messageId];
  savePolls();
  return true;
}

function getAllPolls() {
  return Object.entries(polls).map(([id, data]) => ({ id, ...data }));
}

// =======================
// Export
// =======================
module.exports = { getPoll, addPoll, updatePoll, removePoll, getAllPolls };
