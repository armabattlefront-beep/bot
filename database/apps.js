const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../data/applications.json");
let applications = {}; // staff + events

if (fs.existsSync(FILE_PATH)) {
  try { applications = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8")); }
  catch (e) { applications = {}; console.warn("Failed to load applications.json"); }
}

function save() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(applications, null, 2));
}

// ========================
// STAFF APPLICATIONS
// ========================
function addStaffApplication(userId, answers) {
  if (applications[userId]?.staff) return false;
  applications[userId] = applications[userId] || {};
  applications[userId].staff = { answers, status: "pending" };
  save();
  return true;
}

function getStaffApplications() {
  return Object.values(applications).filter(a => a.staff).map(a => ({ ...a.staff, id: a.id }));
}

// ========================
// EVENT APPLICATIONS
// ========================
function createEvent(eventId, name, maxPlayers, modChannel) {
  applications[eventId] = applications[eventId] || {};
  if (applications[eventId].participants) return false; // already exists
  applications[eventId].name = name;
  applications[eventId].maxPlayers = maxPlayers;
  applications[eventId].modChannel = modChannel;
  applications[eventId].participants = [];
  applications[eventId].waitingList = [];
  save();
  return true;
}

function signupEvent(eventId, userId) {
  const ev = applications[eventId];
  if (!ev) return false;
  if (ev.participants.find(p => p.id === userId) || ev.waitingList.includes(userId)) return false;
  if (ev.participants.length >= ev.maxPlayers) return false; // full
  ev.participants.push({ id: userId, status: "pending", group: null });
  save();
  return true;
}

function addToWaitingList(eventId, userId) {
  const ev = applications[eventId];
  if (!ev) return false;
  ev.waitingList = ev.waitingList || [];
  if (ev.waitingList.includes(userId)) return false;
  ev.waitingList.push(userId);
  save();
  return true;
}

// Call this when a spot opens to promote first waiting list user
function promoteFromWaitingList(eventId) {
  const ev = applications[eventId];
  if (!ev || ev.waitingList.length === 0) return false;
  const userId = ev.waitingList.shift(); // remove first
  ev.participants.push({ id: userId, status: "pending", group: null });
  save();
  return userId; // return promoted user
}

function getEvent(eventId) {
  return applications[eventId] || null;
}

function assignStatus(eventId, userId, status) {
  const ev = applications[eventId];
  if (!ev) return false;
  const p = ev.participants.find(p => p.id === userId);
  if (!p) return false;
  p.status = status;
  save();
  return true;
}

function assignGroups(eventId) {
  const ev = applications[eventId];
  if (!ev) return false;
  const shuffled = [...ev.participants].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length; i++) {
    shuffled[i].group = Math.floor(i / 6) + 1;
  }
  ev.participants = shuffled;
  save();
  return true;
}

function getEventApplications(eventId) {
  const ev = applications[eventId];
  if (!ev) return [];
  return ev.participants;
}

module.exports = {
  addStaffApplication,
  getStaffApplications,
  createEvent,
  signupEvent,
  addToWaitingList,
  promoteFromWaitingList,
  getEvent,
  assignStatus,
  assignGroups,
  getEventApplications
};
