const socket = io();

// XP updates
socket.on("xpUpdate", data => {
    const { userId, level, xp } = data;
    const row = document.getElementById(`user-${userId}`);
    if (row) {
        row.children[1].textContent = level;
        row.children[2].textContent = `${xp} / ${xp + 100}`; // Approximate next level XP
        row.children[3].textContent = "Rank"; // Optional: fetch rank dynamically
        const progress = Math.min(xp / (xp + 100), 1) * 100;
        row.querySelector(".progress").style.width = progress + "%";
    } else {
        // Add new row if user not in table yet
        const tbody = document.getElementById("xp-table-body");
        const tr = document.createElement("tr");
        tr.id = `user-${userId}`;
        tr.innerHTML = `
            <td>${userId}</td>
            <td>${level}</td>
            <td>${xp} / ${xp + 100}</td>
            <td>Rank</td>
            <td>
                <div class="progress-bar">
                    <div class="progress" style="width:${Math.min(xp / (xp + 100), 1) * 100}%"></div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    }
});

// Live streamer updates
socket.on("liveUpdate", data => {
    const { streamer, isLive, url } = data;
    const el = document.getElementById(`streamer-${streamer}`);
    if (el) {
        el.querySelector(".status").textContent = isLive ? "LIVE 🔴" : "Offline";
        if (isLive) el.querySelector(".streamer-name").innerHTML = `<a href="${url}" target="_blank">${streamer}</a>`;
    }
});
