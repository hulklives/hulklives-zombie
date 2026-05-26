const SKILL_POINT_KILL_INTERVAL = 5;
const WAVE_BOSS_SP_REWARD = 30;
const WEAPON_UNLOCK_COSTS = { pistol: 0, smg: 50, shotgun: 100, rifle: 150 };
const WEAPON_IDS = ["pistol", "smg", "shotgun", "rifle"];
const ACHIEVEMENT_IDS = new Set([
  "w10",
  "w25",
  "w50",
  "w75",
  "w100",
  "k500",
  "k2000",
  "k5000",
  "lvl30",
  "lvl50"
]);

const MAX_KILLS_PER_SAVE = 250;
const MAX_WAVE_JUMP_PER_SAVE = 3;
const MAX_SAVE_BODY_BYTES = 32 * 1024;

function clampInt(value, min, max) {
  const n = Math.floor(Number(value) || 0);
  return Math.min(max, Math.max(min, n));
}

function normalizeNickname(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function validateNickname(value) {
  const name = normalizeNickname(value);
  if (name.length < 2) return "Nickname must be at least 2 characters.";
  if (name.length > 16) return "Nickname must be at most 16 characters.";
  if (!/^[a-zA-Z0-9 _\-åäöÅÄÖ]+$/.test(name)) {
    return "Use only letters, numbers, spaces, - or _.";
  }
  return "";
}

function getTotalWeaponLevels(weaponLevels = {}) {
  return WEAPON_IDS.reduce(
    (sum, id) => sum + clampInt(weaponLevels[id], 0, 999999),
    0
  );
}

function computeSpentSkillPoints(data) {
  const upgrades = data.upgrades || {};
  const weaponLevels = data.weaponLevels || {};
  const unlocked = new Set(Array.isArray(data.unlockedWeapons) ? data.unlockedWeapons : ["pistol"]);
  unlocked.add("pistol");

  let spent = clampInt(upgrades.hp, 0, 999999);
  spent += clampInt(upgrades.bulletSpeed, 0, 999999);
  spent += getTotalWeaponLevels(weaponLevels);

  for (const weaponId of WEAPON_IDS) {
    if (weaponId !== "pistol" && unlocked.has(weaponId)) {
      spent += WEAPON_UNLOCK_COSTS[weaponId] || 0;
    }
  }

  const legacyDamage = clampInt(upgrades.damage, 0, 999999);
  if (legacyDamage > 0) {
    spent += Math.max(0, legacyDamage - clampInt(weaponLevels.pistol, 0, 999999));
  }

  return spent;
}

function computeTheoreticalMaxEarnedSkillPoints(kills, bestWave) {
  const k = clampInt(kills, 0, 999999999);
  const w = clampInt(bestWave, 0, 999999);

  const fromKills = Math.floor(k / SKILL_POINT_KILL_INTERVAL);
  const legacyKillSp = Math.floor(k / 10);
  const fromBosses = Math.floor(w / 10) * WAVE_BOSS_SP_REWARD;
  const fromEvents = w * 8;
  const starterBuffer = 20;

  return fromKills + legacyKillSp + fromBosses + fromEvents + starterBuffer;
}

function getAdminSkillPointBonus(data) {
  return clampInt(data?.adminSpBonus, 0, 999999999);
}

function getDailySkillPointBonus(data) {
  return clampInt(data?.dailySpBonus, 0, 999999999);
}

function computeSkillPointBudget(existing, merged) {
  const existingSpent = computeSpentSkillPoints(existing);
  const existingHeld = clampInt(existing.skillPoints, 0, 999999999);
  const theoretical = computeTheoreticalMaxEarnedSkillPoints(merged.kills, merged.bestWave);
  const adminBonus = Math.max(getAdminSkillPointBonus(existing), getAdminSkillPointBonus(merged));
  const dailyBonus = Math.max(getDailySkillPointBonus(existing), getDailySkillPointBonus(merged));

  return (
    Math.max(Math.ceil(theoretical * 1.6), existingSpent + existingHeld + 100) + adminBonus + dailyBonus
  );
}

function computeMaxTotalXp(kills, bestWave) {
  const k = clampInt(kills, 0, 999999999);
  const w = clampInt(bestWave, 0, 999999);
  return k * 45 + Math.floor(w / 10) * 450 + w * 15 + 2000;
}

function filterValidAchievements(list, data) {
  const kills = clampInt(data.kills, 0, 999999999);
  const bestWave = clampInt(data.bestWave, 0, 999999999);
  const level = getLevelFromXp(data.totalXp);

  const rules = {
    w10: bestWave >= 10,
    w25: bestWave >= 25,
    w50: bestWave >= 50,
    w75: bestWave >= 75,
    w100: bestWave >= 100,
    k500: kills >= 500,
    k2000: kills >= 2000,
    k5000: kills >= 5000,
    lvl30: level >= 30,
    lvl50: level >= 50
  };

  return [...new Set(Array.isArray(list) ? list : [])].filter(
    (id) => ACHIEVEMENT_IDS.has(id) && rules[id]
  );
}

function sanitizeWeaponState(data) {
  const unlocked = new Set(["pistol"]);
  const incoming = Array.isArray(data.unlockedWeapons) ? data.unlockedWeapons : [];
  for (const weaponId of incoming) {
    if (WEAPON_IDS.includes(weaponId)) unlocked.add(weaponId);
  }

  const weaponLevels = { pistol: 0, smg: 0, shotgun: 0, rifle: 0 };
  for (const weaponId of WEAPON_IDS) {
    weaponLevels[weaponId] = clampInt(data.weaponLevels?.[weaponId], 0, 999999);
  }

  const legacyDamage = clampInt(data.upgrades?.damage, 0, 999999);
  if (legacyDamage > weaponLevels.pistol) {
    weaponLevels.pistol = legacyDamage;
  }

  let equipped = String(data.equippedWeaponId || "pistol");
  if (!unlocked.has(equipped)) equipped = "pistol";

  return { unlockedWeapons: [...unlocked], weaponLevels, equippedWeaponId: equipped };
}

function sanitizeMonthlyProgress(raw, kills) {
  if (!raw || typeof raw !== "object") {
    return { monthKey: "", kills: 0 };
  }

  return {
    monthKey: String(raw.monthKey || "").slice(0, 16),
    kills: clampInt(raw.kills, 0, clampInt(kills, 0, 999999999))
  };
}

function sanitizeDailyProgressFields(raw) {
  const counters = {
    runKillsBest: 0,
    runWaveBest: 0,
    waveBossKills: 0,
    eliteKills: 0,
    runKillsTotal: 0,
    wavesCleared: 0
  };
  const source = raw?.counters && typeof raw.counters === "object" ? raw.counters : {};
  for (const key of Object.keys(counters)) {
    counters[key] = clampInt(source[key], 0, 999999999);
  }

  return {
    dayKey: String(raw?.dayKey || "").slice(0, 10),
    counters,
    claimed: [
      ...new Set(
        (Array.isArray(raw?.claimed) ? raw.claimed : []).map((id) => String(id).slice(0, 24))
      )
    ].slice(0, 12)
  };
}

function sanitizeSaveShape(data) {
  const weapons = sanitizeWeaponState(data);
  const kills = clampInt(data.kills, 0, 999999999);
  const bestWave = clampInt(data.bestWave, 0, 999999999);
  const totalXp = clampInt(data.totalXp, 0, computeMaxTotalXp(kills, bestWave));
  const skillPoints = clampInt(data.skillPoints, 0, 999999999);
  const maxHp = 500 + 50 * clampInt(data.upgrades?.hp, 0, 999999);

  const sanitized = {
    kills,
    score: clampInt(data.score, 0, kills * 20),
    bestWave,
    skillPoints,
    adminSpBonus: getAdminSkillPointBonus(data),
    nextSkillPointKill: clampInt(data.nextSkillPointKill, SKILL_POINT_KILL_INTERVAL, 999999999),
    totalXp,
    hp: clampInt(data.hp, 0, maxHp),
    upgrades: {
      hp: clampInt(data.upgrades?.hp, 0, 999999),
      damage: clampInt(data.upgrades?.damage, 0, 999999),
      bulletSpeed: clampInt(data.upgrades?.bulletSpeed, 0, 999999)
    },
    unlockedAchievements: filterValidAchievements(data.unlockedAchievements, {
      kills,
      bestWave,
      totalXp
    }),
    monthlyProgress: sanitizeMonthlyProgress(data.monthlyProgress, kills),
    dailyProgress: sanitizeDailyProgressFields(data.dailyProgress),
    dailySpBonus: getDailySkillPointBonus(data),
    completedMonthlyAchievements: [
      ...new Set(
        (Array.isArray(data.completedMonthlyAchievements)
          ? data.completedMonthlyAchievements
          : []
        ).map((id) => String(id).slice(0, 32))
      )
    ].slice(0, 24),
    unlockedWeapons: weapons.unlockedWeapons,
    equippedWeaponId: weapons.equippedWeaponId,
    weaponLevels: weapons.weaponLevels,
    lastPlayed: Date.now()
  };

  if (sanitized.score < kills * 10) {
    sanitized.score = kills * 10;
  }

  return sanitized;
}

function isSavePlausible(existing, merged) {
  const ex = existing && typeof existing === "object" ? existing : {};
  const prevKills = clampInt(ex.kills, 0, 999999999);
  const prevWave = clampInt(ex.bestWave, 0, 999999999);
  const prevXp = clampInt(ex.totalXp, 0, 999999999);

  if (merged.kills < prevKills) return false;
  if (merged.kills > prevKills + MAX_KILLS_PER_SAVE) return false;

  if (merged.bestWave < prevWave) return false;
  if (merged.bestWave > prevWave + MAX_WAVE_JUMP_PER_SAVE) return false;

  if (merged.totalXp < prevXp) return false;
  if (merged.totalXp > computeMaxTotalXp(merged.kills, merged.bestWave)) return false;

  const budget = computeSkillPointBudget(ex, merged);
  const spent = computeSpentSkillPoints(merged);
  const held = clampInt(merged.skillPoints, 0, 999999999);
  if (spent + held > budget) return false;

  const weapons = sanitizeWeaponState(merged);
  for (const weaponId of WEAPON_IDS) {
    if (weaponId !== "pistol" && weapons.weaponLevels[weaponId] > 0 && !weapons.unlockedWeapons.includes(weaponId)) {
      return false;
    }
  }

  if (merged.kills < merged.bestWave * 4 && merged.bestWave > 5) return false;

  return true;
}

function mergePlayerSaveSecure(existing, incoming) {
  const ex = existing && typeof existing === "object" ? existing : {};
  const inc = incoming && typeof incoming === "object" ? incoming : {};

  const merged = {
    kills: Math.max(clampInt(ex.kills, 0, 999999999), clampInt(inc.kills, 0, 999999999)),
    score: Math.max(clampInt(ex.score, 0, 999999999), clampInt(inc.score, 0, 999999999)),
    bestWave: Math.max(clampInt(ex.bestWave, 0, 999999999), clampInt(inc.bestWave, 0, 999999999)),
    skillPoints: clampInt(inc.skillPoints, 0, 999999999),
    adminSpBonus: Math.max(getAdminSkillPointBonus(ex), getAdminSkillPointBonus(inc)),
    dailySpBonus: getDailySkillPointBonus(ex),
    nextSkillPointKill: Math.max(
      clampInt(ex.nextSkillPointKill, SKILL_POINT_KILL_INTERVAL, 999999999),
      clampInt(inc.nextSkillPointKill, SKILL_POINT_KILL_INTERVAL, 999999999)
    ),
    totalXp: Math.max(clampInt(ex.totalXp, 0, 999999999), clampInt(inc.totalXp, 0, 999999999)),
    hp: inc.hp !== undefined && inc.hp !== null ? clampInt(inc.hp, 0, 999999999) : ex.hp,
    upgrades: {
      hp: Math.max(clampInt(ex.upgrades?.hp, 0, 999999), clampInt(inc.upgrades?.hp, 0, 999999)),
      damage: Math.max(clampInt(ex.upgrades?.damage, 0, 999999), clampInt(inc.upgrades?.damage, 0, 999999)),
      bulletSpeed: Math.max(
        clampInt(ex.upgrades?.bulletSpeed, 0, 999999),
        clampInt(inc.upgrades?.bulletSpeed, 0, 999999)
      )
    },
    unlockedAchievements: [
      ...new Set([
        ...(Array.isArray(ex.unlockedAchievements) ? ex.unlockedAchievements : []),
        ...(Array.isArray(inc.unlockedAchievements) ? inc.unlockedAchievements : [])
      ])
    ],
    monthlyProgress: mergeMonthlyProgressForServer(ex, inc),
    dailyProgress: sanitizeDailyProgressFields(ex.dailyProgress),
    completedMonthlyAchievements: [
      ...new Set([
        ...(Array.isArray(ex.completedMonthlyAchievements) ? ex.completedMonthlyAchievements : []),
        ...(Array.isArray(inc.completedMonthlyAchievements) ? inc.completedMonthlyAchievements : [])
      ])
    ],
    unlockedWeapons: [
      ...new Set([
        "pistol",
        ...(Array.isArray(ex.unlockedWeapons) ? ex.unlockedWeapons : []),
        ...(Array.isArray(inc.unlockedWeapons) ? inc.unlockedWeapons : [])
      ])
    ],
    equippedWeaponId: inc.equippedWeaponId || ex.equippedWeaponId || "pistol",
    weaponLevels: (() => {
      const result = { pistol: 0, smg: 0, shotgun: 0, rifle: 0 };
      for (const weaponId of WEAPON_IDS) {
        result[weaponId] = Math.max(
          clampInt(ex.weaponLevels?.[weaponId], 0, 999999),
          clampInt(inc.weaponLevels?.[weaponId], 0, 999999)
        );
      }
      const legacyDamage = Math.max(
        clampInt(ex.upgrades?.damage, 0, 999999),
        clampInt(inc.upgrades?.damage, 0, 999999)
      );
      if (legacyDamage > result.pistol) result.pistol = legacyDamage;
      return result;
    })(),
    lastPlayed: Date.now()
  };

  if (!isSavePlausible(ex, merged)) {
    return { ok: false, reason: "progression" };
  }

  return { ok: true, data: sanitizeSaveShape(merged) };
}

function mergeMonthlyProgressForServer(existing, incoming) {
  const ex = existing && typeof existing === "object" ? existing : {};
  const inProg = incoming?.monthlyProgress;
  const exProg = ex.monthlyProgress;

  if (!inProg || typeof inProg !== "object") {
    return exProg || { monthKey: "", kills: 0 };
  }

  if (!exProg || exProg.monthKey !== inProg.monthKey) {
    return sanitizeMonthlyProgress(inProg, incoming.kills);
  }

  return {
    monthKey: String(inProg.monthKey || "").slice(0, 16),
    kills: Math.max(
      clampInt(exProg.kills, 0, 999999999),
      clampInt(inProg.kills, 0, clampInt(incoming.kills, 0, 999999999))
    )
  };
}

function getXpForNextLevel(level) {
  if (level < 10) return 280 + level * 40;
  if (level < 25) return 680 + (level - 10) * 95;
  if (level < 50) return 2150 + (level - 25) * 175;
  return 6500 + (level - 50) * 255;
}

function getLevelFromXp(totalXp) {
  let level = 1;
  let xp = Math.max(0, Number(totalXp || 0));
  while (level < 500 && xp >= getXpForNextLevel(level)) {
    xp -= getXpForNextLevel(level);
    level++;
  }
  return level;
}

function createRateLimiter({ windowMs = 60_000, maxRequests = 40 } = {}) {
  const hits = new Map();

  return function rateLimit(key) {
    const now = Date.now();
    const bucket = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    hits.set(key, bucket);

    if (hits.size > 5000) {
      for (const [entryKey, entry] of hits) {
        if (now > entry.resetAt) hits.delete(entryKey);
      }
    }

    return bucket.count <= maxRequests;
  };
}

function repairSaveIntegrity(data) {
  const sanitized = sanitizeSaveShape(data);
  if (isSavePlausible(sanitized, sanitized)) return sanitized;

  const budget = computeSkillPointBudget(sanitized, sanitized);
  const spent = computeSpentSkillPoints(sanitized);
  sanitized.skillPoints = Math.max(0, Math.min(sanitized.skillPoints, budget - spent));

  const repaired = sanitizeSaveShape(sanitized);
  return isSavePlausible(repaired, repaired) ? repaired : sanitizeSaveShape({});
}

module.exports = {
  ACHIEVEMENT_IDS,
  MAX_SAVE_BODY_BYTES,
  WEAPON_IDS,
  clampInt,
  computeSkillPointBudget,
  getAdminSkillPointBonus,
  getDailySkillPointBonus,
  computeSpentSkillPoints,
  createRateLimiter,
  filterValidAchievements,
  getLevelFromXp,
  getXpForNextLevel,
  isSavePlausible,
  mergePlayerSaveSecure,
  normalizeNickname,
  repairSaveIntegrity,
  sanitizeSaveShape,
  validateNickname
};
