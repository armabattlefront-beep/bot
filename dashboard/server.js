// dashboard/server.js
const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const { loadLevels, getRankName, getNextLevelXP } = require("../xp");
const { STREAMERS } = require("../config");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Use Railway port if available, fallback to 4000 locally
const PORT = process.env.DASHBOARD_PORT || process.env.PORT || 4000;

// Serve static files
app.use("/public", express.static(path.join(__dirname, "public")));

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Homepage route
app.get("/", (req, res) => {
    const levels = loadLevels(); // Load current XP / levels
    res.render("index", { levels, STREAMERS, getRankName, getNextLevelXP });
});

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("⚡ Dashboard client connected");

    // Optional: send current levels on connection
    socket.emit("initLevels", loadLevels());

    socket.on("disconnect", () => {
        console.log("⚡ Dashboard client disconnected");
    });
});

// Start server
server.listen(PORT, () => console.log(`🌐 Dashboard running on port ${PORT}`));

// Export io to use in your bot
module.exports = io;
