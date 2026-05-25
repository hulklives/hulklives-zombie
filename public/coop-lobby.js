const COOP_LOBBY_MAX = 4;

let coopSocket = null;
let coopLobbyOpen = false;
let coopReady = false;
let coopRoomState = null;
let coopReconnectTimer = null;
let coopFriendsOnline = [];
let coopSentInvites = new Set();
let pendingCoopInvite = null;
let pendingCoopInviteAfterCreate = null;
let coopBackgroundConnected = false;

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

function getCoopAuthFetch() {
  if (typeof authFetch === "function") return authFetch;
  if (typeof window.authFetch === "function") return window.authFetch;
  return null;
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

function isCoopHost() {
  return !!(
    coopRoomState &&
    typeof playerName === "string" &&
    coopRoomState.hostUsername.toLowerCase() === playerName.toLowerCase() &&
    coopRoomState.status === "waiting"
  );
}

function showCoopInviteModal(invite) {
  pendingCoopInvite = invite || null;
  const modal = document.getElementById("coop-invite-modal");
  const copyEl = document.getElementById("coop-invite-copy");
  if (!modal || !copyEl) return;

  if (!invite) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    copyEl.textContent = "";
    return;
  }

  copyEl.textContent = `${invite.fromUsername} invited you to a co-op lobby (${invite.playerCount || 1}/${invite.maxPlayers || COOP_LOBBY_MAX}).`;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

async function refreshCoopInviteFriends() {
  const listEl = document.getElementById("coop-lobby-friends");
  if (!listEl) return;

  if (!isCoopHost()) {
    listEl.innerHTML = "";
    return;
  }

  const fetchAuth = getCoopAuthFetch();
  if (!fetchAuth || !getCoopAuthToken()) {
    listEl.innerHTML = '<div class="coop-friends-empty">Log in to invite friends.</div>';
    return;
  }

  try {
    const response = await fetchAuth("/api/friends");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      listEl.innerHTML = '<div class="coop-friends-empty">Could not load friends.</div>';
      return;
    }

    const friends = Array.isArray(payload.friends) ? payload.friends : [];
    coopFriendsOnline = friends.filter((friend) => friend.online);
    renderCoopInviteFriends();
  } catch (error) {
    listEl.innerHTML = '<div class="coop-friends-empty">Friends unavailable right now.</div>';
  }
}

function renderCoopInviteFriends() {
  const listEl = document.getElementById("coop-lobby-friends");
  if (!listEl) return;

  if (!isCoopHost()) {
    listEl.innerHTML = "";
    return;
  }

  const inLobby = new Set(
    (coopRoomState?.players || [])
      .filter(Boolean)
      .map((player) => player.username.toLowerCase())
  );

  const inviteable = coopFriendsOnline.filter(
    (friend) => !inLobby.has(friend.username.toLowerCase())
  );

  if (!inviteable.length) {
    listEl.innerHTML =
      '<div class="coop-friends-empty">No online friends available to invite.</div>';
    return;
  }

  listEl.innerHTML = inviteable
    .map((friend) => {
      const sent = coopSentInvites.has(friend.username.toLowerCase());
      const label = sent ? "Invited" : "Invite";
      const disabled = sent ? " disabled" : "";
      return `<div class="coop-friend-row">
  <div class="coop-friend-copy">
    <strong>${escapeCoopHtml(friend.username)}</strong>
    <span>Online</span>
  </div>
  <button type="button" class="menu-mode-btn coop-invite-btn"${disabled} onclick="inviteFriendToCoop('${escapeCoopHtml(friend.username)}')">${label}</button>
</div>`;
    })
    .join("");
}

