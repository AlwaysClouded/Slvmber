// ===============================
// CONFIG
// ===============================
const USER_ID = "1372307214643101701";
const API_URL = `https://jester-presence-api.onrender.com/api/presence?user=${USER_ID}&nocache=`;

// Track last states
let lastTrackId = null;
let spotifyInterval = null;

// ===============================
// LOGGING
// ===============================
function logLine(text) {
  const log = document.getElementById("log-output");
  if (!log) return;

  const span = document.createElement("span");
  span.className = "log-line";
  span.textContent = text;

  log.appendChild(span);
  while (log.children.length > 6) log.removeChild(log.firstChild);
}

// ===============================
// FETCH PRESENCE
// ===============================
async function fetchPresenceLazy() {
  let res = await fetch(API_URL + Date.now(), { cache: "no-store" });
  let json = await res.json();

  if (!json.presence) {
    logLine("[API] Waiting for worker...");
    await new Promise(r => setTimeout(r, 1200));

    res = await fetch(API_URL + Date.now(), { cache: "no-store" });
    json = await res.json();
  }

  return json.presence || null;
}

async function fetchPresence() {
  try {
    const p = await fetchPresenceLazy();

    if (!p) {
      logLine("[API] No presence data");
      return;
    }

    updatePresence(p);
    updateSpotify(p.spotify);

    logLine("[API] Presence updated");
  } catch (err) {
    logLine("[API] Fetch error");
  }
}

setInterval(fetchPresence, 5000);
fetchPresence();

// ===============================
// PRESENCE PANEL
// ===============================
function updatePresence(p) {
  const statusMap = {
    online: { color: "#a8bfa1", text: "Online" },
    idle: { color: "#e7a8b8", text: "Idle" },
    dnd: { color: "#f04747", text: "Do Not Disturb" },
    offline: { color: "#747f8d", text: "Offline" }
  };

  const s = statusMap[p.status] || statusMap.offline;

  const dot = document.getElementById("dp-status-dot");
  const text = document.getElementById("dp-status-text");
  const custom = document.getElementById("dp-custom-status");
  const avatar = document.getElementById("dp-avatar");
  const username = document.getElementById("dp-username");
  const handle = document.getElementById("hero-handle");

  if (dot) {
    dot.style.background = s.color;
    dot.style.boxShadow = `0 0 8px ${s.color}`;
  }

  if (text) text.textContent = s.text;
  if (custom) custom.textContent = p.customStatus || "No custom status";

  if (avatar && p.avatar) avatar.src = p.avatar;
  if (username && p.username) username.textContent = p.username;
  if (handle && p.username) handle.textContent = `@${p.username}`;
}

// ===============================
// SPOTIFY PANEL
// ===============================
function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function truncate(text, max = 32) {
  return text && text.length > max ? text.slice(0, max) + "…" : text || "";
}

function updateSpotify(spotify) {
  const cover = document.getElementById("spotify-cover");
  const title = document.getElementById("spotify-title");
  const artist = document.getElementById("spotify-artist");
  const panel = document.querySelector(".card-spotify");

  const elapsedEl = document.getElementById("spotify-elapsed");
  const durationEl = document.getElementById("spotify-duration");
  const barFill = document.getElementById("spotify-bar-fill");
  const progressWrap = document.querySelector(".spotify-progress");

  if (!cover || !title || !artist || !panel || !elapsedEl || !durationEl || !barFill || !progressWrap) return;

  if (!spotify) {
    panel.classList.remove("active");
    if (spotifyInterval) clearInterval(spotifyInterval);

    cover.src = "https://i.imgur.com/8QfQFfC.png";
    title.textContent = "Not playing anything";
    artist.textContent = "";

    progressWrap.style.display = "none";
    lastTrackId = null;
    logLine("[Spotify] Idle");
    return;
  }

  const song = spotify.details || "";
  const artistName = spotify.state || "";
  const albumArt = spotify.assets?.largeImage
    ? `https://i.scdn.co/image/${spotify.assets.largeImage.replace("spotify:", "")}`
    : "https://i.imgur.com/8QfQFfC.png";

  const trackId = song + artistName;

  if (trackId !== lastTrackId) {
    cover.src = albumArt;
    title.textContent = truncate(song, 32);
    artist.textContent = truncate(artistName, 32);
    panel.classList.add("active");
    lastTrackId = trackId;
    logLine(`[Spotify] ${song} — ${artistName}`);
  }

  if (spotifyInterval) clearInterval(spotifyInterval);

  const start = spotify.timestamps?.start ? Number(spotify.timestamps.start) : null;
  const end = spotify.timestamps?.end ? Number(spotify.timestamps.end) : null;

  if (!start || !end) {
    progressWrap.style.display = "none";
    return;
  }

  progressWrap.style.display = "flex";

  const duration = end - start;
  durationEl.textContent = formatTime(duration);

  spotifyInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - start;
    const clamped = Math.max(0, Math.min(duration, elapsed));

    elapsedEl.textContent = formatTime(clamped);

    const progress = Math.min(1, clamped / duration);
    barFill.style.width = `${progress * 100}%`;
  }, 1000);
}

// ===============================
// MUSIC TOGGLE + COPY LINK
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("music-unlock");
  const audio = document.getElementById("bg-audio");

  if (audio) audio.muted = true;

  if (btn && audio) {
    btn.addEventListener("click", async () => {
      try {
        if (audio.paused || audio.muted) {
          audio.muted = false;
          await audio.play();
          btn.textContent = "MUTE TRACK";
        } else {
          audio.pause();
          audio.muted = true;
          btn.textContent = "UNMUTE TRACK";
        }
      } catch (err) {
        console.error("[Audio] Play blocked:", err);
      }
    });
  }
});
