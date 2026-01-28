const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../data/events.json");

// Internal state (never expose directly)
let events = Object.create(null);

// =======================
// SAFE LOAD
// =======================
if (fs.existsSync(FILE_PATH)) {
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    if (typeof parsed === "object" && parsed !== null) {
      events = parsed;
    }
  } catch (err) {
    console.warn("⚠️ Failed to load events.json, starting fresh");
    events = Object.create(null);
  }
}

// =======================
// SANITISER
// =======================
function sanitizeEvent(event) {
  return {
    id: String(event.id),
    name: String(event.name),
    description: String(event.description),
    maxPlayers: Number(event.maxPlayers),
    groupSize: event.groupSize !== null ? Number(event.groupSize) : null,
    date: String(event.date),
    time: String(event.time),
    timestamp: Number(event.timestamp),
    signups: Array.isArray(event.signups)
      ? event.signups.map(s => ({
          id: String(s.id),
          isStaff: Boolean(s.isStaff)
        }))
      : []
  };
}

// =======================
// SAVE ALL (CIRCULAR SAFE)
// =======================
function saveAll() {
  const safe = Object.create(null);

  for (const [id, event] of Object.entries(events)) {
    safe[id] = sanitizeEvent(event);
  }

  fs.writeFileSync(FILE_PATH, JSON.stringify(safe, null, 2));
  events = safe;
}

// =======================
// READ OPERATIONS (CLONED)
// =======================
function getEvent(eventId) {
  const event = events[eventId];
  return event ? structuredClone(event) : null;
}

function getAllEvents() {
  return structuredClone(events);
}

// =======================
// WRITE OPERATIONS
// =======================
function saveEvent(eventId, eventData) {
  events[eventId] = sanitizeEvent(eventData);
  saveAll();
}

// =======================
// SIGNUPS
// =======================
function addEventSignup(eventId, userId, isStaff = false) {
  const event = events[eventId];
  if (!event) return false;

  if (!Array.isArray(event.signups)) event.signups = [];

  // Normalize legacy formats
  event.signups = event.signups.map(s =>
    typeof s === "string"
      ? { id: s, isStaff: false }
      : { id: String(s.id), isStaff: Boolean(s.isStaff) }
  );

  if (event.signups.some(s => s.id === userId)) return false;

  event.signups.push({ id: String(userId), isStaff: Boolean(isStaff) });
  saveAll();
  return true;
}

function removeEventSignup(eventId, userId) {
  const event = events[eventId];
  if (!event || !Array.isArray(event.signups)) return false;

  event.signups = event.signups.filter(s => s.id !== userId);
  saveAll();
  return true;
}

module.exports = {
  getEvent,
  getAllEvents,
  saveEvent,
  addEventSignup,
  removeEventSignup
};