function renderCoopLobby(state) {
  coopRoomState = state || null;
  const modal = document.getElementById("coop-lobby-modal");
  const slotsEl = document.getElementById("coop-lobby-slots");
  const readyBtn = document.getElementById("coop-lobby-ready-btn");
  const createPanel = document.getElementById("coop-lobby-create-panel");
  const roomPanel = document.getElementById("coop-lobby-room-panel");
  const countdownEl = document.getElementById("coop-lobby-countdown");
  const inviteSection = document.getElementById("coop-lobby-invite-section");

  if (!modal || !slotsEl) return;

  if (!state) {
    if (createPanel) createPanel.hidden = false;
    if (roomPanel) roomPanel.hidden = true;
    if (inviteSection) inviteSection.hidden = true;
    if (countdownEl) countdownEl.hidden = true;
    slotsEl.innerHTML = "";
    coopSentInvites.clear();
    if (readyBtn) {
      readyBtn.disabled = true;
      readyBtn.textContent = "Ready";
    }
    coopReady = false;
    return;
  }

  if (createPanel) createPanel.hidden = true;
  if (roomPanel) roomPanel.hidden = false;

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

  if (inviteSection) {
    inviteSection.hidden = !isCoopHost();
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
    if (state.allReady) {
      setCoopLobbyStatus("All players ready.");
    } else if (isCoopHost()) {
      setCoopLobbyStatus("Invite online friends, then wait for everyone to press Ready.");
    } else {
      setCoopLobbyStatus("Waiting for all players to press Ready.");
    }
  }

  if (isCoopHost()) {
    refreshCoopInviteFriends();
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
    disconnectCoopLobbySocket();
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
    coopBackgroundConnected = true;
    if (coopLobbyOpen) setCoopLobbyStatus("");
  });

  coopSocket.addEventListener("message", (event) => {
    let payload;
    try {
      payload = JSON.parse(String(event.data || "{}"));
    } catch (error) {
      return;
    }

    if (payload.type === "lobby_error") {
      if (coopLobbyOpen) setCoopLobbyStatus(payload.error || "Lobby error.", true);
      return;
    }

    if (payload.type === "coop_invite_received") {
      showCoopInviteModal({
        fromUsername: payload.fromUsername,
        playerCount: payload.playerCount,
        maxPlayers: payload.maxPlayers
      });
      return;
    }

    if (payload.type === "coop_invite_sent") {
      if (payload.username) coopSentInvites.add(String(payload.username).toLowerCase());
      renderCoopInviteFriends();
      if (coopLobbyOpen) {
        setCoopLobbyStatus(`Invite sent to ${payload.username}.`);
      }
      return;
    }

    if (payload.type === "coop_invite_accepted") {
      if (coopLobbyOpen) {
        setCoopLobbyStatus(`${payload.username} joined the lobby.`);
      }
      return;
    }

    if (payload.type === "coop_invite_declined") {
      if (payload.username) coopSentInvites.delete(String(payload.username).toLowerCase());
      renderCoopInviteFriends();
      if (coopLobbyOpen) {
        setCoopLobbyStatus(`${payload.username} declined the invite.`);
      }
      return;
    }

    if (payload.type === "lobby_left") {
      coopReady = false;
      coopSentInvites.clear();
      renderCoopLobby(null);
      if (coopLobbyOpen) setCoopLobbyStatus("");
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

      if (
        pendingCoopInviteAfterCreate &&
        payload.type === "lobby_joined" &&
        payload.room?.hostUsername &&
        typeof playerName === "string" &&
        payload.room.hostUsername.toLowerCase() === playerName.toLowerCase()
      ) {
        const target = pendingCoopInviteAfterCreate;
        pendingCoopInviteAfterCreate = null;
        inviteFriendToCoop(target);
      }
      return;
    }

    if (payload.type === "coop_match_start") {
      renderCoopLobby(payload.room);
      showCoopInviteModal(null);
      if (typeof window.onCoopMatchStart === "function") {
        window.onCoopMatchStart(payload.room);
      } else if (typeof showMilestone === "function") {
        showMilestone("Co-op lobby connected — shared waves launch in the next update.");
      }
    }
  });

  coopSocket.addEventListener("close", () => {
    coopBackgroundConnected = false;
    if (!getCoopAuthToken()) return;
    clearTimeout(coopReconnectTimer);
    coopReconnectTimer = setTimeout(() => connectCoopLobbySocket(true), 1500);
  });
}

