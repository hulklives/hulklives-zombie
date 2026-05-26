const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  MAX_SAVE_BODY_BYTES,
  clampInt,
  createRateLimiter,
  getAdminSkillPointBonus,
  getLevelFromXp,
  isSavePlausible,
  mergePlayerSaveSecure,
  normalizeNickname,
  repairSaveIntegrity,
  sanitizeSaveShape,
  validateNickname
} = require("./save-validation");
const {
  banIp,
  banUsername,
  ensureAdminConfigFile,
  getAdminConfigSnapshot,
  getCustomLeaderboardRole,
  getLeaderboardRole,
  getPublicRuntimeConfig,
  hasAppliedSkillPointGrant,
  isGameAdminName,
  isIpBlocked,
  isUsernameBlocked,
  loadAdminConfig,
  markSkillPointGrantApplied,
  setPlayerLeaderboardRole,
  unbanIp,
  unbanUsername,
  updateAnnouncement,
  updateLiveSettings
} = require("./admin-config");
const storage = require("./persistent-storage");
const {
  appendChatMessage,
  getLatestChatId,
  listChatMessages,
  loadChatStore
} = require("./chat");
const {
  listOnlinePlayers,
  removePresence,
  touchPresence
} = require("./presence");
const { attachCoopLobbyWebSocket } = require("./coop-lobby");
const {
  acceptFriendRequest,
  areFriends,
  cancelFriendRequest,
  declineFriendRequest,
  getFriendsSnapshot,
  loadFriendsStore,
  removeFriend,
  sendFriendRequest
} = require("./friends");
const {
  buildDailyChallengePayload,
  claimDailyChallenge,
  getDayKey,
  mergeRunIntoDailyProgress
} = require("./daily-challenges");
const {
  deleteSession,
  deleteSessionsForUsernameKey,
  findSaveKeyForAccount,
  getAccountByUsername,
  listAccountSummaries,
  loadAuthStore,
  loginAccount,
  registerAccount,
  requireAuth,
  usernameKey
} = require("./auth");

const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);
const communityFile = path.join(__dirname, "community.json");
const MAX_FEEDBACK_ENTRIES = 500;
const MAX_FEEDBACK_MESSAGE_LENGTH = 600;
const DEFAULT_COMMUNITY = {
  giveaway: { showComingSoon: true },
  featured: {
    active: false,
    displayName: "",
    gameName: "",
    rankLabel: "Featured Survivor",
    rankEmoji: "⭐",
    tiktokHandle: "",
    tiktokUrl: ""
  }
};
const rateLimitSave = createRateLimiter({ windowMs: 60_000, maxRequests: 45 });
const rateLimitAuth = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });
const rateLimitFeedback = createRateLimiter({ windowMs: 30 * 60_000, maxRequests: 4 });
const rateLimitAdmin = createRateLimiter({ windowMs: 60_000, maxRequests: 120 });
const rateLimitChat = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });
let saves = {};
let feedbackEntries = [];

function rejectIfBlockedRequest(req, res, username = "") {
  if (isIpBlocked(getClientKey(req))) {
    res.status(403).json({ error: "Access blocked." });
    return true;
  }
  if (username && isUsernameBlocked(username)) {
    res.status(403).json({ error: "This account is blocked." });
    return true;
  }
  return false;
}

