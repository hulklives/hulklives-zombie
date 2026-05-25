let adminPanelOpen = false;
let adminActiveTab = "announcement";
let adminPlayersCache = [];
let adminReportsCache = [];
let adminReportFilter = "open";
let adminStateCache = null;
let adminDefaultLeaderboardRole = "Survivor";

const ADMIN_ROLE_PRESETS = [
  "Survivor",
  "Owner",
  "Moderator",
  "VIP",
  "Creator",
  "Champion",
  "Legend",
  "Beta Tester"
];

function decodeAdminValue(value) {
  if (!value) return "";
  try {
    return decodeURIComponent(String(value));
  } catch (error) {
    return String(value);
  }
}

function encodeAdminValue(value) {
  return encodeURIComponent(String(value || ""));
}

function requireAdminAction() {
  const token =
    typeof window.refreshAuthTokenFromStorage === "function"
      ? window.refreshAuthTokenFromStorage()
      : "";

  if (!token) {
    notifyAdminStatus("Log in as Hulklives to use admin tools.", "error");
    return false;
  }

  if (!window.isGameAdmin) {
    setAdminStatus("Admin session expired — log in again as Hulklives.", "error");
    return false;
  }
  return true;
}

function getAdminErrorMessage(response, payload, fallback) {
  if (response.status === 401) return "You must log in again to save.";
  if (response.status === 403) return "Admin access denied for this account.";
  if (response.status === 404) return "Admin API missing — restart the game server.";
  if (response.status === 429) return "Too many admin requests. Wait a moment.";
  return payload.error || fallback;
}

function handleAdminAuthFailure(message = "You must log in again to save.") {
  notifyAdminStatus(message, "error");
  closeAdminPanel();
  if (typeof window.showAuthScreen === "function") {
    window.showAuthScreen("login");
  }
}

function notifyAdminStatus(message, type = "") {
  setAdminStatus(message, type);
  if (typeof showMilestone === "function" && message) {
    showMilestone(message);
  }
}

function handleAdminPanelClick(event) {
  const playerBtn = event.target.closest("[data-admin-player-action]");
  if (playerBtn) {
    event.preventDefault();
    event.stopPropagation();
    const username = decodeAdminValue(playerBtn.dataset.username);
    const action = playerBtn.dataset.adminPlayerAction || "";
    if (!username || !requireAdminAction()) return;

    if (action === "reset") adminResetPlayerSave(username);
    else if (action === "toggle-lb") {
      adminToggleLeaderboardHidden(username, playerBtn.dataset.hidden === "true");
    } else if (action === "ban") adminBanPlayer(username);
    else if (action === "save-role") adminSetPlayerLeaderboardRole(username, playerBtn);
    else if (action === "clear-role") adminSetPlayerLeaderboardRole(username, null, true);
    else if (action === "grant-sp") adminGrantSkillPoints(username, playerBtn);
    return;
  }

  const reportBtn = event.target.closest("[data-admin-report-action]");
  if (reportBtn) {
    event.preventDefault();
    event.stopPropagation();
    if (!requireAdminAction()) return;
    adminResolveReport(reportBtn.dataset.reportId || "", reportBtn.dataset.resolved === "true");
    return;
  }

  const btn = event.target.closest("[data-admin-action]");
  if (!btn) return;

  event.preventDefault();
  event.stopPropagation();
  if (!requireAdminAction()) return;

  const action = btn.dataset.adminAction || "";
  switch (action) {
    case "close":
      closeAdminPanel();
      break;
    case "tab":
      switchAdminTab(btn.dataset.adminTab || "announcement");
      break;
    case "save-announcement":
      saveAdminAnnouncement();
      break;
    case "save-live":
      saveAdminLiveSettings();
      break;
    case "search-players":
      loadAdminPlayers();
      break;
    case "refresh-players":
      loadAdminPlayers();
      break;
    case "report-filter":
      setAdminReportFilter(btn.dataset.reportFilter || "open");
      break;
    case "refresh-reports":
      loadAdminReports();
      break;
    case "ban-user-form":
      adminBanUsernameFromForm();
      break;
    case "ban-ip-form":
      adminBanIpFromForm();
      break;
    case "unban-user":
      adminUnbanUsername(decodeAdminValue(btn.dataset.username));
      break;
    case "unban-ip":
      adminUnbanIp(decodeAdminValue(btn.dataset.ip));
      break;
    default:
      break;
  }
}