function initCoopLobbyConnection() {
  if (!getCoopAuthToken()) {
    disconnectCoopLobbySocket();
    return;
  }
  connectCoopLobbySocket(false);
}

function disconnectCoopLobbySocket() {
  coopLobbyOpen = false;
  coopReady = false;
  coopRoomState = null;
  coopSentInvites.clear();
  pendingCoopInvite = null;
  pendingCoopInviteAfterCreate = null;
  showCoopInviteModal(null);
  clearTimeout(coopReconnectTimer);

  if (coopSocket) {
    coopSocket.onclose = null;
    if (coopSocket.readyState === WebSocket.OPEN) {
      try {
        coopSocket.send(JSON.stringify({ type: "lobby_leave" }));
      } catch (error) {
        // ignore
      }
    }
    coopSocket.close();
    coopSocket = null;
  }

  coopBackgroundConnected = false;
  renderCoopLobby(null);
  setCoopLobbyStatus("");
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
  if (!coopRoomState) coopReady = false;
  if (!coopRoomState) renderCoopLobby(null);
  else renderCoopLobby(coopRoomState);
  if (!coopRoomState) {
    setCoopLobbyStatus("Create a lobby and invite online friends.");
  }

  if (typeof hideStartMenu === "function") hideStartMenu();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  initCoopLobbyConnection();
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
  coopSentInvites.clear();
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
  setCoopLobbyStatus("Creating lobby…");
}

function inviteFriendToCoop(username) {
  const target = String(username || "").trim();
  if (!target) return;

  if (!getCoopAuthToken()) {
    if (typeof showMilestone === "function") showMilestone("Log in to invite friends.");
    return;
  }

  initCoopLobbyConnection();

  if (
    coopRoomState &&
    typeof playerName === "string" &&
    coopRoomState.hostUsername.toLowerCase() === playerName.toLowerCase() &&
    coopRoomState.status === "waiting"
  ) {
    if (!sendCoopMessage({ type: "lobby_invite", username: target })) return;
    if (coopLobbyOpen) setCoopLobbyStatus(`Inviting ${target}…`);
    return;
  }

  pendingCoopInviteAfterCreate = target;
  if (!isCoopLobbyVisible()) openCoopLobbyMenu();
  if (!coopRoomState) createCoopLobbyRoom();
}

function acceptCoopInvite() {
  if (!pendingCoopInvite) return;
  const fromUsername = pendingCoopInvite.fromUsername;
  showCoopInviteModal(null);
  initCoopLobbyConnection();
  if (!sendCoopMessage({ type: "coop_invite_accept", fromUsername })) return;
  openCoopLobbyMenu();
  setCoopLobbyStatus(`Joining ${fromUsername}'s lobby…`);
}

function declineCoopInvite() {
  if (!pendingCoopInvite) {
    showCoopInviteModal(null);
    return;
  }
  const fromUsername = pendingCoopInvite.fromUsername;
  showCoopInviteModal(null);
  sendCoopMessage({ type: "coop_invite_decline", fromUsername });
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
window.inviteFriendToCoop = inviteFriendToCoop;
window.acceptCoopInvite = acceptCoopInvite;
window.declineCoopInvite = declineCoopInvite;
window.toggleCoopLobbyReady = toggleCoopLobbyReady;
window.isCoopLobbyVisible = isCoopLobbyVisible;
window.initCoopLobbyConnection = initCoopLobbyConnection;
window.disconnectCoopLobbySocket = disconnectCoopLobbySocket;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCoopLobbyConnection);
} else if (getCoopAuthToken()) {
  initCoopLobbyConnection();
}
