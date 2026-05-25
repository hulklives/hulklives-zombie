const FRIENDS_POLL_MS = 15000;

let friendsPollTimer = null;
let friendsReady = false;
let friendsBusy = false;

function escapeFriendsHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getFriendsAuthFetch() {
  if (typeof authFetch === "function") return authFetch;
  if (typeof window.authFetch === "function") return window.authFetch;
  return null;
}

function hasFriendsAuth() {
  if (typeof refreshAuthTokenFromStorage === "function") {
    refreshAuthTokenFromStorage();
  }
  if (typeof getGameAuthToken === "function" && getGameAuthToken()) return true;
  return Boolean(localStorage.getItem("hulkLivesAuthToken"));
}

function setFriendsPanelStatus(message, isError = false) {
  const statusEl = document.getElementById("friends-panel-status");
  if (!statusEl) return;
  statusEl.textContent = message || "";
  statusEl.classList.toggle("error", Boolean(isError));
}

function setFriendsPanelLoggedOut() {
  const panel = document.getElementById("friends-panel");
  const list = document.getElementById("friends-panel-list");
  const requests = document.getElementById("friends-panel-requests");
  const form = document.getElementById("friends-add-form");
  const input = document.getElementById("friends-add-input");
  const button = document.getElementById("friends-add-btn");
  const countEl = document.getElementById("friends-panel-count");

  if (panel) panel.classList.add("logged-out");
  if (countEl) countEl.textContent = "0";
  if (list) {
    list.innerHTML = '<div class="friends-panel-empty">Log in to add friends.</div>';
  }
  if (requests) requests.innerHTML = "";
  if (input) {
    input.disabled = true;
    input.placeholder = "Log in to add friends";
  }
  if (button) button.disabled = true;
  if (form) form.hidden = false;
  setFriendsPanelStatus("");
}

function setFriendsPanelLoggedIn() {
  const panel = document.getElementById("friends-panel");
  const input = document.getElementById("friends-add-input");
  const button = document.getElementById("friends-add-btn");
  if (panel) panel.classList.remove("logged-out");
  if (input) {
    input.disabled = false;
    input.placeholder = "Add player...";
  }
  if (button) button.disabled = false;
}

function formatFriendStatus(friend) {
  if (!friend.online) return "Offline";
  if (friend.status === "freeplay") return "Freeplay";
  if (friend.inGame && friend.wave > 0) return `Wave ${friend.wave}`;
  if (friend.inGame) return "In game";
  if (friend.status === "menu") return "In menu";
  return "Online";
}

function renderFriendsPanel(payload) {
  const list = document.getElementById("friends-panel-list");
  const requests = document.getElementById("friends-panel-requests");
  const countEl = document.getElementById("friends-panel-count");
  if (!list || !requests) return;

  const friends = Array.isArray(payload.friends) ? payload.friends : [];
  const incoming = Array.isArray(payload.incoming) ? payload.incoming : [];
  const outgoing = Array.isArray(payload.outgoing) ? payload.outgoing : [];

  if (countEl) countEl.textContent = String(friends.length);

  if (!friends.length) {
    list.innerHTML = '<div class="friends-panel-empty">No friends yet. Add someone above.</div>';
  } else {
    list.innerHTML = friends
      .map((friend) => {
        const onlineClass = friend.online ? " online" : "";
        const status = formatFriendStatus(friend);
        return `<div class="friends-row${onlineClass}">
  <span class="friends-dot" aria-hidden="true"></span>
  <div class="friends-copy">
    <strong class="friends-name">${escapeFriendsHtml(friend.username)}</strong>
    <span class="friends-status">${escapeFriendsHtml(status)}</span>
  </div>
  <button type="button" class="friends-action-btn danger" onclick="removeFriendAccount('${escapeFriendsHtml(friend.username)}')">Remove</button>
</div>`;
      })
      .join("");
  }

  const requestBlocks = [];

  for (const entry of incoming) {
    requestBlocks.push(`<div class="friends-request-row incoming">
  <div class="friends-copy">
    <strong class="friends-name">${escapeFriendsHtml(entry.username)}</strong>
    <span class="friends-status">Wants to be friends</span>
  </div>
  <div class="friends-request-actions">
    <button type="button" class="friends-action-btn" onclick="acceptFriendRequest('${escapeFriendsHtml(entry.username)}')">Accept</button>
    <button type="button" class="friends-action-btn ghost" onclick="declineFriendRequest('${escapeFriendsHtml(entry.username)}')">Decline</button>
  </div>
</div>`);
  }

  for (const entry of outgoing) {
    requestBlocks.push(`<div class="friends-request-row outgoing">
  <div class="friends-copy">
    <strong class="friends-name">${escapeFriendsHtml(entry.username)}</strong>
    <span class="friends-status">Request sent</span>
  </div>
  <button type="button" class="friends-action-btn ghost" onclick="cancelFriendRequest('${escapeFriendsHtml(entry.username)}')">Cancel</button>
</div>`);
  }

  requests.innerHTML = requestBlocks.length
    ? `<div class="friends-requests-title">Requests</div>${requestBlocks.join("")}`
    : "";
}

