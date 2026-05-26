const DAILY_POLL_MS = 60000;

let dailyState = null;
let dailyBusy = false;
let dailyPollTimer = null;
let dailyReady = false;

function escapeDailyHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getDailyAuthFetch() {
  if (typeof authFetch === "function") return authFetch;
  if (typeof window.authFetch === "function") return window.authFetch;
  return null;
}

function hasDailyAuth() {
  if (typeof refreshAuthTokenFromStorage === "function") refreshAuthTokenFromStorage();
  if (typeof getGameAuthToken === "function" && getGameAuthToken()) return true;
  return Boolean(localStorage.getItem("hulkLivesAuthToken"));
}

function formatDailyResetLabel(resetsAt) {
  const target = new Date(resetsAt || Date.now()).getTime();
  const diffMs = Math.max(0, target - Date.now());
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours <= 0 && minutes <= 0) return "New challenges soon";
  if (hours <= 0) return `Resets in ${minutes}m`;
  return `Resets in ${hours}h ${minutes}m`;
}

function updateDailyMenuBadge() {
  const badge = document.getElementById("daily-menu-badge");
  if (!badge || !dailyState) return;
  const claimable = Number(dailyState.claimableCount || 0);
  badge.textContent = String(claimable);
  badge.hidden = claimable <= 0;
}

function renderDailyChallengesModal() {
  const list = document.getElementById("daily-challenges-list");
  const summary = document.getElementById("daily-challenges-summary");
  const resetEl = document.getElementById("daily-challenges-reset");
  if (!list) return;

  if (!dailyState || !Array.isArray(dailyState.challenges)) {
    list.innerHTML = '<div class="daily-challenge-empty">Log in to see today\'s challenges.</div>';
    if (summary) summary.textContent = "Complete 3 daily challenges for bonus skill points.";
    if (resetEl) resetEl.textContent = "";
    return;
  }

  const completed = Number(dailyState.completedCount || 0);
  if (summary) {
    summary.textContent = `${completed}/3 claimed today · Waves Game only`;
  }
  if (resetEl) {
    resetEl.textContent = formatDailyResetLabel(dailyState.resetsAt);
  }

  list.innerHTML = dailyState.challenges
    .map((challenge) => {
      const statusClass = challenge.claimed
        ? " claimed"
        : challenge.claimable
          ? " claimable"
          : challenge.complete
            ? " complete"
            : "";
      const action = challenge.claimed
        ? '<span class="daily-challenge-tag done">Claimed</span>'
        : challenge.claimable
          ? `<button type="button" class="menu-primary-btn daily-claim-btn" onclick="claimDailyChallengeReward('${escapeDailyHtml(challenge.id)}')">Claim +${challenge.rewardSp} SP</button>`
          : `<span class="daily-challenge-tag">${challenge.current}/${challenge.target}</span>`;
      return `<div class="daily-challenge-card${statusClass}">
  <div class="daily-challenge-icon">${escapeDailyHtml(challenge.emoji)}</div>
  <div class="daily-challenge-copy">
    <strong class="daily-challenge-name">${escapeDailyHtml(challenge.name)}</strong>
    <span class="daily-challenge-desc">${escapeDailyHtml(challenge.desc)}</span>
    <div class="daily-challenge-bar"><span style="width:${challenge.progressPct}%"></span></div>
    <span class="daily-challenge-meta">Reward: +${challenge.rewardSp} SP</span>
  </div>
  <div class="daily-challenge-action">${action}</div>
</div>`;
    })
    .join("");

  updateDailyMenuBadge();
}

async function refreshDailyChallenges(force = false) {
  const fetchAuth = getDailyAuthFetch();
  if (!fetchAuth || !hasDailyAuth()) {
    dailyState = null;
    renderDailyChallengesModal();
    updateDailyMenuBadge();
    return;
  }

  try {
    const response = await fetchAuth("/api/daily-challenges");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return;
    dailyState = payload;
    renderDailyChallengesModal();
    updateDailyMenuBadge();
    if (force && payload.claimableCount > 0 && typeof showMilestone === "function") {
      showMilestone(`${payload.claimableCount} daily challenge ready to claim!`);
    }
  } catch (error) {
    // ignore transient errors
  }
}

