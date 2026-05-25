const COOP_LOBBY_MAX = 4;

let coopSocket = null;
let coopLobbyOpen = false;
let coopReady = false;
let coopRoomState = null;
let coopReconnectTimer = null;

function escapeCoopHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCoopAuthToken() {
  if (typeof getGameAuthToken === "function" && getGameAuthToken()) {
    return getGameAuthToken();
  }
  return localStorage.getItem("hulkLivesAuthToken") || "";
}

function getCoopWsUrl(token) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/coop?token=${encodeURIComponent(token)}`;
}

function setCoopLobbyStatus(message, isError = false) {
  const el = document.getElementById("coop-lobby-status");
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
}

function isCoopLobbyVisible() {
  const modal = document.getElementById("coop-lobby-modal");
  return !!(modal && modal.classList.contains("open"));
}

function renderCoopLobby(state) {
  coopRoomState = state || null;
  const modal = document.getElementById("coop-lobby-modal");
  const slotsEl = document.getElementById("coop-lobby-slots");
  const codeEl = document.getElementById("coop-lobby-code");
  const readyBtn = document.getElementById("coop-lobby-ready-btn");
  const createPanel = document.getElementById("coop-lobby-create-panel");
  const roomPanel = document.getElementById("coop-lobby-room-panel");
  const countdownEl = document.getElementById("coop-lobby-countdown");

  if (!modal || !slotsEl) return;

  if (!state) {
    if (createPanel) createPanel.hidden = false;
    if (roomPanel) roomPanel.hidden = true;
    if (codeEl) codeEl.textContent = "------";
    if (countdownEl) countdownEl.hidden = true;
    slotsEl.innerHTML = "";
    if (readyBtn) {
      readyBtn.disabled = true;
      readyBtn.textContent = "Ready";
    }
    coopReady = false;
    return;
  }

  if (createPanel) createPanel.hidden = true;
  if (roomPanel) roomPanel.hidden = false;
  if (codeEl) codeEl.textContent = state.code || "------";

  const players = Array.isArray(state.players) ? state.players : [];
  slotsEl.innerHTML = new Array(COOP_LOBBY_MAX)
    .fill(null)
    .map((_, index) => {
      const player = players[index];
      if (!player) {
        return `<div class="coop-slot empty"><span class="coop-slot-label">Slot ${index + 1}</span><span class="coop-slot-copy">Empty</span></div>`;
      }

      const readyClass = player.ready ? " ready" : "";
      const hostBadge = player.isHost ? '<span class="coop-host-badge">Host</span>' : "";
      const readyText = player.ready ? "Ready" : "Not ready";

      return `<div class="coop-slot occupied${readyClass}">
  <span class="coop-slot-label">${hostBadge}${escapeCoopHtml(player.username)}</span>
  <span class="coop-slot-copy">Lv ${escapeCoopHtml(player.level || 1)} · ${readyText}</span>