function requireGameAdmin(req, res, next) {
  if (!isGameAdminName(req.auth.displayName)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

app.disable("x-powered-by");
app.use(express.json({ limit: MAX_SAVE_BODY_BYTES }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(
  express.static("public", {
    setHeaders(res, filePath) {
      if (/index\.html$/i.test(filePath)) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      }
      if (
        /player-.*-sheet.*\.png$/i.test(filePath) ||
        /weapon-.*\.png$/i.test(filePath) ||
        /hand-.*\.png$/i.test(filePath)
      ) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      }
    }
  })
);

function isBlockedName(name) {
  return isUsernameBlocked(name);
}

function getClientKey(req) {
  return String(
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown"
  );
}

function purgeBlockedSaves() {
  let changed = false;
  for (const name of Object.keys(saves)) {
    if (isBlockedName(name)) {
      delete saves[name];
      changed = true;
    }
  }
  if (changed) saveSaves();
}

function consolidateDuplicateSaves() {
  const grouped = new Map();

  for (const [name, data] of Object.entries(saves)) {
    const accountKey = usernameKey(name);
    if (!grouped.has(accountKey)) grouped.set(accountKey, []);
    grouped.get(accountKey).push({ name, data });
  }

  let changed = false;

  for (const entries of grouped.values()) {
    if (entries.length <= 1) continue;

    entries.sort((a, b) => computeRankScore(b.data || {}) - computeRankScore(a.data || {}));
    let merged = { ...(entries[0].data || {}) };

    for (let i = 1; i < entries.length; i += 1) {
      const result = mergePlayerSaveSecure(merged, entries[i].data || {});
      if (result.ok) merged = result.data;
    }

    const canonicalName = entries[0].name;
    saves[canonicalName] = merged;

    for (const entry of entries) {
      if (entry.name !== canonicalName && Object.prototype.hasOwnProperty.call(saves, entry.name)) {
        delete saves[entry.name];
        changed = true;
      }
    }

    if (JSON.stringify(saves[canonicalName]) !== JSON.stringify(entries[0].data)) {
      changed = true;
    }
  }

  if (changed) saveSaves();
}

async function loadSaves() {
  try {
    saves = (await storage.readJson("saves", {})) || {};
  } catch (error) {
    console.warn("Unable to read saves", error);
    saves = {};
  }

  let changed = false;
  for (const [name, data] of Object.entries(saves)) {
    if (isBlockedName(name)) {
      delete saves[name];
      changed = true;
      continue;
    }
    saves[name] = repairSaveIntegrity(data);
    changed = true;
  }

  purgeBlockedSaves();
  consolidateDuplicateSaves();
  if (changed) saveSaves();
}

function saveSaves() {
  storage.writeJson("saves", saves);
}

const STARTUP_SKILL_POINT_GRANTS = [
  { id: "hulklives-30k-v1", username: "hulklives", amount: 30000 }
];

function grantPlayerSkillPoints(targetName, amount, mode = "set") {
  const normalized = normalizeNickname(targetName);
  if (!normalized) {
    return { ok: false, error: "Enter a player name." };
  }

  const targetAmount = clampInt(amount, 1, 999999999);
  const { key } = ensureSaveForAccount(normalized);
  const save = { ...(saves[key] || sanitizeSaveShape({})) };
  const currentHeld = clampInt(save.skillPoints, 0, 999999999);
  const currentBonus = getAdminSkillPointBonus(save);

  let nextHeld = currentHeld;
  let nextBonus = currentBonus;

  if (mode === "add") {
    nextHeld = currentHeld + targetAmount;
    nextBonus = currentBonus + targetAmount;
  } else {
    nextHeld = Math.max(currentHeld, targetAmount);
    nextBonus = currentBonus + Math.max(0, nextHeld - currentHeld);
  }

  save.skillPoints = nextHeld;
  save.adminSpBonus = nextBonus;

  const sanitized = sanitizeSaveShape(save);
  if (!isSavePlausible(sanitized, sanitized)) {
    return { ok: false, error: "Could not grant skill points." };
  }

  saves[key] = sanitized;
  saveSaves();
  return {
    ok: true,
    username: key,
    skillPoints: sanitized.skillPoints,
    granted: Math.max(0, sanitized.skillPoints - currentHeld)
  };
}

async function applyStartupSkillPointGrants() {
  for (const grant of STARTUP_SKILL_POINT_GRANTS) {
    if (hasAppliedSkillPointGrant(grant.id)) continue;

    const result = grantPlayerSkillPoints(grant.username, grant.amount, "set");
    if (!result.ok) {
      console.warn(`Startup skill point grant failed for ${grant.username}: ${result.error}`);
      continue;
    }

    markSkillPointGrantApplied(grant.id);
    console.log(
      `Startup skill point grant applied for ${result.username}: ${result.skillPoints} SP (+${result.granted})`
    );
  }
}

function computeRankScore(data) {
  const level = getLevelFromXp(data.totalXp);
  const kills = Number(data.kills || 0);
  const bestWave = Number(data.bestWave || 0);
  const totalXp = Number(data.totalXp || 0);

  return level * 100000 + totalXp * 10 + kills + bestWave * 5;
}

function getSaveForAccount(displayName) {
  const existingKey = findSaveKeyForAccount(saves, displayName);
  if (existingKey) return { key: existingKey, data: saves[existingKey] };
  return { key: displayName, data: null };
}

function ensureSaveForAccount(displayName) {
  const { key, data } = getSaveForAccount(displayName);
  if (data) return { key, data };

  saves[key] = sanitizeSaveShape({});
  saveSaves();
  return { key, data: saves[key] };
}

function getPlayerLobbyProfile(displayName) {
  const { data } = getSaveForAccount(displayName);
  const totalXp = Number(data?.totalXp || 0);
  return {
    level: getLevelFromXp(totalXp),
    kills: Number(data?.kills || 0),
    bestWave: Number(data?.bestWave || 0)
  };
}

function buildLeaderboard(limit) {
  const max = Math.min(Number(limit) || 50, 100);

  return Object.entries(saves)
    .map(([name, data]) => ({
      name,
      kills: Number(data.kills || 0),
      bestWave: Number(data.bestWave || 0),
      totalXp: Number(data.totalXp || 0),
      level: getLevelFromXp(data.totalXp),
      rankScore: computeRankScore(data),
      lastPlayed: Number(data.lastPlayed || 0),
      hiddenFromLeaderboard: Boolean(data.leaderboardHidden)
    }))
    .filter((row) => row.name && !isBlockedName(row.name) && !row.hiddenFromLeaderboard)
    .sort(
      (a, b) =>
        b.level - a.level ||
        b.totalXp - a.totalXp ||
        b.kills - a.kills ||
        b.bestWave - a.bestWave
    )
    .slice(0, max)
    .map((row, index) => ({
      rank: index + 1,
      name: row.name,
      kills: row.kills,
      bestWave: row.bestWave,
      level: row.level,
      totalXp: row.totalXp,
      rankScore: row.rankScore,
      role: getLeaderboardRole(row.name)
    }));
}

app.post("/api/register", (req, res) => {
  const username = normalizeNickname(req.body?.username);
  const password = String(req.body?.password || "");

  if (rejectIfBlockedRequest(req, res, username)) return;
  if (!rateLimitAuth(`${getClientKey(req)}:register`)) {
    return res.status(429).json({ error: "Too many attempts. Wait a minute." });
  }

  const result = registerAccount(username, password);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  ensureSaveForAccount(result.username);
  res.json({ ok: true, token: result.token, username: result.username });
});

app.post("/api/login", (req, res) => {
  const username = normalizeNickname(req.body?.username);
  const password = String(req.body?.password || "");

  if (rejectIfBlockedRequest(req, res, username)) return;
  if (!rateLimitAuth(`${getClientKey(req)}:login`)) {
    return res.status(429).json({ error: "Too many attempts. Wait a minute." });
  }

  const result = loginAccount(username, password);
  if (!result.ok) {
    return res.status(401).json({ error: result.error });
  }

  ensureSaveForAccount(result.username);
  res.json({ ok: true, token: result.token, username: result.username });
});

function requireAuthAndAccess(req, res, next) {
  requireAuth(req, res, () => {
    if (rejectIfBlockedRequest(req, res, req.auth.displayName)) return;
    next();
  });
}

app.post("/api/logout", requireAuth, (req, res) => {
  removePresence(req.auth.displayName);
  deleteSession(req.authToken);
  res.json({ ok: true });
});

app.get("/api/me", requireAuthAndAccess, (req, res) => {
  res.json({
    ok: true,
    username: req.auth.displayName,
    isGameAdmin: isGameAdminName(req.auth.displayName),
    canViewFeedbackInbox: isGameAdminName(req.auth.displayName)
  });
});

app.get("/save", requireAuthAndAccess, (req, res) => {
  const { data } = getSaveForAccount(req.auth.displayName);
  return res.json(data || {});
});

app.get("/leaderboard", (req, res) => {
  res.json(buildLeaderboard(req.query.limit));
});

app.get("/api/daily-challenges", requireAuthAndAccess, (req, res) => {
  const { key, data } = getSaveForAccount(req.auth.displayName);
  const payload = buildDailyChallengePayload(data || {}, getDayKey());
  res.json({ ok: true, ...payload, skillPoints: Number(data?.skillPoints || 0) });
});

app.post("/api/daily-challenges/sync-run", requireAuthAndAccess, (req, res) => {
  const playerName = req.auth.displayName;
  const { key, data: existing } = getSaveForAccount(playerName);
  const dayKey = getDayKey();
  const merged = mergeRunIntoDailyProgress(existing?.dailyProgress, req.body?.run || req.body, dayKey);

  if (!merged.ok) {
    return res.status(400).json({ error: merged.error });
  }

  const nextSave = sanitizeSaveShape({
    ...(existing || {}),
    dailyProgress: merged.progress
  });

  saves[key] = nextSave;
  saveSaves();

  const payload = buildDailyChallengePayload(nextSave, dayKey);
  res.json({
    ok: true,
    message: "Daily progress updated.",
    ...payload,
    skillPoints: Number(nextSave.skillPoints || 0)
  });
});

app.post("/api/daily-challenges/claim", requireAuthAndAccess, (req, res) => {
  const playerName = req.auth.displayName;
  const challengeId = String(req.body?.challengeId || "").trim();
  if (!challengeId) {
    return res.status(400).json({ error: "Missing challenge id." });
  }

  const { key, data: existing } = getSaveForAccount(playerName);
  const result = claimDailyChallenge(existing || {}, challengeId, getDayKey());
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  saves[key] = result.save;
  saveSaves();

  const payload = buildDailyChallengePayload(result.save, getDayKey());
  res.json({
    ok: true,
    message: result.message,
    grantedSp: result.grantedSp,
    skillPoints: Number(result.save.skillPoints || 0),
    ...payload
  });
});

app.get("/api/friends", requireAuthAndAccess, (req, res) => {
  res.json({
    ok: true,
    ...getFriendsSnapshot(req.auth.displayName)
  });
});

app.post("/api/friends/request", requireAuthAndAccess, (req, res) => {
  const targetUsername = req.body?.username;
  const result = sendFriendRequest(req.auth.displayName, targetUsername, getAccountByUsername);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.json({
    ok: true,
    message: result.message,
    autoAccepted: Boolean(result.autoAccepted),
    ...getFriendsSnapshot(req.auth.displayName)
  });
});

app.post("/api/friends/accept", requireAuthAndAccess, (req, res) => {
  const result = acceptFriendRequest(req.auth.displayName, req.body?.username, getAccountByUsername);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ ok: true, message: result.message, ...getFriendsSnapshot(req.auth.displayName) });
});