async function syncDailyRunProgress(runSnapshot) {
  const fetchAuth = getDailyAuthFetch();
  if (!fetchAuth || !hasDailyAuth() || !runSnapshot) return;

  try {
    const response = await fetchAuth("/api/daily-challenges/sync-run", {
      method: "POST",
      body: JSON.stringify({ run: runSnapshot })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return;
    dailyState = payload;
    renderDailyChallengesModal();
    updateDailyMenuBadge();
    if (payload.claimableCount > 0 && typeof showMilestone === "function") {
      showMilestone("Daily challenge complete — claim your SP in Daily!");
    }
    if (Number.isFinite(payload.skillPoints) && typeof player !== "undefined" && player) {
      player.skillPoints = payload.skillPoints;
      if (typeof updateUI === "function") updateUI();
    }
  } catch (error) {
    // ignore
  }
}

async function claimDailyChallengeReward(challengeId) {
  if (dailyBusy) return;
  const fetchAuth = getDailyAuthFetch();
  if (!fetchAuth || !hasDailyAuth()) return;

  dailyBusy = true;
  try {
    const response = await fetchAuth("/api/daily-challenges/claim", {
      method: "POST",
      body: JSON.stringify({ challengeId })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (typeof showMilestone === "function") showMilestone(payload.error || "Could not claim reward.");
      return;
    }
    dailyState = payload;
    renderDailyChallengesModal();
    updateDailyMenuBadge();
    if (Number.isFinite(payload.skillPoints) && typeof player !== "undefined" && player) {
      player.skillPoints = payload.skillPoints;
      if (typeof updateUI === "function") updateUI();
      if (typeof updateShopControls === "function") updateShopControls();
    }
    if (typeof showMilestone === "function") showMilestone(payload.message || "Daily reward claimed!");
  } catch (error) {
    if (typeof showMilestone === "function") showMilestone("Could not claim daily reward.");
  } finally {
    dailyBusy = false;
  }
}

function openDailyChallengesMenu() {
  const modal = document.getElementById("daily-challenges-modal");
  if (!modal) return;
  if (typeof isStartMenuVisible === "function" && isStartMenuVisible()) {
    if (typeof hideStartMenu === "function") hideStartMenu();
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  refreshDailyChallenges(true);
}

function closeDailyChallengesMenu() {
  const modal = document.getElementById("daily-challenges-modal");
  const wasOpen = modal?.classList.contains("open");
  if (modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }
  if (wasOpen && typeof restoreStartMenuAfterModal === "function") {
    restoreStartMenuAfterModal();
  }
}

function resetRunDailyStats() {
  window.runDailyStats = {
    runKills: 0,
    runBestWave: 0,
    waveBossKills: 0,
    eliteKills: 0,
    wavesCleared: 0
  };
}

function registerDailyRunKill(zombie) {
  if (typeof isCampaignMode === "function" && !isCampaignMode()) return;
  if (!window.runDailyStats) resetRunDailyStats();
  window.runDailyStats.runKills = typeof runKills !== "undefined" ? runKills : window.runDailyStats.runKills + 1;
  if (zombie?.tier === "waveBoss" || zombie?.isWaveBoss) {
    window.runDailyStats.waveBossKills += 1;
  }
  if (zombie?.tier && zombie.tier !== "normal") {
    window.runDailyStats.eliteKills += 1;
  }
}

function registerDailyWaveClear(clearedWave) {
  if (typeof isCampaignMode === "function" && !isCampaignMode()) return;
  if (!window.runDailyStats) resetRunDailyStats();
  window.runDailyStats.wavesCleared += 1;
  const waveValue = typeof runBestWave !== "undefined" ? runBestWave : clearedWave;
  window.runDailyStats.runBestWave = Math.max(window.runDailyStats.runBestWave, waveValue, clearedWave);
}

function submitDailyRunProgress() {
  if (typeof isCampaignMode === "function" && !isCampaignMode()) return;
  if (!window.runDailyStats) return;
  const snapshot = {
    runKills: window.runDailyStats.runKills,
    runBestWave: Math.max(window.runDailyStats.runBestWave, typeof runBestWave !== "undefined" ? runBestWave : 0),
    waveBossKills: window.runDailyStats.waveBossKills,
    eliteKills: window.runDailyStats.eliteKills,
    wavesCleared: window.runDailyStats.wavesCleared
  };
  if (snapshot.runKills <= 0 && snapshot.runBestWave <= 0) return;
  syncDailyRunProgress(snapshot);
}

function initDailyChallengesPanel() {
  if (dailyReady) return;
  dailyReady = true;
  resetRunDailyStats();
  if (dailyPollTimer) clearInterval(dailyPollTimer);
  dailyPollTimer = setInterval(() => {
    if (typeof isStartMenuVisible === "function" && isStartMenuVisible()) {
      refreshDailyChallenges(false);
    }
  }, DAILY_POLL_MS);
}

window.resetRunDailyStats = resetRunDailyStats;
window.registerDailyRunKill = registerDailyRunKill;
window.registerDailyWaveClear = registerDailyWaveClear;
window.submitDailyRunProgress = submitDailyRunProgress;
window.refreshDailyChallenges = refreshDailyChallenges;
window.openDailyChallengesMenu = openDailyChallengesMenu;
window.closeDailyChallengesMenu = closeDailyChallengesMenu;
window.claimDailyChallengeReward = claimDailyChallengeReward;
window.initDailyChallengesPanel = initDailyChallengesPanel;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDailyChallengesPanel);
} else {
  initDailyChallengesPanel();
}