</div>`;
    })
    .join("");

  const me = players.find(
    (player) =>
      player &&
      typeof playerName === "string" &&
      player.username.toLowerCase() === playerName.toLowerCase()
  );

  if (readyBtn) {
    const locked = state.status === "countdown" || state.status === "starting";
    readyBtn.disabled = locked || !me;
    readyBtn.textContent = coopReady ? "Unready" : "Ready";
    readyBtn.classList.toggle("active", coopReady);
  }

  if (countdownEl) {
    if (state.status === "countdown" && state.countdown > 0) {
      countdownEl.hidden = false;
      countdownEl.textContent = `All ready — starting in ${state.countdown}…`;
    } else if (state.status === "starting") {
      countdownEl.hidden = false;
      countdownEl.textContent = "Launching co-op run…";
    } else if (state.allReady) {
      countdownEl.hidden = false;
      countdownEl.textContent = "Everyone is ready.";
    } else {
      countdownEl.hidden = true;
      countdownEl.textContent = "";
    }
  }

  if (state.status === "waiting") {
    const waitingCount = Math.max(0, (state.playerCount || 0) - Number(state.allReady ? state.playerCount : 0));
    if (state.allReady) {
      setCoopLobbyStatus("All players ready.");
    } else {
      setCoopLobbyStatus("Waiting for all players to press Ready.");
    }
  }
}

function sendCoopMessage(payload) {
  if (!coopSocket || coopSocket.readyState !== WebSocket.OPEN) {
    setCoopLobbyStatus("Lobby connection lost. Reconnecting…", true);
    connectCoopLobbySocket(true);
    return false;
  }
  coopSocket.send(JSON.stringify(payload));
  return true;
}

function connectCoopLobbySocket(force = false) {
  const token = getCoopAuthToken();
  if (!token) {
    setCoopLobbyStatus("Log in to use co-op lobby.", true);
    return;
  }

  if (
    !force &&
    coopSocket &&
    (coopSocket.readyState === WebSocket.OPEN || coopSocket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  if (coopSocket) {
    coopSocket.onclose = null;
    coopSocket.close();
  }

  coopSocket = new WebSocket(getCoopWsUrl(token));

  coopSocket.addEventListener("open", () => {
    setCoopLobbyStatus("");
  });

  coopSocket.addEventListener("message", (event) => {
    let payload;
    try {
      payload = JSON.parse(String(event.data || "{}"));
    } catch (error) {
      return;
    }

    if (payload.type === "lobby_error") {
      setCoopLobbyStatus(payload.error || "Lobby error.", true);
      return;
    }

    if (payload.type === "lobby_left") {
      coopReady = false;
      renderCoopLobby(null);
      setCoopLobbyStatus("");
      return;
    }

    if (payload.type === "lobby_joined" || payload.type === "lobby_state") {
      const me = (payload.room?.players || []).find(
        (player) =>
          player &&
          typeof playerName === "string" &&
          player.username.toLowerCase() === playerName.toLowerCase()
      );
      if (me) coopReady = !!me.ready;
      renderCoopLobby(payload.room);
      return;
    }

    if (payload.type === "coop_match_start") {
      renderCoopLobby(payload.room);
      if (typeof window.onCoopMatchStart === "function") {
        window.onCoopMatchStart(payload.room);
      } else if (typeof showMilestone === "function") {
        showMilestone("Co-op lobby connected — shared waves launch in the next update.");
      }
    }
  });

  coopSocket.addEventListener("close", () => {
    if (!coopLobbyOpen) return;
    clearTimeout(coopReconnectTimer);
    coopReconnectTimer = setTimeout(() => connectCoopLobbySocket(true), 1500);
  });
}

function openCoopLobbyMenu() {
  if (!getCoopAuthToken()) {
    if (typeof showMilestone === "function") {
      showMilestone("Log in to play co-op.");
    }
    return;
  }

  const modal = document.getElementById("coop-lobby-modal");
  if (!modal) return;

  coopLobbyOpen = true;
  coopReady = false;
  renderCoopLobby(null);
  setCoopLobbyStatus("Create a room or join with a code.");

  if (typeof hideStartMenu === "function") hideStartMenu();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  connectCoopLobbySocket(true);
}

function closeCoopLobbyMenu() {
  const modal = document.getElementById("coop-lobby-modal");
  if (!modal) return;

  if (coopSocket && coopSocket.readyState === WebSocket.OPEN) {
    sendCoopMessage({ type: "lobby_leave" });
  }

  coopLobbyOpen = false;
  coopReady = false;
  coopRoomState = null;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  renderCoopLobby(null);
  setCoopLobbyStatus("");

  if (typeof restoreStartMenuAfterModal === "function") {
    restoreStartMenuAfterModal();
  } else if (typeof showStartMenu === "function") {
    showStartMenu();
  }
}

function createCoopLobbyRoom() {
  if (!sendCoopMessage({ type: "lobby_create" })) return;
  setCoopLobbyStatus("Creating room…");
}

function joinCoopLobbyRoom() {
  const input = document.getElementById("coop-lobby-join-code");
  const code = String(input?.value || "")
    .trim()
    .toUpperCase();
  if (code.length !== 6) {
    setCoopLobbyStatus("Enter the 6-character room code.", true);
    return;
  }
  if (!sendCoopMessage({ type: "lobby_join", code })) return;
  setCoopLobbyStatus(`Joining ${code}…`);
}

function toggleCoopLobbyReady() {
  coopReady = !coopReady;
  if (!sendCoopMessage({ type: "lobby_ready", ready: coopReady })) {
    coopReady = !coopReady;
  }
}

window.openCoopLobbyMenu = openCoopLobbyMenu;
window.closeCoopLobbyMenu = closeCoopLobbyMenu;
window.createCoopLobbyRoom = createCoopLobbyRoom;
window.joinCoopLobbyRoom = joinCoopLobbyRoom;
window.toggleCoopLobbyReady = toggleCoopLobbyReady;
window.isCoopLobbyVisible = isCoopLobbyVisible;
