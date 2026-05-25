const crypto = require("crypto");
const storage = require("./persistent-storage");
const { getLeaderboardRole } = require("./admin-config");
const { normalizeNickname } = require("./save-validation");

const MAX_CHAT_MESSAGES = 250;
const MAX_CHAT_MESSAGE_LENGTH = 180;
const MAX_CHAT_FETCH = 80;

let chatMessages = [];

function isValidChatMessage(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.id === "string" &&
    typeof entry.username === "string" &&
    typeof entry.message === "string" &&
    Number.isFinite(Number(entry.createdAt))
  );
}

function sanitizeChatMessage(value) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CHAT_MESSAGE_LENGTH);
}

async function loadChatStore() {
  try {
    const raw = (await storage.readJson("chat", [])) || [];
    chatMessages = Array.isArray(raw) ? raw.filter(isValidChatMessage) : [];
  } catch (error) {
    console.warn("Unable to read chat messages", error);
    chatMessages = [];
  }

  if (chatMessages.length > MAX_CHAT_MESSAGES) {
    chatMessages = chatMessages.slice(-MAX_CHAT_MESSAGES);
    saveChatStore();
  }
}

function saveChatStore() {
  storage.writeJson("chat", chatMessages);
}

function listChatMessages(afterId = "") {
  const after = String(afterId || "").trim();
  if (!after) {
    return chatMessages.slice(-MAX_CHAT_FETCH);
  }

  const index = chatMessages.findIndex((entry) => entry.id === after);
  if (index === -1) {
    return chatMessages.slice(-MAX_CHAT_FETCH);
  }

  return chatMessages.slice(index + 1);
}

function getLatestChatId() {
  return chatMessages.length ? chatMessages[chatMessages.length - 1].id : "";
}

function appendChatMessage(username, message) {
  const text = sanitizeChatMessage(message);
  if (!text) {
    return { ok: false, error: "Write a message first." };
  }
  if (text.length < 2) {
    return { ok: false, error: "Message is too short." };
  }

  const displayName = normalizeNickname(username);
  const entry = {
    id: crypto.randomUUID(),
    username: displayName,
    message: text,
    createdAt: Date.now(),
    role: getLeaderboardRole(displayName)
  };

  chatMessages.push(entry);
  if (chatMessages.length > MAX_CHAT_MESSAGES) {
    chatMessages = chatMessages.slice(-MAX_CHAT_MESSAGES);
  }
  saveChatStore();

  return { ok: true, message: entry };
}

module.exports = {
  appendChatMessage,
  getLatestChatId,
  listChatMessages,
  loadChatStore,
  sanitizeChatMessage
};