function bindAdminPanelEvents() {
  const modal = document.getElementById("admin-modal");
  const panel = modal?.querySelector(".admin-panel");
  if (!modal || !panel || modal.dataset.adminBound === "1") return;

  modal.dataset.adminBound = "1";
  panel.addEventListener("click", handleAdminPanelClick, true);

  modal.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) closeAdminPanel();
    },
    true
  );

  const searchInput = document.getElementById("admin-player-search");
  if (searchInput && !searchInput.dataset.adminBound) {
    searchInput.dataset.adminBound = "1";
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (requireAdminAction()) loadAdminPlayers();
      }
    });
  }

  if (!panel.dataset.adminRoleBound) {
    panel.dataset.adminRoleBound = "1";
    panel.addEventListener("change", (event) => {
      const select = event.target.closest(".admin-player-role-preset");
      if (!select) return;
      handleAdminRolePresetChange(select);
    });
    panel.addEventListener("keydown", (event) => {
      const input = event.target.closest(".admin-player-role-input");
      if (!input || event.key !== "Enter") return;
      event.preventDefault();
      const username = decodeAdminValue(input.dataset.username);
      if (!username || !requireAdminAction()) return;
      adminSetPlayerLeaderboardRole(username, input.closest(".admin-player-card")?.querySelector("[data-admin-player-action=\"save-role\"]"));
    });
  }
}

function setAdminStatus(message, type = "") {
  const el = document.getElementById("admin-status");
  if (!el) return;
  el.textContent = message || "";
  el.className = type ? `admin-status ${type}` : "admin-status";
}

function updateAdminSaveBar() {
  const bar = document.getElementById("admin-save-bar");
  if (!bar) return;

  if (adminActiveTab === "announcement") {
    bar.innerHTML =
      '<button type="button" class="menu-primary-btn" data-admin-action="save-announcement">Save announcement</button>';
    return;
  }

  if (adminActiveTab === "live") {
    bar.innerHTML =
      '<button type="button" class="menu-primary-btn" data-admin-action="save-live">Save live settings</button>';
    return;
  }

  bar.innerHTML = "";
}

function switchAdminTab(tab) {
  adminActiveTab = tab;
  document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.adminTab === tab);
  });
  document.querySelectorAll(".admin-tab-panel").forEach((panel) => {
    panel.hidden = panel.dataset.adminTab !== tab;
  });
  updateAdminSaveBar();
  if (tab === "players" && adminPanelOpen) {
    loadAdminPlayers();
  }
}

function handleAdminRolePresetChange(select) {
  const card = select.closest(".admin-player-card");
  const input = card?.querySelector(".admin-player-role-input");
  if (!input) return;

  const username = decodeAdminValue(select.dataset.username);
  if (!username) return;

  const value = select.value;
  if (value === "__custom__") {
    input.focus();
    input.select();
    return;
  }

  input.value = value;
  if (!requireAdminAction()) return;

  adminSetPlayerLeaderboardRole(
    username,
    card.querySelector('[data-admin-player-action="save-role"]'),
    value === ""
  );
}

function buildAdminRolePresetSelect(encodedName, customRole) {
  const defaultRole = adminDefaultLeaderboardRole || "Survivor";
  const isCustom = Boolean(customRole) && !ADMIN_ROLE_PRESETS.includes(customRole);

  const presetOptions = ADMIN_ROLE_PRESETS.map((preset) => {
    const selected = customRole === preset ? " selected" : "";
    return `<option value="${escapeHtml(preset)}"${selected}>${escapeHtml(preset)}</option>`;
  }).join("");

  return `<select class="admin-player-role-preset" data-username="${encodedName}" aria-label="Choose role preset">
<option value=""${!customRole ? " selected" : ""}>Default (${escapeHtml(defaultRole)})</option>
${presetOptions}
<option value="__custom__"${isCustom ? " selected" : ""}>Custom text...</option>
</select>`;
}

