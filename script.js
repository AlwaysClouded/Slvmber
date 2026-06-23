const API_URL = "https://jester-presence-api.onrender.com/api/presence";

async function fetchPresence() {
  try {
    const res = await fetch(API_URL + "?t=" + Date.now(), { cache: "no-store" });
    const json = await res.json();

    if (!json.success || !json.presence) return;

    const p = json.presence;

    updateDiscord(p);
    updateSpotify(p.spotify);

  } catch (err) {
    console.log("Presence fetch failed");
  }
}

setInterval(fetchPresence, 5000);
fetchPresence();

// ===============================
// DISCORD PANEL
// ===============================
function updateDiscord(p) {
  const statusColors = {
    online: "#A8C3A0",
    idle: "#E7A7B7",
    dnd: "#E7A7B7",
    offline: "#777"
  };

  document.getElementById("dp-status-dot").style.background = statusColors[p.status] || "#777";
  document.getElementById("dp-username").textContent = p.username || "Unknown";
  document.getElementById("dp-custom-status").textContent = p.customStatus || "";
  document.getElementById("dp-avatar").src = p.avatar;
}

// ===============================
// SPOTIFY PANEL
// ===============================
function updateSpotify(spotify) {
  const cover = document.getElementById("spotify-cover");
  const title = document.getElementById("spotify-title");
  const artist = document.getElementById("spotify-artist");

  if (!spotify) {
    cover.src = "https://i.imgur.com/8QfQFfC.png";
    title.textContent = "Not playing anything";
    artist.textContent = "";
    return;
  }

  title.textContent = spotify.details;
  artist.textContent = spotify.state;

  if (spotify.assets?.largeImage?.startsWith("spotify:")) {
    const id = spotify.assets.largeImage.replace("spotify:", "");
    cover.src = `https://i.scdn.co/image/${id}`;
  }
}
