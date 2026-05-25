const { usernameKey } = require("./auth");
const storage = require("./persistent-storage");
const GAME_ADMIN_USERNAME_KEY = "hulklives";

const DEFAULT_BLOCKED_USERNAMES = ["sdfds", "testplayer", "admin", "moderator", "system"];

const DEFAULT_ADMIN_CONFIG = {
  announcement: {
    active: false,
    message: "",
    updatedAt: 0
  },
  live: {
    giveawayEyebrow: "HulkLives Event",
    giveawayTitle: "🎁 Giveaway Coming Soon",
    giveawayTeaser: "Top the leaderboard — details coming soon.",
    showGiveaway: true,
    bonusOfferChance: 18,
    bonusWinChance: 50,
    freeplayEnabled: true
  },
  bannedUsernames: [],
  bannedIps: [],
  defaultLeaderboardRole: "Survivor",
  leaderboardRoles: {
    hulklives: "Owner"
  },
  appliedSkillPointGrants: []
};

let adminConfig = normalizeAdminConfig(DEFAULT_ADMIN_CONFIG);

function clampPercent(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function sanitizeText(value, maxLen) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLen);
}

function normalizeIp(value) {
  return String(value || "")
    .trim()
    .slice(0, 64);
}

function normalizeLeaderboardRoles(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const roles = { ...DEFAULT_ADMIN_CONFIG.leaderboardRoles };

  for (const [name, roleValue] of Object.entries(source)) {
    const key = usernameKey(name);
    const role = sanitizeText(roleValue, 24);
    if (!key || !role) continue;
    roles[key] = role;
  }

  return roles;
}

function normalizeAdminConfig(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const announcement =
    source.announcement && typeof source.announcement === "object" ? source.announcement : {};
  const live = source.live && typeof source.live === "object" ? source.live : {};
  const bannedUsernames = Array.isArray(source.bannedUsernames) ? source.bannedUsernames : [];
  const bannedIps = Array.isArray(source.bannedIps) ? source.bannedIps : [];

  return {
    announcement: {
      active: Boolean(announcement.active) && sanitizeText(announcement.message, 240).length > 0,
      message: sanitizeText(announcement.message, 240),
      updatedAt: Math.max(0, Number(announcement.updatedAt) || 0)
    },
    live: {
      giveawayEyebrow: sanitizeText(live.giveawayEyebrow, 48) || DEFAULT_ADMIN_CONFIG.live.giveawayEyebrow,
      giveawayTitle: sanitizeText(live.giveawayTitle, 80) || DEFAULT_ADMIN_CONFIG.live.giveawayTitle,
      giveawayTeaser: sanitizeText(live.giveawayTeaser, 160) || DEFAULT_ADMIN_CONFIG.live.giveawayTeaser,
      showGiveaway: live.showGiveaway !== false,
      bonusOfferChance: clampPercent(live.bonusOfferChance, DEFAULT_ADMIN_CONFIG.live.bonusOfferChance),
      bonusWinChance: clampPercent(live.bonusWinChance, DEFAULT_ADMIN_CONFIG.live.bonusWinChance),
      freeplayEnabled: live.freeplayEnabled !== false
    },
    bannedUsernames: [...new Set(bannedUsernames.map((name) => usernameKey(name)).filter(Boolean))],
    bannedIps: [...new Set(bannedIps.map(normalizeIp).filter(Boolean))],
    defaultLeaderboardRole:
      sanitizeText(source.defaultLeaderboardRole, 24) || DEFAULT_ADMIN_CONFIG.defaultLeaderboardRole,
    leaderboardRoles: normalizeLeaderboardRoles(source.leaderboardRoles)
  };
}

async function loadAdminConfig() {
  try {
    const raw = await storage.readJson("admin-config", null);
    if (raw && typeof raw === "object") {
      adminConfig = normalizeAdminConfig(raw);
    } else {
      adminConfig = normalizeAdminConfig(DEFAULT_ADMIN_CONFIG);
      saveAdminConfig();
    }
  } catch (error) {
    console.warn("Unable to read admin config", error);
    adminConfig = normalizeAdminConfig(DEFAULT_ADMIN_CONFIG);
  }
  return adminConfig;
}

