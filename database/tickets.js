const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "tickets.db");
const db = new Database(DB_PATH);

// -----------------------------
// CREATE TABLE IF NOT EXISTS
// -----------------------------
db.prepare(`
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    creatorId TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'open',
    threadId TEXT,
    channelId TEXT,
    createdAt INTEGER,
    updatedAt INTEGER,
    details TEXT,
    attachments TEXT
  )
`).run();

// -----------------------------
// HELPERS
// -----------------------------
function generateTicketId(userId) {
  return `${Date.now()}_${userId}`;
}

// -----------------------------
// ADD TICKET
// -----------------------------
function addTicket(ticket) {
  if (!ticket.id) ticket.id = generateTicketId(ticket.creatorId);
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO tickets
      (id, creatorId, type, priority, status, threadId, channelId, createdAt, updatedAt, details, attachments)
    VALUES (@id,@creatorId,@type,@priority,@status,@threadId,@channelId,@createdAt,@updatedAt,@details,@attachments)
  `);

  stmt.run({
    ...ticket,
    createdAt: ticket.createdAt || now,
    updatedAt: ticket.updatedAt || now
  });

  return ticket.id;
}

// -----------------------------
// UPDATE TICKET
// -----------------------------
function updateTicket(id, updates) {
  const existing = getTicket(id);
  if (!existing) return false;

  const merged = { ...existing, ...updates, updatedAt: Date.now() };
  const stmt = db.prepare(`
    UPDATE tickets SET
      type=@type,
      priority=@priority,
      status=@status,
      threadId=@threadId,
      channelId=@channelId,
      details=@details,
      attachments=@attachments,
      updatedAt=@updatedAt
    WHERE id=@id
  `);

  stmt.run(merged);
  return true;
}

// -----------------------------
// CLOSE TICKET
// -----------------------------
function closeTicket(id) {
  return updateTicket(id, { status: "closed" });
}

// -----------------------------
// GET TICKET
// -----------------------------
function getTicket(id) {
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
}

// -----------------------------
// GET ALL TICKETS
// -----------------------------
function getAllTickets() {
  return db.prepare("SELECT * FROM tickets").all();
}

// -----------------------------
// DELETE TICKET
// -----------------------------
function deleteTicket(id) {
  return db.prepare("DELETE FROM tickets WHERE id = ?").run(id);
}

// -----------------------------
module.exports = {
  addTicket,
  updateTicket,
  closeTicket,
  getTicket,
  getAllTickets,
  deleteTicket,
  generateTicketId
};