app.post("/api/friends/decline", requireAuthAndAccess, (req, res) => {
  const result = declineFriendRequest(req.auth.displayName, req.body?.username, getAccountByUsername);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ ok: true, message: result.message, ...getFriendsSnapshot(req.auth.displayName) });
});

app.post("/api/friends/cancel", requireAuthAndAccess, (req, res) => {
  const result = cancelFriendRequest(req.auth.displayName, req.body?.username, getAccountByUsername);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ ok: true, message: result.message, ...getFriendsSnapshot(req.auth.displayName) });
});

app.post("/api/friends/remove", requireAuthAndAccess, (req, res) => {
  const result = removeFriend(req.auth.displayName, req.body?.username, getAccountByUsername);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ ok: true, message: result.message, ...getFriendsSnapshot(req.auth.displayName) });
});

function sanitizeTikTokUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return "";
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "tiktok.com" && host !== "vm.tiktok.com") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function normalizeTikTokHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/[^\w.\-]/g, "")
    .slice(0, 32);
}

function loadCommunityConfig() {
  try {
    if (!fs.existsSync(communityFile)) {
      return { ...DEFAULT_COMMUNITY, featured: { ...DEFAULT_COMMUNITY.featured } };
    }

    const parsed = JSON.parse(fs.readFileSync(communityFile, "utf8") || "{}") || {};
    const featured = parsed.featured && typeof parsed.featured === "object" ? parsed.featured : {};
    const giveaway = parsed.giveaway && typeof parsed.giveaway === "object" ? parsed.giveaway : {};

    const tiktokHandle = normalizeTikTokHandle(featured.tiktokHandle);
    const tiktokUrl =
      sanitizeTikTokUrl(featured.tiktokUrl) ||
      (tiktokHandle ? `https://www.tiktok.com/@${tiktokHandle}` : "");

    const active =
      Boolean(featured.active) &&
      Boolean(tiktokUrl) &&
      Boolean(String(featured.displayName || featured.gameName || "").trim());

    return {
      giveaway: {
        showComingSoon: giveaway.showComingSoon !== false,
        eyebrow: String(giveaway.eyebrow || "").trim().slice(0, 48),
        title: String(giveaway.title || "").trim().slice(0, 80),
        teaser: String(giveaway.teaser || "").trim().slice(0, 160)
      },
      featured: {
        active,
        displayName: String(featured.displayName || featured.gameName || "").trim().slice(0, 32),
        gameName: String(featured.gameName || featured.displayName || "").trim().slice(0, 32),
        rankLabel: String(featured.rankLabel || "Featured Survivor").trim().slice(0, 40),
        rankEmoji: String(featured.rankEmoji || "⭐").trim().slice(0, 4) || "⭐",
        tiktokHandle,
        tiktokUrl
      }
    };
  } catch (error) {
    console.warn("Unable to read community.json", error);
    return { ...DEFAULT_COMMUNITY, featured: { ...DEFAULT_COMMUNITY.featured } };
  }
}

