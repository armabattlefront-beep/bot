const fs = require("fs");
const path = require("path");

// =======================
// FILE PATH
// =======================
const STREAMER_FILE = path.join(__dirname, "streamers.json");

let streamers = {};

// =======================
// LOAD AT STARTUP
// =======================
if (fs.existsSync(STREAMER_FILE)) {
  try {
    const data = fs.readFileSync(STREAMER_FILE, "utf-8");
    streamers = JSON.parse(data) || {};
  } catch (err) {
    console.warn("⚠️ Failed to load streamers.json, starting empty:", err.message);
    streamers = {};
  }
}

// =======================
// SAVE SAFELY
// =======================
function saveStreamers() {
  try {
    fs.writeFileSync(STREAMER_FILE, JSON.stringify(streamers, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Failed to save streamers.json:", err.message);
  }
}

// =======================
// PUBLIC API
// =======================

function getAllStreamers() {
  return Object.values(streamers);
}

function getStreamer(id) {
  return streamers[id] || null;
}

/**
 * Add a streamer
 * @returns {boolean} true if added, false if already exists
 */
function addStreamer({ id, name, platform }) {
  if (!id || !name || !platform) {
    throw new Error("Streamer must have id, name, and platform");
  }

  if (streamers[id]) {
    return false; // already exists
  }

  streamers[id] = {
    id,
    name,
    platform,
    addedAt: Date.now()
  };

  saveStreamers();
  return true;
}

/**
 * Remove a streamer
 * @returns {boolean} true if removed, false if not found
 */
function removeStreamer(id) {
  if (!streamers[id]) return false;

  delete streamers[id];
  saveStreamers();
  return true;
}

module.exports = {
  getAllStreamers,
  getStreamer,
  addStreamer,
  removeStreamer
};
