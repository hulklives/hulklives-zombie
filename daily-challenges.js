const {
  clampInt,
  getAdminSkillPointBonus,
  isSavePlausible,
  sanitizeSaveShape
} = require("./save-validation");

const DAILY_CHALLENGE_POOL = {
  easy: [
    { id: "ek25", type: "runKillsBest", target: 25, rewardSp: 10, name: "Warm Up", desc: "Get 25 kills in one run", emoji: "💀" },
    { id: "ek40", type: "runKillsBest", target: 40, rewardSp: 12, name: "Horde Starter", desc: "Get 40 kills in one run", emoji: "☠️" },
    { id: "ek55", type: "runKillsBest", target: 55, rewardSp: 14, name: "Kill Streak", desc: "Get 55 kills in one run", emoji: "🎯" },
    { id: "ew5", type: "runWaveBest", target: 5, rewardSp: 10, name: "First Steps", desc: "Reach wave 5 in one run", emoji: "🌊" },
    { id: "ew8", type: "runWaveBest", target: 8, rewardSp: 12, name: "Survivor", desc: "Reach wave 8 in one run", emoji: "🛡️" },
    { id: "ew10", type: "runWaveBest", target: 10, rewardSp: 14, name: "Double Digits", desc: "Reach wave 10 in one run", emoji: "🔟" }
  ],
  medium: [
    { id: "mk75", type: "runKillsBest", target: 75, rewardSp: 20, name: "Slayer", desc: "Get 75 kills in one run", emoji: "⚔️" },
    { id: "mk100", type: "runKillsBest", target: 100, rewardSp: 22, name: "Sharp Shooter", desc: "Get 100 kills in one run", emoji: "🔫" },
    { id: "mw15", type: "runWaveBest", target: 15, rewardSp: 20, name: "Wave Hunter", desc: "Reach wave 15 in one run", emoji: "🌊" },
    { id: "mw18", type: "runWaveBest", target: 18, rewardSp: 22, name: "Going Deep", desc: "Reach wave 18 in one run", emoji: "📈" },
    { id: "mb2", type: "waveBossKills", target: 2, rewardSp: 22, name: "Boss Breaker", desc: "Defeat 2 wave bosses today", emoji: "👹" },
    { id: "mb3", type: "waveBossKills", target: 3, rewardSp: 25, name: "Boss Buster", desc: "Defeat 3 wave bosses today", emoji: "💀" },
    { id: "me8", type: "eliteKills", target: 8, rewardSp: 18, name: "Elite Hunter", desc: "Defeat 8 elite zombies today", emoji: "💜" },
    { id: "me12", type: "eliteKills", target: 12, rewardSp: 20, name: "Elite Slayer", desc: "Defeat 12 elite zombies today", emoji: "🟣" },
    { id: "mt120", type: "runKillsTotal", target: 120, rewardSp: 22, name: "Grinder", desc: "Get 120 kills total today", emoji: "🔥" }
  ],
  hard: [
    { id: "hw20", type: "runWaveBest", target: 20, rewardSp: 28, name: "Iron Will", desc: "Reach wave 20 in one run", emoji: "💚" },
    { id: "hw25", type: "runWaveBest", target: 25, rewardSp: 35, name: "Deep Run", desc: "Reach wave 25 in one run", emoji: "🏆" },
    { id: "hw30", type: "runWaveBest", target: 30, rewardSp: 40, name: "Endurance", desc: "Reach wave 30 in one run", emoji: "👑" },
    { id: "hk150", type: "runKillsBest", target: 150, rewardSp: 30, name: "Massacre", desc: "Get 150 kills in one run", emoji: "💥" },
    { id: "hk200", type: "runKillsBest", target: 200, rewardSp: 35, name: "Annihilation", desc: "Get 200 kills in one run", emoji: "☢️" },
    { id: "hb4", type: "waveBossKills", target: 4, rewardSp: 35, name: "Boss Rampage", desc: "Defeat 4 wave bosses today", emoji: "👹" },
    { id: "hb5", type: "waveBossKills", target: 5, rewardSp: 40, name: "Boss Legend", desc: "Defeat 5 wave bosses today", emoji: "🔥" },
    { id: "mt250", type: "runKillsTotal", target: 250, rewardSp: 32, name: "All Day Slayer", desc: "Get 250 kills total today", emoji: "⚡" }
  ]
};

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDayResetAt(dayKey) {
  const reset = new Date(`${dayKey}T00:00:00.000Z`);
  reset.setUTCDate(reset.getUTCDate() + 1);
  return reset.toISOString();
}

function emptyDailyCounters() {
  return {
    runKillsBest: 0,
    runWaveBest: 0,
    waveBossKills: 0,
    eliteKills: 0,
    runKillsTotal: 0,
    wavesCleared: 0
  };
}

function sanitizeDailyProgress(raw, dayKey = getDayKey()) {
  const counters = emptyDailyCounters();
  const source = raw?.counters && typeof raw.counters === "object" ? raw.counters : {};
  for (const key of Object.keys(counters)) {
    counters[key] = clampInt(source[key], 0, 999999999);
  }

  const claimed = [
    ...new Set(
      (Array.isArray(raw?.claimed) ? raw.claimed : []).map((id) => String(id).slice(0, 24))
    )
  ].slice(0, 12);

  return {
    dayKey: String(raw?.dayKey || dayKey).slice(0, 10) || dayKey,
    counters,
    claimed
  };
}