async function refreshFriendsPanel(force = false) {
  const fetchAuth = getFriendsAuthFetch();
  if (!fetchAuth) return;

  if (!hasFriendsAuth()) {
    setFriendsPanelLoggedOut();
    return;
  }

  setFriendsPanelLoggedIn();
  if (force) setFriendsPanelStatus("Loading friends...");

  try {
    const response = await fetchAuth("/api/friends");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        setFriendsPanelLoggedOut();
        return;
      }
      setFriendsPanelStatus(payload.error || "Could not load friends.", true);
      return;
    }
    renderFriendsPanel(payload);
    setFriendsPanelStatus("");
  } catch (error) {
    setFriendsPanelStatus("Friends unavailable right now.", true);
  }
}

async function postFriendAction(path, username) {
  if (friendsBusy) return;
  const fetchAuth = getFriendsAuthFetch();
  if (!fetchAuth || !hasFriendsAuth()) {
    setFriendsPanelStatus("Log in to manage friends.", true);
    return;
  }

  const target = String(username || "").trim();
  if (!target) {
    setFriendsPanelStatus("Enter a player name.", true);
    return;
  }

  friendsBusy = true;
  setFriendsPanelStatus("Saving...");

  try {
    const response = await fetchAuth(path, {
      method: "POST",
      body: JSON.stringify({ username: target })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFriendsPanelStatus(payload.error || "Could not update friends.", true);
      return;
    }
    renderFriendsPanel(payload);
    setFriendsPanelStatus(payload.message || "Updated.");
  } catch (error) {
    setFriendsPanelStatus("Could not reach server.", true);
  } finally {
    friendsBusy = false;
  }
}

function submitFriendRequest() {
  const input = document.getElementById("friends-add-input");
  postFriendAction("/api/friends/request", input?.value || "");
  if (input) input.value = "";
}

function acceptFriendRequest(username) {
  postFriendAction("/api/friends/accept", username);
}

function declineFriendRequest(username) {
  postFriendAction("/api/friends/decline", username);
}

function cancelFriendRequest(username) {
  postFriendAction("/api/friends/cancel", username);
}

function removeFriendAccount(username) {
  postFriendAction("/api/friends/remove", username);
}

function initFriendsPanel() {
  if (friendsReady) return;
  friendsReady = true;

  const form = document.getElementById("friends-add-form");
  const input = document.getElementById("friends-add-input");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitFriendRequest();
    });
  }

  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitFriendRequest();
      }
    });
  }

  if (friendsPollTimer) clearInterval(friendsPollTimer);
  friendsPollTimer = setInterval(() => refreshFriendsPanel(false), FRIENDS_POLL_MS);
  refreshFriendsPanel(true);
}

window.refreshFriendsPanel = (force = true) => refreshFriendsPanel(force);
window.submitFriendRequest = submitFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.cancelFriendRequest = cancelFriendRequest;
window.removeFriendAccount = removeFriendAccount;
window.initFriendsPanel = initFriendsPanel;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFriendsPanel);
} else {
  initFriendsPanel();
}