app.get("/api/community", (req, res) => {
  const community = loadCommunityConfig();
  const runtime = getPublicRuntimeConfig();

  res.json({
    ...community,
    giveaway: {
      ...community.giveaway,
      ...runtime.giveaway
    },
    announcement: runtime.announcement,
    live: runtime.live
  });
});

async function loadFeedbackStore() {
  try {
    const parsed = await storage.readJson("feedback", []);
    feedbackEntries = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to read feedback", error);
    feedbackEntries = [];
  }
}

function loadFeedbackEntries() {
  return feedbackEntries;
}

function saveFeedbackEntries(entries) {
  feedbackEntries = Array.isArray(entries) ? entries : [];
  storage.writeJson("feedback", feedbackEntries);
}

function sanitizeFeedbackCategory(value) {
  const category = String(value || "bug").trim().toLowerCase();
  if (category === "bug" || category === "idea" || category === "feedback") return category;
  return "other";
}

function sanitizeFeedbackMessage(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, MAX_FEEDBACK_MESSAGE_LENGTH);
}

function sanitizeFeedbackContext(raw) {
  if (!raw || typeof raw !== "object") return {};
  return {
    wave: Math.max(0, Math.min(9999, Math.round(Number(raw.wave) || 0))),
    level: Math.max(1, Math.min(999, Math.round(Number(raw.level) || 1))),
    gameRunning: Boolean(raw.gameRunning),
    equippedWeapon: String(raw.equippedWeapon || "").trim().slice(0, 24),
    page: String(raw.page || "").trim().slice(0, 32)
  };
}

