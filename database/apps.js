const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../data/applications.json");
let applications = {};

// Load at startup
if (fs.existsSync(FILE_PATH)) {
  try { applications = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8")); }
  catch (e) { applications = {}; console.warn("Failed to load applications.json"); }
}

// Save function
function save() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(applications, null, 2));
}

// Add a new staff application
function addApplication(userId, answers) {
  if (applications[userId]) return false;
  applications[userId] = { id: userId, answers, status: "pending" };
  save();
  return true;
}

// Update status (accept/reject)
function updateStatus(userId, status) {
  if (!applications[userId]) return false;
  applications[userId].status = status;
  save();
  return true;
}

// Get all applications
function getAllApplications() {
  return Object.values(applications);
}

// Get single application
function getApplication(userId) {
  return applications[userId] || null;
}

module.exports = {
  addApplication,
  updateStatus,
  getAllApplications,
  getApplication
};
