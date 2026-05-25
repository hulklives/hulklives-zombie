const ONLINE_HEARTBEAT_MS = 20000;
const ONLINE_POLL_MS = 12000;
const ONLINE_TOKEN_KEY = "hulkLivesAuthToken";

let onlineHeartbeatTimer = null;
let onlinePollTimer = null;
let onlineReporting = false;
let onlineReady = false;

function escapeOnlineHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getOnlineAuthFetch() {
  if (typeof authFetch === "function") return authFetch;
  if (typeof window.authFetch === "function") return window.authFetch;
  return null;
}

function hasOnlineAuth() {
  if (typeof refreshAuthTokenFromStorage === "function") {
    refreshAuthTokenFromStorage();
  }
  if (typeof getGameAuthToken === "function" && getGameAuthToken()) return true;
  return Boolean(localStorage.getItem(ONLINE_TOKEN_KEY));
}

function getOnlinePresencePayload() {
  if (typeof getOnlinePresenceState === "function") {
    return getOnlinePresenceState();
  }

  return {
    inGame: false,
    status: "menu",
    wave: 0
  };
}

function formatOnlineStatus(player) {
  if (!player) return "Online";
  if (player.status === "freeplay") return "Freeplay";
  if (player.inGame && player.status === "playing" && player.wave > 0) {
    return `Wave ${player.wave}`;
  }
  if (player.inGame) return "In game";
  return "In menu";
}

function setOnlinePlayersLoggedOut() {
  const panel = document.getElementById("online-players-panel");
  const list = document.getElementById("online-players-list");
  const countEl = document.getElementById("online-players-count");
  if (panel) panel.classList.add("logged-out");
  if (countEl) countEl.textContent = "0";
  if (list) {
    list.innerHTML = '<div class="online-players-empty">Log in to see who is online.</div>';
  }
}

function setOnlinePlayersLoggedIn() {
  const panel = document.getElementById("online-players-panel");
  if (panel) panel.classList.remove("logged-out");
}

function renderOnlinePlayers(players) {
  const list = document.getElementById("online-players-list");
  const countEl = document.getElementById("online-players-count");
  if (!list) return;

  const rows = Array.isArray(players) ? players : [];
  if (countEl) countEl.textContent = String(rows.length);

  if (!rows.length) {
    list.innerHTML = '<div class="online-players-empty">No one online right now.</div>';
    return;
  }

  list.innerHTML = rows
    .map((player) => {
      const role =
        player.role && player.role !== "Survivor"
          ? `<span class="online-player-role">${escapeOnlineHtml(player.role)}</span>`
          : "";
      const status = formatOnlineStatus(player);
      const activeClass = player.inGame ? " in-game" : " in-menu";
      return `<div class="online-player-row${activeClass}">
  <span class="online-player-dot" aria-hidden="true"></span>
  <div class="online-player-copy">
    <strong class="online-player-name">${escapeOnlineHtml(player.username || "Player")}</strong>
    ${role}
    <span class="online-player-status">${escapeOnlineHtml(status)}</span>
  </div>
</div>`;
    })
    .join("");
}

function showOnlinePlayersLoading() {
  const list = document.getElementById("online-players-list");
  if (!list) return;
  list.innerHTML = '<div class="online-players-empty">Loading online players...</div>';
}

async function sendOnlinePresence() {
  if (!window.gameUiReady) return null;
  const fetchAuth = getOnlineAuthFetch();
  if (!fetchAuth || !hasOnlineAuth() || onlineReporting) return null;

  onlineReporting = true;
  try {
    const response = await fetchAuth("/api/presence", {
      method: "POST",
      body: JSON.stringify(getOnlinePresencePayload())
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, status: response.status, error: payload.error || "Could not update presence." };
    }
    return { ok: true, players: payload.players || [] };
  } catch (error) {
    return { ok: false, status: 0, error: "Could not reach server." };
  } finally {
    onlineReporting = false;
  }
}

async function refreshOnlinePlayers(force = false) {
  const fetchAuth = getOnlineAuthFetch();
  if (!fetchAuth) return;

  if (!hasOnlineAuth()) {
    setOnlinePlayersLoggedOut();
    return;
  }

  setOnlinePlayersLoggedIn();
  if (force) {
    showOnlinePlayersLoading();
  }

  if (force) {
    const presenceResult = await sendOnlinePresence();
    if (presenceResult?.ok) {
      renderOnlinePlayers(presenceResult.players || []);
      return;
    }
  }

  try {
    const response = await fetchAuth("/api/presence/online");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        setOnlinePlayersLoggedOut();
        return;
      }
      const list = document.getElementById("online-players-list");
      if (list) {
        list.innerHTML = `<div class="online-players-empty">${escapeOnlineHtml(payload.error || "Online list unavailable right now.")}</div>`;
      }
      return;
    }
    renderOnlinePlayers(payload.players || []);
  } catch (error) {
    const list = document.getElementById("online-players-list");
    if (list) {
      list.innerHTML = '<div class="online-players-empty">Online list unavailable right now.</div>';
    }
  }
}

function initOnlinePlayers() {
  if (onlineReady) return;
  onlineReady = true;

  if (onlineHeartbeatTimer) clearInterval(onlineHeartbeatTimer);
  if (onlinePollTimer) clearInterval(onlinePollTimer);

  onlineHeartbeatTimer = setInterval(() => {
    sendOnlinePresence();
  }, ONLINE_HEARTBEAT_MS);

  onlinePollTimer = setInterval(() => {
    refreshOnlinePlayers(false);
  }, ONLINE_POLL_MS);

  refreshOnlinePlayers(true);
}

window.reportOnlinePresence = () => sendOnlinePresence();
window.refreshOnlinePlayers = (force = true) => refreshOnlinePlayers(force);
window.initOnlinePlayers = initOnlinePlayers;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOnlinePlayers);
} else {
  initOnlinePlayers();
}
