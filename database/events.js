const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../data/events.json");
let events = {};

// =========================
// Load events at startup
// =========================
if (fs.existsSync(FILE_PATH)) {
  try {
    events = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
  } catch (e) {
    console.warn("⚠️ Failed to load events.json, starting with empty events.");
    events = {};
  }
}

// =========================
// Save events to file
// =========================
function save() {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(events, null, 2));
  } catch (err) {
    console.error("❌ Failed to save events.json:", err.message);
  }
}

// =========================
// Create a new event
// =========================
function createEvent(name, maxPlayers, modChannel = null) {
  const id = name.toLowerCase().replace(/\s+/g, "_");
  if (events[id]) return false;

  events[id] = {
    id,
    name,
    maxPlayers,
    participants: [],
    modChannel
  };

  save();
  return id;
}

// =========================
// Delete an event
// =========================
function deleteEvent(id) {
  if (!events[id]) return false;
  delete events[id];
  save();
  return true;
}

// =========================
// Get all events
// =========================
function getAllEvents() {
  return Object.values(events);
}

// =========================
// Get a single event by ID
// =========================
function getEvent(id) {
  return events[id] || null;
}

// =========================
// Sign up a user for an event
// =========================
function signupEvent(eventId, userId) {
  const ev = events[eventId];
  if (!ev) return false;

  if (ev.participants.find(p => p.id === userId)) return false;
  if (ev.participants.length >= ev.maxPlayers) return false;

  ev.participants.push({ id: userId, status: "pending", group: null });
  save();
  return true;
}

// =========================
// Assign status to a participant
// =========================
function assignStatus(eventId, userId, status) {
  const ev = events[eventId];
  if (!ev) return false;

  const participant = ev.participants.find(p => p.id === userId);
  if (!participant) return false;

  participant.status = status; // e.g., "firstTeam" or "substitute"
  save();
  return true;
}

// =========================
// Assign groups of 6 participants
// =========================
function assignGroups(eventId) {
  const ev = events[eventId];
  if (!ev) return false;

  // Shuffle participants randomly
  const shuffled = [...ev.participants].sort(() => Math.random() - 0.5);

  // Assign group numbers (1–6 per group)
  for (let i = 0; i < shuffled.length; i++) {
    shuffled[i].group = Math.floor(i / 6) + 1;
  }

  ev.participants = shuffled;
  save();
  return true;
}

// =========================
// Exports
// =========================
module.exports = {
  createEvent,
  deleteEvent,
  getAllEvents,
  getEvent,
  signupEvent,
  assignStatus,
  assignGroups
};