app.post("/api/feedback", requireAuthAndAccess, (req, res) => {
  const playerName = req.auth.displayName;
  const rateKey = `${usernameKey(playerName)}:feedback`;

  if (!rateLimitFeedback(rateKey)) {
    return res.status(429).json({
      error: "You can only send a few reports every half hour. Wait a bit."
    });
  }

  const message = sanitizeFeedbackMessage(req.body?.message);
  if (message.length < 8) {
    return res.status(400).json({ error: "Write at least 8 characters so we understand the issue." });
  }

  const category = sanitizeFeedbackCategory(req.body?.category);
  const context = sanitizeFeedbackContext(req.body?.context);
  const entry = {
    id: `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    username: playerName,
    category,
    message,
    createdAt: Date.now(),
    resolvedAt: 0,
    context,
    clientIp: getClientKey(req).slice(0, 64)
  };

  const entries = loadFeedbackEntries();
  entries.unshift(entry);
  if (entries.length > MAX_FEEDBACK_ENTRIES) {
    entries.length = MAX_FEEDBACK_ENTRIES;
  }
  saveFeedbackEntries(entries);

  console.log(`Feedback from ${playerName} [${category}]: ${message.slice(0, 100)}`);
  res.json({ ok: true });
});

app.get("/api/feedback/inbox", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  const status = String(req.query.status || "open").trim().toLowerCase();
  let reports = loadFeedbackEntries().map(({ clientIp, ...entry }) => ({
    ...entry,
    resolved: Boolean(entry.resolvedAt)
  }));

  if (status === "open") {
    reports = reports.filter((entry) => !entry.resolved);
  } else if (status === "resolved") {
    reports = reports.filter((entry) => entry.resolved);
  }

  res.json({
    ok: true,
    total: reports.length,
    openTotal: loadFeedbackEntries().filter((entry) => !entry.resolvedAt).length,
    reports
  });
});

function findSaveKeyByUsername(name) {
  const key = findSaveKeyForAccount(saves, name);
  if (key) return key;
  const normalized = normalizeNickname(name);
  return normalized || null;
}

function buildAdminPlayerRow(name, data) {
  const save = data || {};
  return {
    username: name,
    level: getLevelFromXp(save.totalXp),
    kills: Number(save.kills || 0),
    bestWave: Number(save.bestWave || 0),
    totalXp: Number(save.totalXp || 0),
    skillPoints: Number(save.skillPoints || 0),
    lastPlayed: Number(save.lastPlayed || 0),
    leaderboardHidden: Boolean(save.leaderboardHidden),
    banned: isUsernameBlocked(name),
    leaderboardRole: getLeaderboardRole(name),
    customLeaderboardRole: getCustomLeaderboardRole(name)
  };
}

function listAdminPlayers(search = "") {
  const query = String(search || "").trim().toLowerCase();
  const rows = new Map();

  for (const account of listAccountSummaries()) {
    rows.set(usernameKey(account.username), buildAdminPlayerRow(account.username, null));
  }

  for (const [name, data] of Object.entries(saves)) {
    const key = usernameKey(name);
    rows.set(key, buildAdminPlayerRow(name, data));
  }

  let players = [...rows.values()].sort((a, b) => {
    return (
      b.level - a.level ||
      b.totalXp - a.totalXp ||
      b.kills - a.kills ||
      a.username.localeCompare(b.username)
    );
  });

  if (query) {
    players = players.filter((row) => row.username.toLowerCase().includes(query));
  }

  return players.slice(0, 100);
}

app.get("/api/admin/state", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-state`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const reports = loadFeedbackEntries();
  res.json({
    ok: true,
    config: getAdminConfigSnapshot(),
    stats: {
      playerCount: Object.keys(saves).length,
      openReports: reports.filter((entry) => !entry.resolvedAt).length,
      bannedUsers: getAdminConfigSnapshot().bannedUsernames.length,
      bannedIps: getAdminConfigSnapshot().bannedIps.length
    }
  });
});

app.get("/api/admin/players", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-players`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  res.json({
    ok: true,
    players: listAdminPlayers(req.query.search)
  });
});

app.post("/api/admin/players/reset-save", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-reset`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const targetName = normalizeNickname(req.body?.username);
  if (!targetName) {
    return res.status(400).json({ error: "Enter a player name." });
  }
  if (isGameAdminName(targetName)) {
    return res.status(403).json({ error: "You cannot reset the admin account." });
  }

  const key = findSaveKeyByUsername(targetName);
  if (!key) {
    return res.status(404).json({ error: "Player not found." });
  }

  saves[key] = sanitizeSaveShape({});
  saveSaves();
  console.log(`Admin reset save for ${targetName}`);
  res.json({ ok: true, username: key });
});

