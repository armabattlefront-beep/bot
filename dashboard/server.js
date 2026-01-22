const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const { loadLevels, getRankName, getNextLevelXP } = require("../xp");
const { LEVEL_CHANNEL_ID } = require("../config");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.DASHBOARD_PORT || 4000;

// Serve static files
app.use("/public", express.static(path.join(__dirname, "public")));

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Homepage route
app.get("/", (req, res) => {
    const levels = loadLevels();
    res.render("index", { levels });
});

// Socket connection for real-time updates
io.on("connection", (socket) => {
    console.log("⚡ Dashboard client connected");
    socket.on("disconnect", () => {
        console.log("⚡ Dashboard client disconnected");
    });
});

// Start server
server.listen(PORT, () => console.log(`🌐 Dashboard running on port ${PORT}`));

// Export io to use in your bot
module.exports = io;