function saveAdminConfig() {
  storage.writeJson("admin-config", adminConfig);
}

function getAdminConfig() {
  return adminConfig;
}

function isGameAdminName(name) {
  return usernameKey(name) === GAME_ADMIN_USERNAME_KEY;
}

function getReservedBlockedUsernames() {
  return DEFAULT_BLOCKED_USERNAMES;
}

function isUsernameBlocked(name) {
  const key = usernameKey(name);
  if (!key) return true;
  if (DEFAULT_BLOCKED_USERNAMES.includes(key)) return true;
  return adminConfig.bannedUsernames.includes(key);
}

function isIpBlocked(ip) {
  const value = normalizeIp(ip);
  if (!value || value === "unknown") return false;
  return adminConfig.bannedIps.includes(value);
}

function getPublicRuntimeConfig() {
  return {
    announcement: {
      active: adminConfig.announcement.active,
      message: adminConfig.announcement.message,
      updatedAt: adminConfig.announcement.updatedAt
    },
    live: {
      freeplayEnabled: adminConfig.live.freeplayEnabled,
      bonusOfferChance: adminConfig.live.bonusOfferChance,
      bonusWinChance: adminConfig.live.bonusWinChance
    },
    giveaway: {
      showComingSoon: adminConfig.live.showGiveaway,
      eyebrow: adminConfig.live.giveawayEyebrow,
      title: adminConfig.live.giveawayTitle,
      teaser: adminConfig.live.giveawayTeaser
    }
  };
}

function getDefaultLeaderboardRole() {
  return adminConfig.defaultLeaderboardRole || DEFAULT_ADMIN_CONFIG.defaultLeaderboardRole;
}

function getCustomLeaderboardRole(name) {
  const key = usernameKey(name);
  if (!key) return "";
  return adminConfig.leaderboardRoles[key] || "";
}

function getLeaderboardRole(name) {
  const custom = getCustomLeaderboardRole(name);
  if (custom) return custom;
  return getDefaultLeaderboardRole();
}

function setPlayerLeaderboardRole(name, role) {
  const key = usernameKey(name);
  if (!key) {
    return { ok: false, error: "Enter a valid player name." };
  }

  const value = sanitizeText(role, 24);
  if (!value) {
    delete adminConfig.leaderboardRoles[key];
  } else {
    adminConfig.leaderboardRoles[key] = value;
  }

  saveAdminConfig();
  return {
    ok: true,
    usernameKey: key,
    role: getLeaderboardRole(name),
    customRole: getCustomLeaderboardRole(name)
  };
}

function getAdminConfigSnapshot() {
  return {
    announcement: { ...adminConfig.announcement },
    live: { ...adminConfig.live },
    bannedUsernames: [...adminConfig.bannedUsernames],
    bannedIps: [...adminConfig.bannedIps],
    defaultLeaderboardRole: getDefaultLeaderboardRole(),
    leaderboardRoles: { ...adminConfig.leaderboardRoles },
    appliedSkillPointGrants: [...adminConfig.appliedSkillPointGrants],
    reservedBlockedUsernames: [...DEFAULT_BLOCKED_USERNAMES]
  };
}

function hasAppliedSkillPointGrant(grantId) {
  const id = String(grantId || "").trim().slice(0, 64);
  if (!id) return false;
  return adminConfig.appliedSkillPointGrants.includes(id);
}

function markSkillPointGrantApplied(grantId) {
  const id = String(grantId || "").trim().slice(0, 64);
  if (!id || adminConfig.appliedSkillPointGrants.includes(id)) return false;
  adminConfig.appliedSkillPointGrants.push(id);
  saveAdminConfig();
  return true;
}

function updateAnnouncement(patch) {
  const message = sanitizeText(patch?.message, 240);
  adminConfig.announcement = {
    active: Boolean(patch?.active) && message.length > 0,
    message,
    updatedAt: Date.now()
  };
  saveAdminConfig();
  return adminConfig.announcement;
}

