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

// Save all events
function saveAll() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(events, null, 2));
}

// Get single event by ID
function getEvent(eventId) {
  return events[eventId] || null;
}

// Get all events
function getAllEvents() {
  return events;
}

// Save/update a single event
function saveEvent(eventId, eventData) {
  events[eventId] = eventData;
  saveAll();
}

// Add a signup
function addEventSignup(eventId, userId) {
  const event = getEvent(eventId);
  if (!event) return false;

  // Ensure signups array exists
  if (!Array.isArray(event.signups)) event.signups = [];

  // Check if already signed up
  if (event.signups.includes(userId)) return false;

  // Add user
  event.signups.push(userId);
  saveEvent(eventId, event);
  return true;
}

// Optionally remove a signup
function removeEventSignup(eventId, userId) {
  const event = getEvent(eventId);
  if (!event || !Array.isArray(event.signups)) return false;

  const index = event.signups.indexOf(userId);
  if (index === -1) return false;

  event.signups.splice(index, 1);
  saveEvent(eventId, event);
  return true;
}

module.exports = {
  getEvent,
  getAllEvents,
  saveEvent,
  addEventSignup,
  removeEventSignup
};