function ensureDailyProgressCurrent(progress, dayKey = getDayKey()) {
  const current = sanitizeDailyProgress(progress, dayKey);
  if (current.dayKey === dayKey) return current;
  return { dayKey, counters: emptyDailyCounters(), claimed: [] };
}

function getDailySkillPointBonus(data) {
  return clampInt(data?.dailySpBonus, 0, 999999999);
}

function pickChallenge(pool, seed, excludeIds = new Set()) {
  const available = pool.filter((entry) => !excludeIds.has(entry.id));
  const list = available.length ? available : pool;
  return list[seed % list.length];
}

function getDailyChallengesForDay(dayKey = getDayKey()) {
  const seed = hashString(dayKey);
  const easy = pickChallenge(DAILY_CHALLENGE_POOL.easy, seed);
  const medium = pickChallenge(DAILY_CHALLENGE_POOL.medium, seed >>> 8, new Set([easy.id]));
  const hard = pickChallenge(DAILY_CHALLENGE_POOL.hard, seed >>> 16, new Set([easy.id, medium.id]));
  return [easy, medium, hard];
}

function getProgressValue(counters, type) {
  return clampInt(counters?.[type], 0, 999999999);
}

function isChallengeComplete(challenge, counters) {
  return getProgressValue(counters, challenge.type) >= challenge.target;
}

function buildDailyChallengeView(challenge, progress, counters) {
  const current = getProgressValue(counters, challenge.type);
  const complete = current >= challenge.target;
  const claimed = progress.claimed.includes(challenge.id);
  return {
    ...challenge,
    current,
    complete,
    claimed,
    claimable: complete && !claimed,
    progressPct: Math.min(100, Math.round((current / Math.max(1, challenge.target)) * 100))
  };
}

function buildDailyChallengePayload(save, dayKey = getDayKey()) {
  const progress = ensureDailyProgressCurrent(save?.dailyProgress, dayKey);
  const challenges = getDailyChallengesForDay(dayKey).map((challenge) =>
    buildDailyChallengeView(challenge, progress, progress.counters)
  );

  return {
    dayKey,
    resetsAt: getDayResetAt(dayKey),
    challenges,
    progress,
    completedCount: challenges.filter((entry) => entry.claimed).length,
    claimableCount: challenges.filter((entry) => entry.claimable).length
  };
}

function validateRunSnapshot(snapshot) {
  const runKills = clampInt(snapshot?.runKills, 0, 250);
  const runBestWave = clampInt(snapshot?.runBestWave, 0, 999);
  const waveBossKills = clampInt(snapshot?.waveBossKills, 0, 50);
  const eliteKills = clampInt(snapshot?.eliteKills, 0, 500);
  const wavesCleared = clampInt(snapshot?.wavesCleared, 0, 999);

  if (runKills > runBestWave * 60 + 80) return null;
  if (waveBossKills > Math.floor(runBestWave / 8) + 2) return null;
  if (eliteKills > runKills) return null;
  if (wavesCleared > runBestWave + 1) return null;

  return { runKills, runBestWave, waveBossKills, eliteKills, wavesCleared };
}

function mergeRunIntoDailyProgress(progress, snapshot, dayKey = getDayKey()) {
  const current = ensureDailyProgressCurrent(progress, dayKey);
  const run = validateRunSnapshot(snapshot);
  if (!run) return { ok: false, error: "Invalid run stats." };

  current.counters.runKillsBest = Math.max(current.counters.runKillsBest, run.runKills);
  current.counters.runWaveBest = Math.max(current.counters.runWaveBest, run.runBestWave);
  current.counters.waveBossKills += run.waveBossKills;
  current.counters.eliteKills += run.eliteKills;
  current.counters.runKillsTotal += run.runKills;
  current.counters.wavesCleared += run.wavesCleared;

  return { ok: true, progress: current, run };
}

function claimDailyChallenge(save, challengeId, dayKey = getDayKey()) {
  const progress = ensureDailyProgressCurrent(save?.dailyProgress, dayKey);
  const challenge = getDailyChallengesForDay(dayKey).find((entry) => entry.id === challengeId);
  if (!challenge) return { ok: false, error: "Challenge not found today." };
  if (progress.claimed.includes(challengeId)) return { ok: false, error: "Already claimed." };
  if (!isChallengeComplete(challenge, progress.counters)) {
    return { ok: false, error: "Challenge not completed yet." };
  }

  progress.claimed = [...progress.claimed, challengeId];
  const rewardSp = clampInt(challenge.rewardSp, 1, 999);
  const nextSave = {
    ...save,
    skillPoints: clampInt(save?.skillPoints, 0, 999999999) + rewardSp,
    dailySpBonus: getDailySkillPointBonus(save) + rewardSp,
    dailyProgress: progress
  };

  const sanitized = sanitizeSaveShape(nextSave);
  if (!isSavePlausible(save || {}, sanitized)) {
    return { ok: false, error: "Could not grant reward." };
  }

  return {
    ok: true,
    save: sanitized,
    grantedSp: rewardSp,
    message: `+${rewardSp} SP claimed!`
  };
}

module.exports = {
  buildDailyChallengePayload,
  claimDailyChallenge,
  ensureDailyProgressCurrent,
  getDailyChallengesForDay,
  getDailySkillPointBonus,
  getDayKey,
  getDayResetAt,
  mergeRunIntoDailyProgress,
  sanitizeDailyProgress
};
