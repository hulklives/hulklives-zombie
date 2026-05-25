const CHAT_TOKEN_KEY = "hulkLivesAuthToken";
let chatLastId = "";
let chatPollTimer = null;
let chatSending = false;
let chatKnownIds = new Set();

function escapeChatHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatChatTime(timestamp) {
  return new Date(Number(timestamp) || Date.now()).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getChatAuthFetch() {
  if (typeof authFetch === "function") return authFetch;
  return null;
}

function hasChatAuth() {
  if (typeof refreshAuthTokenFromStorage === "function") {
    refreshAuthTokenFromStorage();
  }
  return Boolean(localStorage.getItem(CHAT_TOKEN_KEY));
}

function setGlobalChatStatus(message, isError = false) {
  const statusEl = document.getElementById("global-chat-status");
  if (!statusEl) return;
  statusEl.textContent = message || "";
  statusEl.classList.toggle("error", Boolean(isError));
}

function setGlobalChatLoggedOut() {
  const panel = document.getElementById("global-chat");
  const input = document.getElementById("global-chat-input");
  const button = document.getElementById("global-chat-send");
  if (input) {
    input.disabled = true;
    input.placeholder = "Log in to chat";
  }
  if (button) button.disabled = true;
  if (panel) panel.classList.add("logged-out");
  setGlobalChatStatus("Log in to join the chat.");
}

function setGlobalChatLoggedIn() {
  const panel = document.getElementById("global-chat");
  const input = document.getElementById("global-chat-input");
  const button = document.getElementById("global-chat-send");
  if (input) {
    input.disabled = false;
    input.placeholder = "Write a message...";
  }
  if (button) button.disabled = false;
  if (panel) panel.classList.remove("logged-out");
  setGlobalChatStatus("");
}

function renderGlobalChatMessages(messages, replace = false) {
  const list = document.getElementById("global-chat-messages");
  if (!list) return;

  if (replace) {
    list.innerHTML = "";
    chatKnownIds = new Set();
  }

  if (!messages.length && replace) {
    list.innerHTML = '<div class="global-chat-empty">No messages yet. Say hi!</div>';
    return;
  }

  const empty = list.querySelector(".global-chat-empty");
  if (empty) empty.remove();

  const stickToBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 48;
  const fragment = document.createDocumentFragment();

  messages.forEach((entry) => {
    if (!entry?.id || chatKnownIds.has(entry.id)) return;
    chatKnownIds.add(entry.id);

    const row = document.createElement("article");
    row.className = "global-chat-message";
    if (entry.role && entry.role !== "Survivor") {
      row.classList.add("has-role");
    }

    const roleHtml = entry.role && entry.role !== "Survivor"
      ? `<span class="global-chat-role">${escapeChatHtml(entry.role)}</span>`
      : "";

    row.innerHTML = `<div class="global-chat-message-head">
  <strong class="global-chat-user">${escapeChatHtml(entry.username || "Player")}</strong>
  ${roleHtml}
  <span class="global-chat-time">${escapeChatHtml(formatChatTime(entry.createdAt))}</span>
</div>
<p class="global-chat-text">${escapeChatHtml(entry.message || "")}</p>`;

    fragment.appendChild(row);
  });

  list.appendChild(fragment);

  while (list.children.length > 120) {
    const removed = list.firstElementChild;
    if (removed?.dataset?.id) chatKnownIds.delete(removed.dataset.id);
    removed?.remove();
  }

  if (stickToBottom) {
    list.scrollTop = list.scrollHeight;
  }
}

async function pollGlobalChat(forceFull = false) {
  const fetchAuth = getChatAuthFetch();
  if (!fetchAuth) return;

  if (!hasChatAuth()) {
    setGlobalChatLoggedOut();
    return;
  }

  setGlobalChatLoggedIn();

  try {
    if (forceFull) {
      chatLastId = "";
    }
    const query =
      !forceFull && chatLastId ? `?after=${encodeURIComponent(chatLastId)}` : "";
    const response = await fetchAuth(`/api/chat${query}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) setGlobalChatLoggedOut();
      return;
    }

    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    renderGlobalChatMessages(messages, forceFull || !chatLastId);

    if (payload.latestId) {
      chatLastId = payload.latestId;
    } else if (messages.length) {
      chatLastId = messages[messages.length - 1].id;
    }
  } catch (error) {
    setGlobalChatStatus("Chat offline right now.", true);
  }
}

async function sendGlobalChatMessage() {
  const fetchAuth = getChatAuthFetch();
  const input = document.getElementById("global-chat-input");
  if (!fetchAuth || !input || chatSending) return;

  const message = input.value.trim();
  if (!message) return;
  if (!hasChatAuth()) {
    setGlobalChatLoggedOut();
    return;
  }

  chatSending = true;
  setGlobalChatStatus("Sending...");

  try {
    const response = await fetchAuth("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setGlobalChatStatus(payload.error || "Could not send message.", true);
      return;
    }

    input.value = "";
    setGlobalChatStatus("");
    if (payload.message) {
      renderGlobalChatMessages([payload.message]);
      chatLastId = payload.message.id || chatLastId;
    } else {
      await pollGlobalChat();
    }
  } catch (error) {
    setGlobalChatStatus("Could not reach chat.", true);
  } finally {
    chatSending = false;
  }
}

function initGlobalChat() {
  const form = document.getElementById("global-chat-form");
  const input = document.getElementById("global-chat-input");
  if (!form || !input) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendGlobalChatMessage();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendGlobalChatMessage();
    }
  });

  if (chatPollTimer) clearInterval(chatPollTimer);
  chatPollTimer = setInterval(() => pollGlobalChat(false), 3000);
  pollGlobalChat(true);
}

window.refreshGlobalChat = () => pollGlobalChat(true);
window.initGlobalChat = initGlobalChat;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGlobalChat);
} else {
  initGlobalChat();
}
