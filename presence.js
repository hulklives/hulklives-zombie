const { getLeaderboardRole } = require("./admin-config");
const { normalizeNickname } = require("./save-validation");
const { usernameKey } = require("./auth");

const ONLINE_TTL_MS = 45000;
const onlinePlayers = new Map();

function sanitizePresenceStatus(value) {
  const status = String(value || "online").trim().toLowerCase();
  if (status === "menu" || status === "playing" || status === "freeplay") return status;
  return "online";
}

function touchPresence(username, patch = {}) {
  const displayName = normalizeNickname(username);
  const key = usernameKey(displayName);
  if (!key) return null;

  const existing = onlinePlayers.get(key) || {};
  const status = sanitizePresenceStatus(patch.status || existing.status || "online");
  const inGame = patch.inGame !== undefined ? Boolean(patch.inGame) : Boolean(existing.inGame);
  const wave = Math.max(0, Math.floor(Number(patch.wave ?? existing.wave ?? 0)));

  const entry = {
    username: displayName,
    usernameKey: key,
    role: getLeaderboardRole(displayName),
    status,
    inGame,
    wave,
    lastSeen: Date.now()
  };

  onlinePlayers.set(key, entry);
  return entry;
}

function removePresence(username) {
  const key = usernameKey(username);
  if (!key) return;
  onlinePlayers.delete(key);
}

function purgeStalePresence() {
  const now = Date.now();
  for (const [key, entry] of onlinePlayers.entries()) {
    if (!entry?.lastSeen || now - entry.lastSeen > ONLINE_TTL_MS) {
      onlinePlayers.delete(key);
    }
  }
}

function listOnlinePlayers() {
  purgeStalePresence();
  return [...onlinePlayers.values()].sort((a, b) => {
    if (Boolean(b.inGame) !== Boolean(a.inGame)) return Number(b.inGame) - Number(a.inGame);
    return a.username.localeCompare(b.username, "sv");
  });
}

function getOnlinePlayerCount() {
  return listOnlinePlayers().length;
}

module.exports = {
  getOnlinePlayerCount,
  listOnlinePlayers,
  purgeStalePresence,
  removePresence,
  touchPresence
};