app.post("/api/admin/players/grant-skill-points", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-grant-sp`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const targetName = normalizeNickname(req.body?.username);
  const amount = clampInt(req.body?.amount, 1, 999999999);
  const mode = String(req.body?.mode || "set").trim().toLowerCase() === "add" ? "add" : "set";

  if (!targetName) {
    return res.status(400).json({ error: "Enter a player name." });
  }

  const result = grantPlayerSkillPoints(targetName, amount, mode);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  console.log(`Admin granted ${result.granted} SP to ${result.username} (${result.skillPoints} total)`);
  res.json(result);
});

app.post("/api/admin/players/leaderboard-hidden", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-leaderboard`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const targetName = normalizeNickname(req.body?.username);
  const hidden = Boolean(req.body?.hidden);
  if (!targetName) {
    return res.status(400).json({ error: "Enter a player name." });
  }

  const key = findSaveKeyByUsername(targetName);
  if (!key || !saves[key]) {
    return res.status(404).json({ error: "Player not found." });
  }

  saves[key].leaderboardHidden = hidden;
  saveSaves();
  console.log(`Admin ${hidden ? "hid" : "restored"} ${targetName} on leaderboard`);
  res.json({ ok: true, username: key, hidden });
});

app.post("/api/admin/players/leaderboard-role", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-role`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const targetName = normalizeNickname(req.body?.username);
  if (!targetName) {
    return res.status(400).json({ error: "Enter a player name." });
  }
  if (!findSaveKeyByUsername(targetName) && !listAccountSummaries().some((row) => usernameKey(row.username) === usernameKey(targetName))) {
    return res.status(404).json({ error: "Player not found." });
  }

  const result = setPlayerLeaderboardRole(targetName, req.body?.role);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  console.log(`Admin set leaderboard role for ${targetName}: ${result.role}`);
  res.json({
    ok: true,
    username: targetName,
    role: result.role,
    customRole: result.customRole
  });
});

app.post("/api/admin/players/ban", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-ban`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const targetName = normalizeNickname(req.body?.username);
  if (!targetName) {
    return res.status(400).json({ error: "Enter a player name." });
  }

  const result = banUsername(targetName);
  if (!result.ok) {
    return res.status(403).json({ error: result.error });
  }

  deleteSessionsForUsernameKey(result.usernameKey);
  purgeBlockedSaves();

  console.log(`Admin banned account ${targetName}`);
  res.json({ ok: true, username: targetName });
});

