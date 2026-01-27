const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../data/events.json");
let events = {};

// Load at startup
if (fs.existsSync(FILE_PATH)) {
  try {
    events = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
  } catch (e) {
    events = {};
    console.warn("Failed to load events.json");
  }
}

// Save function
function save() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(events, null, 2));
}

// Create a new event
function createEvent(name, maxPlayers, groupSize = 6) {
  const id = name.toLowerCase().replace(/\s+/g, "_");
  if (events[id]) return false;
  events[id] = { name, maxPlayers, groupSize, participants: [] };
  save();
  return id;
}

// Delete event
function deleteEvent(id) {
  if (!events[id]) return false;
  delete events[id];
  save();
  return true;
}

// Get all events
function getAllEvents() {
  return Object.values(events);
}

// Get single event
function getEvent(id) {
  return events[id] || null;
}

// Sign up user
function signupEvent(eventId, userId) {
  const ev = events[eventId];
  if (!ev) return false;
  if (ev.participants.find(p => p.id === userId)) return false;
  if (ev.participants.length >= ev.maxPlayers) return false;
  ev.participants.push({ id: userId, status: "pending", group: null });
  save();
  return true;
}

// Assign user status (firstTeam/sub)
function assignStatus(eventId, userId, status) {
  const ev = events[eventId];
  if (!ev) return false;
  const p = ev.participants.find(p => p.id === userId);
  if (!p) return false;
  p.status = status;
  save();
  return true;
}

// Assign groups
function assignGroups(eventId) {
  const ev = events[eventId];
  if (!ev) return false;
  const size = ev.groupSize || 6;
  const shuffled = [...ev.participants].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length; i++) {
    shuffled[i].group = Math.floor(i / size) + 1;
  }
  ev.participants = shuffled;
  save();
  return true;
}

// Save/update a single event
function saveEvent(id, eventData) {
  events[id] = eventData;
  save();
  return true;
}

module.exports = {
  createEvent,
  deleteEvent,
  getAllEvents,
  getEvent,
  signupEvent,
  assignStatus,
  assignGroups,
  saveEvent  // <-- add this here
};
