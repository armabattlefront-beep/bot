// dashboard/server.js
const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const { loadLevels, getRankName, getNextLevelXP } = require("../xp");
const { STREAMERS } = require("../config");

// =======================
// EXPRESS APP SETUP
// =======================
const app = express();

// Serve static files
app.use("/public", express.static(path.join(__dirname, "public")));

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =======================
// DASHBOARD ROUTE
// =======================
app.get("/", (req, res) => {
    const levels = loadLevels();
    res.render("index", { levels, STREAMERS, getRankName, getNextLevelXP });
});

// =======================
// HTTP + SOCKET.IO
// =======================
const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: { origin: "*" } // allow cross-origin for dev/testing
});

// Log socket connections
io.on("connection", (socket) => {
    console.log("⚡ Dashboard client connected");
    socket.on("disconnect", () => console.log("⚡ Dashboard client disconnected"));
});

// =======================
// EXPORT
// =======================
// Export app and io, but do NOT call server.listen()
// The main bot index.js will attach this to its own Express server
module.exports = { app, io };