app.post("/api/admin/players/unban", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-unban`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const targetName = normalizeNickname(req.body?.username);
  if (!targetName) {
    return res.status(400).json({ error: "Enter a player name." });
  }

  unbanUsername(targetName);
  console.log(`Admin unbanned account ${targetName}`);
  res.json({ ok: true, username: targetName });
});

app.post("/api/admin/bans/ip", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-ban-ip`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const ip = String(req.body?.ip || "").trim();
  const ban = req.body?.ban !== false;
  if (!ip) {
    return res.status(400).json({ error: "Enter an IP address." });
  }

  const result = ban ? banIp(ip) : unbanIp(ip);
  if (!result.ok) {
    return res.status(400).json({ error: result.error || "Could not update IP ban." });
  }

  console.log(`Admin ${ban ? "banned" : "unbanned"} IP ${result.ip}`);
  res.json({ ok: true, ip: result.ip, banned: ban });
});

app.post("/api/admin/config/announcement", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-announcement`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const announcement = updateAnnouncement(req.body || {});
  res.json({ ok: true, announcement, public: getPublicRuntimeConfig().announcement });
});

app.post("/api/admin/config/live", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-live`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const live = updateLiveSettings(req.body || {});
  res.json({
    ok: true,
    live,
    public: getPublicRuntimeConfig()
  });
});