function fillAdminConfigForms(config) {
  const announcement = config?.announcement || {};
  const live = config?.live || {};

  const announcementActive = document.getElementById("admin-announcement-active");
  const announcementMessage = document.getElementById("admin-announcement-message");
  if (announcementActive) announcementActive.checked = Boolean(announcement.active);
  if (announcementMessage) announcementMessage.value = announcement.message || "";

  const map = [
    ["admin-live-giveaway-eyebrow", live.giveawayEyebrow],
    ["admin-live-giveaway-title", live.giveawayTitle],
    ["admin-live-giveaway-teaser", live.giveawayTeaser],
    ["admin-live-bonus-offer", live.bonusOfferChance],
    ["admin-live-bonus-win", live.bonusWinChance]
  ];
  map.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
  });

  const showGiveaway = document.getElementById("admin-live-show-giveaway");
  const freeplayEnabled = document.getElementById("admin-live-freeplay-enabled");
  const defaultRole = document.getElementById("admin-live-default-role");
  if (showGiveaway) showGiveaway.checked = live.showGiveaway !== false;
  if (freeplayEnabled) freeplayEnabled.checked = live.freeplayEnabled !== false;
  if (defaultRole) {
    defaultRole.value = config?.defaultLeaderboardRole || adminDefaultLeaderboardRole || "Survivor";
  }
  adminDefaultLeaderboardRole = config?.defaultLeaderboardRole || adminDefaultLeaderboardRole || "Survivor";

  renderAdminBanLists(config);
}

function renderAdminBanLists(config) {
  const usersEl = document.getElementById("admin-banned-users");
  const ipsEl = document.getElementById("admin-banned-ips");
  const users = config?.bannedUsernames || [];
  const ips = config?.bannedIps || [];

  if (usersEl) {
    usersEl.innerHTML = users.length
      ? users
          .map(
            (name) =>
              `<span class="admin-ban-chip">${escapeHtml(name)} <button type="button" data-admin-action="unban-user" data-username="${encodeAdminValue(name)}">✕</button></span>`
          )
          .join("")
      : '<span class="admin-empty-note">No banned accounts.</span>';
  }

  if (ipsEl) {
    ipsEl.innerHTML = ips.length
      ? ips
          .map(
            (ip) =>
              `<span class="admin-ban-chip">${escapeHtml(ip)} <button type="button" data-admin-action="unban-ip" data-ip="${encodeAdminValue(ip)}">✕</button></span>`
          )
          .join("")
      : '<span class="admin-empty-note">No banned IPs.</span>';
  }
}

function renderAdminPlayers(players) {
  const list = document.getElementById("admin-players-list");
  const countEl = document.getElementById("admin-players-count");
  if (!list) return;

  adminPlayersCache = players || [];

  if (countEl) {
    countEl.textContent = adminPlayersCache.length
      ? `${adminPlayersCache.length} registered player${adminPlayersCache.length === 1 ? "" : "s"}`
      : "No players loaded";
  }

  if (!adminPlayersCache.length) {
    list.innerHTML = '<div class="lb-empty">No players found.</div>';
    return;
  }

  const defaultRole = adminDefaultLeaderboardRole || "Survivor";

  list.innerHTML = adminPlayersCache
    .map((player) => {
      const tags = [];
      if (player.banned) tags.push("Banned");
      if (player.leaderboardHidden) tags.push("Hidden from LB");
      const tagHtml = tags.length
        ? `<span class="admin-player-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</span>`
        : "";
      const encodedName = encodeAdminValue(player.username || "");
      const hideNext = player.leaderboardHidden ? "false" : "true";
      const hideLabel = player.leaderboardHidden ? "Show on LB" : "Hide from LB";
      const customRole = player.customLeaderboardRole || "";
      const effectiveRole = player.leaderboardRole || defaultRole;
      const roleInputValue = customRole || "";

      return `<article class="admin-player-card">
  <div class="admin-player-head">
    <strong>${escapeHtml(player.username || "")}</strong>
    ${tagHtml}
  </div>
  <div class="admin-player-stats">
    <span class="lb-stat">Lv ${Number(player.level) || 1}</span>
    <span class="lb-stat">W${Number(player.bestWave) || 0}</span>
    <span class="lb-stat">${Number(player.kills) || 0} K</span>
    <span class="lb-stat">${Number(player.skillPoints) || 0} SP</span>
  </div>
  <div class="admin-player-role-row">
    <div class="admin-player-role-current">Leaderboard shows: <strong>${escapeHtml(effectiveRole)}</strong></div>
    <label for="admin-role-${encodedName}">Choose role</label>
    ${buildAdminRolePresetSelect(encodedName, customRole)}
    <label for="admin-role-input-${encodedName}">Or write your own</label>
    <div class="admin-inline-actions admin-player-role-actions">
      <input type="text" id="admin-role-input-${encodedName}" class="admin-player-role-input" maxlength="24" placeholder="${escapeHtml(defaultRole)}" value="${escapeHtml(roleInputValue)}" data-username="${encodedName}">
      <button type="button" class="menu-primary-btn admin-player-save-role" data-admin-player-action="save-role" data-username="${encodedName}">Save role</button>
      <button type="button" class="menu-secondary-btn" data-admin-player-action="clear-role" data-username="${encodedName}">Use default</button>
    </div>
  </div>
  <details class="admin-player-more">
    <summary>Moderation</summary>
    <div class="admin-player-actions">
      <div class="admin-inline-actions admin-player-grant-row">
        <input type="number" id="admin-sp-input-${encodedName}" class="admin-player-sp-input" min="1" max="999999999" step="1" value="30000" data-username="${encodedName}" aria-label="Skill points amount">
        <button type="button" class="menu-primary-btn" data-admin-player-action="grant-sp" data-username="${encodedName}">Set SP</button>
      </div>
      <button type="button" class="menu-secondary-btn" data-admin-player-action="reset" data-username="${encodedName}">Reset save</button>
      <button type="button" class="menu-secondary-btn" data-admin-player-action="toggle-lb" data-username="${encodedName}" data-hidden="${hideNext}">${hideLabel}</button>
      <button type="button" class="menu-secondary-btn danger" data-admin-player-action="ban" data-username="${encodedName}">Ban account</button>
    </div>
  </details>
</article>`;
    })
    .join("");
}

