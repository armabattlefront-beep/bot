const fs = require("fs");
const path = require("path");

// File path for persistent streamer storage
const STREAMER_FILE = path.join(__dirname, "streamers.json");

let streamers = {};

// Load streamers from file at startup
if (fs.existsSync(STREAMER_FILE)) {
  try {
    const data = fs.readFileSync(STREAMER_FILE, "utf-8");
    streamers = JSON.parse(data);
  } catch (err) {
    console.warn("⚠️ Failed to load streamers.json, starting with empty list.", err.message);
    streamers = {};
  }
}

// Save streamers to file safely
function saveStreamers() {
  try {
    fs.writeFileSync(STREAMER_FILE, JSON.stringify(streamers, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Failed to save streamers.json:", err.message);
  }
}

// =======================
// EXPORT FUNCTIONS
// =======================

/**
 * Get all streamers as an array
 */
function getAllStreamers() {
  return Object.values(streamers);
}

/**
 * Add a streamer to the list
 * @param {{id: string, name: string, platform: string}} streamerData
 */
function addStreamer(streamerData) {
  if (!streamerData.id || !streamerData.name || !streamerData.platform) {
    throw new Error("Streamer must have id, name, and platform");
  }
  streamers[streamerData.id] = streamerData;
  saveStreamers();
}

/**
 * Remove a streamer from the list by ID
 * @param {string} id
 */
function removeStreamer(id) {
  if (!streamers[id]) return;
  delete streamers[id];
  saveStreamers();
}

/**
 * Get a streamer by ID
 * @param {string} id
 */
function getStreamer(id) {
  return streamers[id] || null;
}

module.exports = { getAllStreamers, addStreamer, removeStreamer, getStreamer };
