const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const FILE_PATH = path.join(DATA_DIR, "events.json");
const BACKUP_DIR = path.join(DATA_DIR, "event_backups");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Internal state (never expose directly)
let events = Object.create(null);

// =======================
// SAFE LOAD (NON-DESTRUCTIVE)
// =======================
if (fs.existsSync(FILE_PATH)) {
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object") {
      events = parsed;
    }
  } catch (err) {
    console.warn("⚠️ Failed to load events.json — keeping in-memory data");
    events = Object.create(null);
  }
}

// =======================
// SANITISER (LEGACY SAFE)
// =======================
function sanitizeEvent(event) {
  return {
    id: String(event.id),
    name: String(event.name),
    description: String(event.description),
    maxPlayers: Number(event.maxPlayers),
    groupSize:
      event.groupSize === null || event.groupSize === undefined
        ? null
        : Number(event.groupSize),
    date: String(event.date),
    time: String(event.time),
    timestamp: Number(event.timestamp),
    signups: Array.isArray(event.signups)
      ? event.signups.map(s =>
          typeof s === "string"
            ? { id: String(s), isStaff: false }
            : { id: String(s.id), isStaff: Boolean(s.isStaff) }
        )
      : []
  };
}

// =======================
// BACKUP HANDLER
// =======================
function createBackup() {
  if (!fs.existsSync(FILE_PATH)) return;

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUP_DIR, `events-${stamp}.json`);

  try {
    fs.copyFileSync(FILE_PATH, backupPath);
  } catch (err) {
    console.warn("⚠️ Failed to create event backup:", err.message);
  }
}

// =======================
// SAVE ALL (WITH BACKUP)
// =======================
function saveAll() {
  createBackup();

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

  event.signups = event.signups.map(s =>
    typeof s === "string"
      ? { id: String(s), isStaff: false }
      : { id: String(s.id), isStaff: Boolean(s.isStaff) }
  );

  if (event.signups.some(s => s.id === String(userId))) return false;

  event.signups.push({
    id: String(userId),
    isStaff: Boolean(isStaff)
  });

  saveAll();
  return true;
}

function removeEventSignup(eventId, userId) {
  const event = events[eventId];
  if (!event || !Array.isArray(event.signups)) return false;

  event.signups = event.signups.filter(s => s.id !== String(userId));
  saveAll();
  return true;
}

// =======================
// EXPORTS
// =======================
module.exports = {
  getEvent,
  getAllEvents,
  saveEvent,
  addEventSignup,
  removeEventSignup
};