function renderAdminReports(reports) {
  const list = document.getElementById("admin-reports-list");
  if (!list) return;

  adminReportsCache = reports || [];

  if (!adminReportsCache.length) {
    list.innerHTML = '<div class="lb-empty">No reports in this view.</div>';
    return;
  }

  list.innerHTML = adminReportsCache
    .map((report) => {
      const category = report.category || "other";
      const label =
        typeof FEEDBACK_CATEGORY_LABELS !== "undefined"
          ? FEEDBACK_CATEGORY_LABELS[category] || FEEDBACK_CATEGORY_LABELS.other
          : category;
      const context = report.context || {};
      const resolved = Boolean(report.resolved || report.resolvedAt);
      const safeId = escapeHtml(report.id || "");
      return `<article class="feedback-report-card ${escapeHtml(category)} ${resolved ? "resolved" : ""}">
  <div class="feedback-report-head">
    <span class="feedback-report-user">${escapeHtml(report.username || "Unknown")}</span>
    <span class="feedback-report-time">${escapeHtml(formatFeedbackTimestamp(report.createdAt))}</span>
  </div>
  <span class="feedback-report-tag">${escapeHtml(label)}${resolved ? " · Fixed" : ""}</span>
  <p class="feedback-report-message">${escapeHtml(report.message || "")}</p>
  <div class="feedback-report-meta">
    <span class="lb-stat">${escapeHtml(context.page || "unknown location")}</span>
    <span class="lb-stat">Wave ${Number(context.wave) || 0}</span>
    <span class="lb-stat">Lv ${Number(context.level) || 1}</span>
  </div>
  <div class="admin-report-actions">
    <button type="button" class="menu-secondary-btn" data-admin-report-action="1" data-report-id="${safeId}" data-resolved="${resolved ? "false" : "true"}">${resolved ? "Reopen" : "Mark fixed"}</button>
  </div>
</article>`;
    })
    .join("");
}

async function adminFetch(url, options = {}) {
  if (typeof window.refreshAuthTokenFromStorage === "function") {
    window.refreshAuthTokenFromStorage();
  }
  if (typeof authFetch === "function") return authFetch(url, options);
  throw new Error("authFetch unavailable");
}

