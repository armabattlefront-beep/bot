// database/tickets.js
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "tickets.db");
const db = new Database(DB_PATH);

db.prepare(`
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    creatorId TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'open',
    threadId TEXT,
    messageId TEXT,
    channelId TEXT,
    createdAt INTEGER,
    updatedAt INTEGER,
    details TEXT,
    attachments TEXT
  )
`).run();

function generateTicketId(userId) {
  return `${Date.now()}_${userId}_${Math.floor(Math.random() * 1000)}`;
}

function addTicket(ticket) {
  const now = Date.now();

  db.prepare(`
    INSERT INTO tickets
    (id, creatorId, type, priority, status, threadId, messageId, channelId, createdAt, updatedAt, details, attachments)
    VALUES (@id,@creatorId,@type,@priority,@status,@threadId,@messageId,@channelId,@createdAt,@updatedAt,@details,@attachments)
  `).run({
    ...ticket,
    createdAt: ticket.createdAt || now,
    updatedAt: ticket.updatedAt || now
  });

  return ticket.id;
}

function updateTicket(id, updates) {
  const existing = getTicket(id);
  if (!existing) return false;

  const merged = { ...existing, ...updates, updatedAt: Date.now() };

  db.prepare(`
    UPDATE tickets SET
      type=@type,
      priority=@priority,
      status=@status,
      threadId=@threadId,
      messageId=@messageId,
      channelId=@channelId,
      details=@details,
      attachments=@attachments,
      updatedAt=@updatedAt
    WHERE id=@id
  `).run(merged);

  return true;
}

function getTicket(identifier) {
  let ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(identifier);
  if (!ticket)
    ticket = db.prepare("SELECT * FROM tickets WHERE messageId = ?").get(identifier);
  return ticket;
}

function getAllTickets() {
  return db.prepare("SELECT * FROM tickets").all();
}

function deleteTicket(id) {
  return db.prepare("DELETE FROM tickets WHERE id = ?").run(id);
}

module.exports = {
  addTicket,
  updateTicket,
  getTicket,
  getAllTickets,
  deleteTicket,
  generateTicketId
};