function updateLiveSettings(patch) {
  if (!patch || typeof patch !== "object") return adminConfig.live;

  if (patch.giveawayEyebrow !== undefined) {
    adminConfig.live.giveawayEyebrow =
      sanitizeText(patch.giveawayEyebrow, 48) || DEFAULT_ADMIN_CONFIG.live.giveawayEyebrow;
  }
  if (patch.giveawayTitle !== undefined) {
    adminConfig.live.giveawayTitle =
      sanitizeText(patch.giveawayTitle, 80) || DEFAULT_ADMIN_CONFIG.live.giveawayTitle;
  }
  if (patch.giveawayTeaser !== undefined) {
    adminConfig.live.giveawayTeaser =
      sanitizeText(patch.giveawayTeaser, 160) || DEFAULT_ADMIN_CONFIG.live.giveawayTeaser;
  }
  if (patch.showGiveaway !== undefined) {
    adminConfig.live.showGiveaway = Boolean(patch.showGiveaway);
  }
  if (patch.bonusOfferChance !== undefined) {
    adminConfig.live.bonusOfferChance = clampPercent(
      patch.bonusOfferChance,
      adminConfig.live.bonusOfferChance
    );
  }
  if (patch.bonusWinChance !== undefined) {
    adminConfig.live.bonusWinChance = clampPercent(
      patch.bonusWinChance,
      adminConfig.live.bonusWinChance
    );
  }
  if (patch.freeplayEnabled !== undefined) {
    adminConfig.live.freeplayEnabled = Boolean(patch.freeplayEnabled);
  }
  if (patch.defaultLeaderboardRole !== undefined) {
    adminConfig.defaultLeaderboardRole =
      sanitizeText(patch.defaultLeaderboardRole, 24) || DEFAULT_ADMIN_CONFIG.defaultLeaderboardRole;
  }

  saveAdminConfig();
  return adminConfig.live;
}

function banUsername(name) {
  const key = usernameKey(name);
  if (!key || key === GAME_ADMIN_USERNAME_KEY) {
    return { ok: false, error: "This account cannot be banned." };
  }
  if (!adminConfig.bannedUsernames.includes(key)) {
    adminConfig.bannedUsernames.push(key);
    adminConfig.bannedUsernames.sort();
    saveAdminConfig();
  }
  return { ok: true, usernameKey: key };
}

function unbanUsername(name) {
  const key = usernameKey(name);
  adminConfig.bannedUsernames = adminConfig.bannedUsernames.filter((entry) => entry !== key);
  saveAdminConfig();
  return { ok: true, usernameKey: key };
}

function banIp(ip) {
  const value = normalizeIp(ip);
  if (!value) return { ok: false, error: "Enter a valid IP address." };
  if (!adminConfig.bannedIps.includes(value)) {
    adminConfig.bannedIps.push(value);
    adminConfig.bannedIps.sort();
    saveAdminConfig();
  }
  return { ok: true, ip: value };
}

function unbanIp(ip) {
  const value = normalizeIp(ip);
  adminConfig.bannedIps = adminConfig.bannedIps.filter((entry) => entry !== value);
  saveAdminConfig();
  return { ok: true, ip: value };
}

function ensureAdminConfigFile() {
  if (!adminConfig) {
    adminConfig = normalizeAdminConfig(DEFAULT_ADMIN_CONFIG);
    saveAdminConfig();
  }
}

module.exports = {
  DEFAULT_BLOCKED_USERNAMES,
  banIp,
  banUsername,
  ensureAdminConfigFile,
  getAdminConfig,
  getAdminConfigSnapshot,
  getCustomLeaderboardRole,
  getDefaultLeaderboardRole,
  getLeaderboardRole,
  getPublicRuntimeConfig,
  getReservedBlockedUsernames,
  isGameAdminName,
  isIpBlocked,
  isUsernameBlocked,
  hasAppliedSkillPointGrant,
  loadAdminConfig,
  markSkillPointGrantApplied,
  saveAdminConfig,
  setPlayerLeaderboardRole,
  unbanIp,
  unbanUsername,
  updateAnnouncement,
  updateLiveSettings
};