async function loadAdminState(options = {}) {
  if (!requireAdminAction()) return;

  if (!options.keepStatus) {
    setAdminStatus("Loading admin data...");
  }

  try {
    const response = await adminFetch("/api/admin/state");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        handleAdminAuthFailure("You must log in again to use admin tools.");
        return;
      }
      const fallback =
        response.status === 404
          ? "Admin API missing — restart the game server (node server.js)."
          : response.status === 403
            ? "Admin access denied for this account."
            : "Could not load admin panel.";
      setAdminStatus(payload.error || fallback, "error");
      return;
    }

    adminStateCache = payload;
    fillAdminConfigForms(payload.config || {});
    if (options.successMessage) {
      setAdminStatus(options.successMessage, "success");
    } else if (!options.keepStatus) {
      setAdminStatus(
        `${payload.stats?.playerCount || 0} players · ${payload.stats?.openReports || 0} open reports`
      );
    }
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

async function loadAdminPlayers() {
  if (!requireAdminAction()) return;

  const searchEl = document.getElementById("admin-player-search");
  const search = searchEl ? searchEl.value : "";
  const list = document.getElementById("admin-players-list");
  if (list) list.innerHTML = '<div class="lb-empty">Loading...</div>';

  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await adminFetch(`/api/admin/players${query}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (list) {
        list.innerHTML = `<div class="lb-empty">${escapeHtml(payload.error || "Could not load players.")}</div>`;
      }
      return;
    }
    renderAdminPlayers(payload.players || []);
  } catch (error) {
    if (list) list.innerHTML = '<div class="lb-empty">Could not reach the server.</div>';
  }
}

async function loadAdminReports() {
  if (!requireAdminAction()) return;

  const list = document.getElementById("admin-reports-list");
  if (list) list.innerHTML = '<div class="lb-empty">Loading...</div>';

  try {
    const response = await adminFetch(
      `/api/feedback/inbox?status=${encodeURIComponent(adminReportFilter)}`
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (list) {
        list.innerHTML = `<div class="lb-empty">${escapeHtml(payload.error || "Could not load reports.")}</div>`;
      }
      return;
    }
    renderAdminReports(payload.reports || []);
    if (typeof updateGameAdminUI === "function") {
      updateGameAdminUI(payload.openTotal ?? payload.total ?? 0);
    }
  } catch (error) {
    if (list) list.innerHTML = '<div class="lb-empty">Could not reach the server.</div>';
  }
}

async function saveAdminAnnouncement() {
  if (!requireAdminAction()) return;

  const active = document.getElementById("admin-announcement-active")?.checked;
  const message = document.getElementById("admin-announcement-message")?.value || "";

  setAdminStatus("Saving announcement...");

  try {
    const response = await adminFetch("/api/admin/config/announcement", {
      method: "POST",
      body: JSON.stringify({ active, message })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        handleAdminAuthFailure();
        return;
      }
      notifyAdminStatus(
        getAdminErrorMessage(response, payload, "Could not save announcement."),
        "error"
      );
      return;
    }

    if (typeof refreshCommunityPanel === "function") await refreshCommunityPanel();
    notifyAdminStatus("Announcement saved.", "success");
    await loadAdminState({ successMessage: "Announcement saved." });
  } catch (error) {
    notifyAdminStatus("Could not reach the server.", "error");
  }
}

async function saveAdminLiveSettings() {
  if (!requireAdminAction()) return;

  setAdminStatus("Saving live settings...");

  const body = {
    giveawayEyebrow: document.getElementById("admin-live-giveaway-eyebrow")?.value || "",
    giveawayTitle: document.getElementById("admin-live-giveaway-title")?.value || "",
    giveawayTeaser: document.getElementById("admin-live-giveaway-teaser")?.value || "",
    showGiveaway: document.getElementById("admin-live-show-giveaway")?.checked,
    bonusOfferChance: Number(document.getElementById("admin-live-bonus-offer")?.value),
    bonusWinChance: Number(document.getElementById("admin-live-bonus-win")?.value),
    freeplayEnabled: document.getElementById("admin-live-freeplay-enabled")?.checked,
    defaultLeaderboardRole: document.getElementById("admin-live-default-role")?.value || "Survivor"
  };

  try {
    const response = await adminFetch("/api/admin/config/live", {
      method: "POST",
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        handleAdminAuthFailure();
        return;
      }
      notifyAdminStatus(
        getAdminErrorMessage(response, payload, "Could not save live settings."),
        "error"
      );
      return;
    }

    if (typeof refreshCommunityPanel === "function") await refreshCommunityPanel();
    notifyAdminStatus("Live settings saved.", "success");
    await loadAdminState({ successMessage: "Live settings saved." });
  } catch (error) {
    notifyAdminStatus("Could not reach the server.", "error");
  }
}

async function adminGrantSkillPoints(username, buttonEl) {
  if (!requireAdminAction()) return;

  const card = buttonEl?.closest?.(".admin-player-card");
  const input = card?.querySelector(".admin-player-sp-input");
  const amount = Math.max(1, Math.floor(Number(input?.value) || 0));
  if (!amount) {
    setAdminStatus("Enter a valid skill point amount.", "error");
    return;
  }

  if (!confirm(`Set ${username} to ${amount.toLocaleString("sv-SE")} skill points?`)) return;

  setAdminStatus(`Granting skill points to ${username}...`);
  try {
    const response = await adminFetch("/api/admin/players/grant-skill-points", {
      method: "POST",
      body: JSON.stringify({ username, amount, mode: "set" })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAdminStatus(payload.error || "Could not grant skill points.", "error");
      return;
    }
    setAdminStatus(
      `${username} now has ${Number(payload.skillPoints || 0).toLocaleString("sv-SE")} SP.`,
      "success"
    );
    await loadAdminPlayers();
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

async function adminResetPlayerSave(username) {
  if (!requireAdminAction()) return;
  if (!confirm(`Reset save for ${username}? This cannot be undone.`)) return;

  setAdminStatus(`Resetting ${username}...`);
  try {
    const response = await adminFetch("/api/admin/players/reset-save", {
      method: "POST",
      body: JSON.stringify({ username })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAdminStatus(payload.error || "Could not reset save.", "error");
      return;
    }
    setAdminStatus(`Save reset for ${username}.`, "success");
    await loadAdminPlayers();
    if (typeof scheduleLeaderboardRefresh === "function") scheduleLeaderboardRefresh();
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

async function adminSetPlayerLeaderboardRole(username, buttonEl, clear = false) {
  if (!requireAdminAction()) return;

  let role = "";
  if (!clear) {
    const card = buttonEl?.closest?.(".admin-player-card") || buttonEl?.closest?.(".admin-player-role-actions")?.closest(".admin-player-card");
    const input = card?.querySelector(".admin-player-role-input");
    role = input?.value?.trim() || "";
  }

  setAdminStatus(`Updating role for ${username}...`);
  try {
    const response = await adminFetch("/api/admin/players/leaderboard-role", {
      method: "POST",
      body: JSON.stringify({ username, role })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAdminStatus(payload.error || "Could not update role.", "error");
      return;
    }
    setAdminStatus(
      clear || !payload.customRole
        ? `${username} now uses default role (${payload.role}).`
        : `${username} role set to ${payload.role}.`,
      "success"
    );
    await loadAdminPlayers();
    await loadAdminState({ keepStatus: true });
    if (typeof scheduleLeaderboardRefresh === "function") scheduleLeaderboardRefresh();
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

async function adminToggleLeaderboardHidden(username, hidden) {
  if (!requireAdminAction()) return;

  setAdminStatus(`${hidden ? "Hiding" : "Restoring"} ${username} on leaderboard...`);
  try {
    const response = await adminFetch("/api/admin/players/leaderboard-hidden", {
      method: "POST",
      body: JSON.stringify({ username, hidden: Boolean(hidden) })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAdminStatus(payload.error || "Could not update leaderboard.", "error");
      return;
    }
    setAdminStatus("Leaderboard updated.", "success");
    await loadAdminPlayers();
    if (typeof scheduleLeaderboardRefresh === "function") scheduleLeaderboardRefresh();
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

async function adminBanPlayer(username) {
  if (!requireAdminAction()) return;
  if (!confirm(`Ban account ${username}? They will be logged out and blocked from logging in.`)) return;

  setAdminStatus(`Banning ${username}...`);
  try {
    const response = await adminFetch("/api/admin/players/ban", {
      method: "POST",
      body: JSON.stringify({ username })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAdminStatus(payload.error || "Could not ban account.", "error");
      return;
    }
    setAdminStatus(`${username} banned.`, "success");
    await loadAdminPlayers();
    await loadAdminState();
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

async function adminUnbanUsername(username) {
  if (!requireAdminAction()) return;

  try {
    const response = await adminFetch("/api/admin/players/unban", {
      method: "POST",
      body: JSON.stringify({ username })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAdminStatus(payload.error || "Could not unban account.", "error");
      return;
    }
    setAdminStatus(`${username} unbanned.`, "success");
    await loadAdminState();
    await loadAdminPlayers();
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

async function adminBanIpFromForm() {
  if (!requireAdminAction()) return;

  const ip = document.getElementById("admin-ban-ip-input")?.value?.trim();
  if (!ip) {
    setAdminStatus("Enter an IP address to ban.", "error");
    return;
  }

  try {
    const response = await adminFetch("/api/admin/bans/ip", {
      method: "POST",
      body: JSON.stringify({ ip, ban: true })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAdminStatus(payload.error || "Could not ban IP.", "error");
      return;
    }
    document.getElementById("admin-ban-ip-input").value = "";
    setAdminStatus(`Banned IP ${ip}.`, "success");
    await loadAdminState();
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

async function adminUnbanIp(ip) {
  if (!requireAdminAction()) return;

  try {
    const response = await adminFetch("/api/admin/bans/ip", {
      method: "POST",
      body: JSON.stringify({ ip, ban: false })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAdminStatus(payload.error || "Could not unban IP.", "error");
      return;
    }
    setAdminStatus(`Unbanned IP ${ip}.`, "success");
    await loadAdminState();
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

async function adminBanUsernameFromForm() {
  if (!requireAdminAction()) return;

  const username = document.getElementById("admin-ban-user-input")?.value?.trim();
  if (!username) {
    setAdminStatus("Enter a username to ban.", "error");
    return;
  }
  await adminBanPlayer(username);
  const input = document.getElementById("admin-ban-user-input");
  if (input) input.value = "";
}

async function adminResolveReport(id, resolved) {
  if (!requireAdminAction()) return;

  try {
    const response = await adminFetch("/api/admin/reports/resolve", {
      method: "POST",
      body: JSON.stringify({ id, resolved: Boolean(resolved) })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAdminStatus(payload.error || "Could not update report.", "error");
      return;
    }
    setAdminStatus(resolved ? "Report marked fixed." : "Report reopened.", "success");
    await loadAdminReports();
    await loadAdminState();
  } catch (error) {
    setAdminStatus("Could not reach the server.", "error");
  }
}

function setAdminReportFilter(filter) {
  adminReportFilter = filter;
  document.querySelectorAll(".admin-report-filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.reportFilter === filter);
  });
  loadAdminReports();
}

async function openAdminPanel(tab = "announcement") {
  if (!window.isGameAdmin) return;

  const token =
    typeof window.refreshAuthTokenFromStorage === "function"
      ? window.refreshAuthTokenFromStorage()
      : "";
  if (!token) {
    notifyAdminStatus("Log in as Hulklives to use admin tools.", "error");
    if (typeof window.showAuthScreen === "function") window.showAuthScreen("login");
    return;
  }

  if (typeof refreshAccountAccess === "function") {
    await refreshAccountAccess();
    if (!window.isGameAdmin) {
      notifyAdminStatus("Admin access denied for this account.", "error");
      return;
    }
  }

  const modal = document.getElementById("admin-modal");
  if (!modal) return;

  bindAdminPanelEvents();
  if (typeof hideStartMenu === "function") hideStartMenu();
  document.body.classList.add("admin-open");
  adminPanelOpen = true;
  if (typeof pauseForRunModal === "function") pauseForRunModal("admin");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  switchAdminTab(tab);

  try {
    await loadAdminState();
    await loadAdminPlayers();
    await loadAdminReports();
  } catch (error) {
    notifyAdminStatus("Could not load admin panel.", "error");
    closeAdminPanel();
  }
}

function closeAdminPanel() {
  const modal = document.getElementById("admin-modal");
  if (!modal) return;

  const wasOpen = modal.classList.contains("open");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  adminPanelOpen = false;
  document.body.classList.remove("admin-open");
  setAdminStatus("");

  if (wasOpen && typeof resumeFromRunModal === "function") {
    resumeFromRunModal("admin");
  }

  if (typeof repairUiState === "function") {
    repairUiState();
  }
}

window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindAdminPanelEvents);
} else {
  bindAdminPanelEvents();
}
