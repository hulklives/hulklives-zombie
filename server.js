const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  MAX_SAVE_BODY_BYTES,
  createRateLimiter,
  getLevelFromXp,
  mergePlayerSaveSecure,
  normalizeNickname,
  repairSaveIntegrity,
  sanitizeSaveShape,
  validateNickname
} = require("./save-validation");
const {
  deleteSession,
  findSaveKeyForAccount,
  loadAuthStore,
  loginAccount,
  registerAccount,
  requireAuth,
  usernameKey
} = require("./auth");

const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);
const savesFile = path.join(__dirname, "saves.json");
const communityFile = path.join(__dirname, "community.json");
const feedbackFile = path.join(__dirname, "feedback.json");
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
const blockedNames = new Set(["sdfds", "testplayer", "admin", "moderator", "system"]);
const FEEDBACK_ADMIN_USERNAME_KEY = "hulklives";
const rateLimitSave = createRateLimiter({ windowMs: 60_000, maxRequests: 45 });
const rateLimitAuth = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });
const rateLimitFeedback = createRateLimiter({ windowMs: 30 * 60_000, maxRequests: 4 });
let saves = {};

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
  return blockedNames.has(String(name || "").trim().toLowerCase());
}

function isFeedbackAdminName(name) {
  return usernameKey(name) === FEEDBACK_ADMIN_USERNAME_KEY;
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

function loadSaves() {
  try {
    if (fs.existsSync(savesFile)) {
      saves = JSON.parse(fs.readFileSync(savesFile, "utf8") || "{}") || {};
    }
  } catch (error) {
    console.warn("Unable to read saves.json", error);
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
  if (changed) saveSaves();
}

function saveSaves() {
  try {
    fs.writeFileSync(savesFile, JSON.stringify(saves, null, 2));
  } catch (error) {
    console.warn("Unable to write saves.json", error);
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
      lastPlayed: Number(data.lastPlayed || 0)
    }))
    .filter((row) => row.name && !isBlockedName(row.name))
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
      rankScore: row.rankScore
    }));
}

app.post("/api/register", (req, res) => {
  const username = normalizeNickname(req.body?.username);
  const password = String(req.body?.password || "");

  if (isBlockedName(username)) {
    return res.status(403).json({ error: "This name is not allowed" });
  }
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

  if (isBlockedName(username)) {
    return res.status(403).json({ error: "This name is not allowed" });
  }
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

app.post("/api/logout", requireAuth, (req, res) => {
  deleteSession(req.authToken);
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    ok: true,
    username: req.auth.displayName,
    canViewFeedbackInbox: isFeedbackAdminName(req.auth.displayName)
  });
});

app.get("/save", requireAuth, (req, res) => {
  const { data } = getSaveForAccount(req.auth.displayName);
  return res.json(data || {});
});

app.get("/leaderboard", (req, res) => {
  res.json(buildLeaderboard(req.query.limit));
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
        showComingSoon: giveaway.showComingSoon !== false
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
  res.json(loadCommunityConfig());
});

function loadFeedbackEntries() {
  try {
    if (fs.existsSync(feedbackFile)) {
      const parsed = JSON.parse(fs.readFileSync(feedbackFile, "utf8") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.warn("Unable to read feedback.json", error);
  }
  return [];
}

function saveFeedbackEntries(entries) {
  try {
    fs.writeFileSync(feedbackFile, JSON.stringify(entries, null, 2));
  } catch (error) {
    console.warn("Unable to write feedback.json", error);
  }
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

app.post("/api/feedback", requireAuth, (req, res) => {
  const playerName = req.auth.displayName;
  const rateKey = `${usernameKey(playerName)}:feedback`;

  if (!rateLimitFeedback(rateKey)) {
    return res.status(429).json({
      error: "Du kan skicka max några rapporter per halvtimme. Vänta lite."
    });
  }

  const message = sanitizeFeedbackMessage(req.body?.message);
  if (message.length < 8) {
    return res.status(400).json({ error: "Skriv minst 8 tecken så vi förstår felet." });
  }

  const category = sanitizeFeedbackCategory(req.body?.category);
  const context = sanitizeFeedbackContext(req.body?.context);
  const entry = {
    id: `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    username: playerName,
    category,
    message,
    createdAt: Date.now(),
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

app.get("/api/feedback/inbox", requireAuth, (req, res) => {
  if (!isFeedbackAdminName(req.auth.displayName)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const reports = loadFeedbackEntries().map(({ clientIp, ...entry }) => entry);
  res.json({ ok: true, total: reports.length, reports });
});

app.post("/save", requireAuth, (req, res) => {
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

loadAuthStore();
loadSaves();

function ensureDataFiles() {
  if (!fs.existsSync(savesFile)) {
    fs.writeFileSync(savesFile, "{}\n");
  }
  if (!fs.existsSync(feedbackFile)) {
    fs.writeFileSync(feedbackFile, "[]\n");
  }
}

ensureDataFiles();

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

server.listen(port, () => {
  console.log(`OK server running on http://localhost:${port}`);
  console.log("Accounts, save validation and anti-cheat enabled");
});