app.post("/api/admin/reports/resolve", requireAuthAndAccess, requireGameAdmin, (req, res) => {
  if (!rateLimitAdmin(`${getClientKey(req)}:admin-report`)) {
    return res.status(429).json({ error: "Too many admin requests." });
  }

  const reportId = String(req.body?.id || "").trim();
  const resolved = Boolean(req.body?.resolved);
  if (!reportId) {
    return res.status(400).json({ error: "Missing report id." });
  }

  const entries = loadFeedbackEntries();
  const entry = entries.find((item) => item.id === reportId);
  if (!entry) {
    return res.status(404).json({ error: "Report not found." });
  }

  entry.resolvedAt = resolved ? Date.now() : 0;
  saveFeedbackEntries(entries);
  res.json({ ok: true, id: reportId, resolved });
});

app.get("/api/chat", requireAuthAndAccess, (req, res) => {
  const after = String(req.query.after || "").trim();
  res.json({
    ok: true,
    messages: listChatMessages(after),
    latestId: getLatestChatId()
  });
});

app.post("/api/chat", requireAuthAndAccess, (req, res) => {
  const senderKey = usernameKey(req.auth.displayName);
  if (!rateLimitChat(`${getClientKey(req)}:chat:${senderKey}`)) {
    return res.status(429).json({ error: "Slow down — wait a moment before sending again." });
  }

  const result = appendChatMessage(req.auth.displayName, req.body?.message);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ ok: true, message: result.message, latestId: getLatestChatId() });
});

app.get("/api/presence/online", requireAuthAndAccess, (req, res) => {
  res.json({
    ok: true,
    players: listOnlinePlayers()
  });
});

app.post("/api/presence", requireAuthAndAccess, (req, res) => {
  const entry = touchPresence(req.auth.displayName, {
    status: req.body?.status,
    inGame: req.body?.inGame,
    wave: req.body?.wave
  });

  res.json({
    ok: true,
    player: entry,
    players: listOnlinePlayers()
  });
});

app.post("/save", requireAuthAndAccess, (req, res) => {
  const playerName = req.auth.displayName;
  const data = req.body && typeof req.body === "object" ? req.body : {};

  if (!rateLimitSave(`${getClientKey(req)}:${usernameKey(playerName)}`)) {
    return res.status(429).json({ error: "Too many save requests" });
  }

  const { key, data: existing } = getSaveForAccount(playerName);
  const result = mergePlayerSaveSecure(existing || {}, data);
  if (!result.ok) {
    console.warn(`Rejected suspicious save for ${playerName} (${result.reason})`);
    return res.status(403).json({ error: "Save rejected — invalid progression" });
  }

  saves[key] = result.data;
  saveSaves();
  res.json({ ok: true, rankScore: computeRankScore(saves[key]) });
});

const port = process.env.PORT || 3000;

server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

async function startServer() {
  await storage.initPersistentStorage();
  await loadAuthStore();
  await loadAdminConfig();
  await loadSaves();
  await applyStartupSkillPointGrants();
  await loadFeedbackStore();
  await loadChatStore();
  await loadFriendsStore();
  ensureAdminConfigFile();

  attachCoopLobbyWebSocket(server, {
    verifySession: require("./auth").verifySession,
    getPlayerLobbyProfile,
    areFriends
  });

  server.listen(port, () => {
    console.log(`OK server running on http://localhost:${port}`);
    console.log(`Persistent storage: ${storage.getStorageMode()}`);
    console.log("Accounts, save validation, anti-cheat, admin tools, live chat, friends and co-op lobby enabled");
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
