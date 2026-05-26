/* Pro features: combat juice, enemy archetypes, run modifiers, boss phases */

let screenShake = 0;
let hurtFlash = 0;
let killFlash = 0;
let hitStopFrames = 0;
let runKillStreak = 0;
let killRings = [];
let killSparks = [];
let killCallouts = [];
let screenKillBanners = [];
let killShockwaves = [];
let activeKillStreakHud = null;
let streakHeat = 0;

const STREAK_MILESTONES = [5, 10, 15, 20, 25];

function buildStreakCallout(streak) {
  if (streak <= 1) return null;

  let text;
  if (streak === 2) text = "DOUBLE KILL";
  else if (streak === 3) text = "TRIPLE KILL";
  else text = `x${streak}`;

  let color = "#ffe066";
  let scale = 1.05;
  let size = "normal";

  if (streak === 3) {
    color = "#ffb347";
    scale = 1.15;
  } else if (streak >= 4 && streak <= 5) {
    color = "#ff8844";
    scale = 1.16 + (streak - 4) * 0.08;
  } else if (streak >= 6 && streak <= 9) {
    color = "#ff5555";
    scale = 1.28 + (streak - 6) * 0.05;
    size = "big";
  } else if (streak >= 10) {
    color = streak >= 20 ? "#ff66ff" : streak >= 15 ? "#ff3366" : "#ff4444";
    scale = 1.38 + Math.min(0.4, (streak - 10) * 0.028);
    size = "big";
  }

  return { text, color, scale, size };
}

function resetKillStreak() {
  runKillStreak = 0;
  streakHeat = 0;
  activeKillStreakHud = null;
}

function refreshKillStreakTimer() {
  if (runKillStreak <= 1) return;
  syncActiveKillStreakHud(runKillStreak, false);
  if (activeKillStreakHud) {
    activeKillStreakHud.fadeOut = 0;
    activeKillStreakHud.alpha = 1;
  }
}

function registerKillStreak() {
  runKillStreak += 1;
  streakHeat = Math.min(1, Math.max(0, (runKillStreak - 2) / 16));
}

function syncActiveKillStreakHud(streak, isCrit = false) {
  if (streak <= 1) {
    activeKillStreakHud = null;
    return;
  }

  const callout = buildStreakCallout(streak);
  if (!callout) return;

  let text = getKillStreakHudText(streak);
  const color = callout.color;

  activeKillStreakHud = {
    text,
    color,
    streak,
    scale: callout.scale,
    pulse: 14,
    alpha: 1,
    fadeOut: 0
  };
}

function getKillStreakHudText(streak) {
  if (streak === 2) return "DOUBLE";
  if (streak === 3) return "TRIPLE";
  return `x${streak}`;
}

function getKillStreakHudFontSize(streak, scale = 1, pulse = 1) {
  let base = 10;
  if (streak >= 20) base = 13;
  else if (streak >= 10) base = 12;
  else if (streak >= 4) base = 11;
  return Math.round(base * scale * pulse);
}
let deathSequence = null;
let zombieProjectiles = [];
let runModifiers = null;
let pendingModifierWave = null;

const RUN_MODIFIER_POOL = [
  {
    id: "rapid",
    name: "Rapid Fire",
    emoji: "⚡",
    desc: "+12% fire rate",
    apply(m) {
      m.fireRateMult *= 0.88;
    }
  },
  {
    id: "heavy",
    name: "Heavy Rounds",
    emoji: "💥",
    desc: "+15% bullet damage",
    apply(m) {
      m.damageMult *= 1.15;
    }
  },
  {
    id: "swift",
    name: "Swift Feet",
    emoji: "👟",
    desc: "+10% move speed",
    apply(m) {
      m.moveSpeedMult *= 1.1;
    }
  },
  {
    id: "pierce",
    name: "Piercing",
    emoji: "🎯",
    desc: "Bullets pierce +1 enemy",
    apply(m) {
      m.pierce += 1;
    }
  },
  {
    id: "vamp",
    name: "Life Drain",
    emoji: "🩸",
    desc: "Heal 1.2% max HP per kill",
    apply(m) {
      m.lifesteal += 0.012;
    }
  },
  {
    id: "fortify",
    name: "Fortify",
    emoji: "🛡️",
    desc: "+8% max HP this run",
    apply(m) {
      m.maxHpMult *= 1.08;
      if (typeof player !== "undefined" && player) {
        const bonus = Math.round(player.maxHp * 0.08);
        player.maxHp += bonus;
        player.hp = Math.min(player.maxHp, player.hp + bonus);
      }
    }
  },
  {
    id: "magnet",
    name: "Kill Rush",
    emoji: "🔥",
    desc: "+6% fire rate & damage",
    apply(m) {
      m.fireRateMult *= 0.94;
      m.damageMult *= 1.06;
    }
  }
];

const ARCHETYPE_DEFS = {
  runner: {
    label: "Runner",
    sizeMult: 0.74,
    speedMult: 1.56,
    hpMult: 0.58,
    glow: "#ff7070",
    fill: "#c62828"
  },
  spitter: {
    label: "Spitter",
    sizeMult: 0.9,
    speedMult: 0.78,
    hpMult: 0.82,
    glow: "#8dff70",
    fill: "#3d8b2f"
  },
  exploder: {
    label: "Exploder",
    sizeMult: 0.96,
    speedMult: 0.95,
    hpMult: 0.72,
    glow: "#ffb04a",
    fill: "#e65100"
  }
};

function createDefaultRunModifiers() {
  return {
    fireRateMult: 1,
    damageMult: 1,
    moveSpeedMult: 1,
    maxHpMult: 1,
    pierce: 0,
    lifesteal: 0,
    picks: 0
  };
}

function resetProRunState() {
  screenShake = 0;
  hurtFlash = 0;
  killFlash = 0;
  hitStopFrames = 0;
  resetKillStreak();
  killRings = [];
  killSparks = [];
  killCallouts = [];
  screenKillBanners = [];
  killShockwaves = [];
  deathSequence = null;
  zombieProjectiles = [];
  runModifiers = createDefaultRunModifiers();
  pendingModifierWave = null;
}

function addScreenShake(amount) {
  screenShake = Math.min(20, screenShake + amount);
}

function triggerHitStop(frames) {
  hitStopFrames = Math.max(hitStopFrames, frames);
}

function updateScreenShake() {
  if (screenShake > 0.08) {
    screenShake *= 0.84;
  } else {
    screenShake = 0;
  }
}

function getShakeOffset() {
  if (screenShake <= 0 && hitStopFrames <= 0) return { x: 0, y: 0 };
  const amount = screenShake + hitStopFrames * 0.55;
  return {
    x: (Math.random() - 0.5) * amount * 2.2,
    y: (Math.random() - 0.5) * amount * 2.2
  };
}

function pushKillCallout(x, y, text, color, scale = 1, size = "normal") {
  killCallouts.push({
    x,
    y,
    text,
    color,
    scale,
    size,
    life: size === "big" ? 78 : 64,
    maxLife: size === "big" ? 78 : 64,
    vy: size === "big" ? -0.68 : -0.54,
    pop: 32
  });
  while (killCallouts.length > 16) killCallouts.shift();
}

function pushKillShockwave(x, y, scale, color, strength = 1) {
  killShockwaves.push({
    x,
    y,
    life: 24,
    maxLife: 24,
    radius: 6 * scale,
    maxRadius: (34 + strength * 18) * scale,
    color
  });
  while (killShockwaves.length > 12) killShockwaves.shift();
}

function pushStreakMilestoneJuice(streak, cx, cy, scale) {
  const banners = {
    5: { text: "x5 · ON FIRE!", color: "#ffaa33" },
    10: { text: "x10 · RAMPAGE!", color: "#ff5544" },
    15: { text: "x15 · UNSTOPPABLE!", color: "#ff3366" },
    20: { text: "x20 · DOMINATING!", color: "#ff55cc" },
    25: { text: "x25 · LEGENDARY!", color: "#ffd060" }
  };
  const banner = banners[streak];
  if (!banner) return;

  const tier = STREAK_MILESTONES.indexOf(streak);
  triggerHitStop(streak >= 20 ? 3 : streak >= 10 ? 2 : 1);
  addScreenShake(2.5 + tier * 1.4);
  killFlash = Math.min(1, killFlash + 0.14 + tier * 0.05);

  pushKillShockwave(cx, cy, scale, banner.color, 1 + tier * 0.35);
  pushKillShockwave(cx, cy, scale, "rgba(255,255,255,0.88)", 0.8 + tier * 0.2);

  for (let i = 0; i < 3; i += 1) {
    killRings.push({
      x: cx,
      y: cy,
      life: 44 - i * 6,
      maxLife: 44 - i * 6,
      radius: (8 + i * 4) * scale,
      maxRadius: (52 + tier * 14 + i * 22) * scale,
      color: i === 0 ? banner.color : i === 1 ? "#ffffff" : "#ff6677",
      width: 3 - i * 0.5
    });
  }

  if (typeof playStreakMilestoneSound === "function") {
    playStreakMilestoneSound(streak);
  }
}

function pushScreenKillBanner(streak) {
  const banners = {
    5: { text: "x5 · ON FIRE!", color: "#ffaa33" },
    10: { text: "x10 · RAMPAGE!", color: "#ff5544" },
    15: { text: "x15 · UNSTOPPABLE!", color: "#ff3366" },
    20: { text: "x20 · DOMINATING!", color: "#ff55cc" },
    25: { text: "x25 · LEGENDARY!", color: "#ffd060" }
  };
  const banner = banners[streak] || { text: `x${streak}!`, color: "#ff8844" };
  screenKillBanners.push({
    text: banner.text,
    color: banner.color,
    life: 92,
    maxLife: 92,
    scale: 0.92 + Math.min(0.28, streak * 0.008)
  });
  while (screenKillBanners.length > 3) screenKillBanners.shift();
}

function spawnKillJuice(zombie, options = {}) {
  if (!zombie) return;

  const cx = zombie.x + zombie.size / 2;
  const cy = zombie.y + zombie.size / 2;
  const scale = Math.max(0.85, zombie.size / (typeof ZOMBIE_DRAW_SIZE !== "undefined" ? ZOMBIE_DRAW_SIZE : 42));
  const isCrit = Boolean(options.isCrit);
  const isBoss = Boolean(options.isBoss);
  const isElite = Boolean(options.isElite);

  registerKillStreak();

  const streakBoost = Math.min(8, runKillStreak * 0.14);
  killFlash = Math.min(
    1,
    killFlash + (isBoss ? 0.4 : isCrit ? 0.26 : 0.11 + streakBoost * 0.045)
  );

  addScreenShake(
    isBoss ? 9.5 : isCrit ? 3.4 : 1.2 + streakBoost * 0.38
  );

  if (isCrit || isBoss) {
    triggerHitStop(isBoss ? 3 : 2);
  } else if (STREAK_MILESTONES.includes(runKillStreak)) {
    triggerHitStop(runKillStreak >= 20 ? 3 : 2);
  }

  const ringColor = isCrit ? "#ffb347" : isBoss ? "#d8a6ff" : runKillStreak >= 10 ? "#ff4466" : "#ff5566";
  killRings.push({
    x: cx,
    y: cy,
    life: 48,
    maxLife: 48,
    radius: 10 * scale,
    maxRadius: (isBoss ? 102 : isCrit ? 84 : 62 + streakBoost * 2) * scale,
    color: ringColor,
    width: isCrit || isBoss ? 4 : 3
  });

  if (isCrit || isBoss || runKillStreak >= 3) {
    killRings.push({
      x: cx,
      y: cy,
      life: 38,
      maxLife: 38,
      radius: 6 * scale,
      maxRadius: (isBoss ? 124 : 88 + streakBoost * 2) * scale,
      color: "rgba(255,255,255,0.92)",
      width: 2
    });
  }

  if (runKillStreak >= 6 && !isBoss) {
    pushKillShockwave(cx, cy, scale, ringColor, 0.45 + streakBoost * 0.08);
  }

  const sparkCount = isBoss ? 28 : isCrit ? 20 : 12 + Math.min(14, runKillStreak);
  for (let i = 0; i < sparkCount; i += 1) {
    const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.5;
    const speed = 2.8 + Math.random() * (isCrit ? 11 : 7.5 + streakBoost * 0.35);
    const sparkLife = 34 + Math.floor(Math.random() * 26);
    killSparks.push({
      x: cx + (Math.random() - 0.5) * 8,
      y: cy + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      life: sparkLife,
      maxLife: sparkLife,
      size: 2 + Math.random() * (isCrit ? 4.5 : 3.2),
      color: isCrit
        ? Math.random() > 0.45
          ? "#ffb347"
          : "#ff5544"
        : isBoss
          ? "#e8b4ff"
          : runKillStreak >= 10
            ? Math.random() > 0.5
              ? "#ff5588"
              : "#ff8844"
            : "#ff6677"
    });
  }
  while (killSparks.length > 180) killSparks.shift();

  if (isBoss && isCrit) {
    pushKillCallout(cx, cy - zombie.size * 0.55, "BOSS CRUSH!", "#ffd060", 1.55, "big");
    syncActiveKillStreakHud(runKillStreak, true);
  } else if (isBoss) {
    pushKillCallout(cx, cy - zombie.size * 0.5, "BOSS DOWN!", "#e8b4ff", 1.42, "big");
    syncActiveKillStreakHud(runKillStreak, false);
  } else if (runKillStreak <= 1) {
    if (isCrit) {
      pushKillCallout(cx, cy - zombie.size * 0.48, "CRIT KILL!", "#ffb347", 1.28, "big");
    } else {
      pushKillCallout(cx, cy - zombie.size * 0.38, "KILL!", "#ff7b7b", 0.92);
    }
  } else {
    const callout = buildStreakCallout(runKillStreak);
    if (callout) {
      pushKillCallout(
        cx,
        cy - zombie.size * 0.42,
        callout.text,
        callout.color,
        callout.scale,
        callout.size
      );
    }
    syncActiveKillStreakHud(runKillStreak, isCrit);
  }

  if (STREAK_MILESTONES.includes(runKillStreak)) {
    pushStreakMilestoneJuice(runKillStreak, cx, cy, scale);
    pushScreenKillBanner(runKillStreak);
  }
}

function updateKillJuice() {
  if (runKillStreak >= 2) {
    if (!activeKillStreakHud || activeKillStreakHud.streak !== runKillStreak) {
      syncActiveKillStreakHud(runKillStreak, false);
    }
    if (activeKillStreakHud) {
      activeKillStreakHud.fadeOut = 0;
      activeKillStreakHud.alpha = 1;
    }
  }

  if (activeKillStreakHud?.pulse > 0) {
    activeKillStreakHud.pulse -= 1;
  }

  for (let i = killRings.length - 1; i >= 0; i -= 1) {
    killRings[i].life -= 1;
    if (killRings[i].life <= 0) killRings.splice(i, 1);
  }

  for (let i = killSparks.length - 1; i >= 0; i -= 1) {
    const spark = killSparks[i];
    spark.life -= 1;
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.vx *= 0.9;
    spark.vy *= 0.9;
    spark.vy += 0.12;
    if (spark.life <= 0) killSparks.splice(i, 1);
  }

  for (let i = killCallouts.length - 1; i >= 0; i -= 1) {
    const callout = killCallouts[i];
    callout.life -= 1;
    callout.y += callout.vy;
    if (callout.pop > 0) callout.pop -= 1;
    if (callout.life <= 0) killCallouts.splice(i, 1);
  }

  for (let i = screenKillBanners.length - 1; i >= 0; i -= 1) {
    screenKillBanners[i].life -= 1;
    if (screenKillBanners[i].life <= 0) screenKillBanners.splice(i, 1);
  }

  for (let i = killShockwaves.length - 1; i >= 0; i -= 1) {
    killShockwaves[i].life -= 1;
    if (killShockwaves[i].life <= 0) killShockwaves.splice(i, 1);
  }

  if (runKillStreak <= 1) {
    streakHeat *= 0.94;
  } else if (streakHeat > 0) {
    streakHeat = Math.min(1, Math.max(streakHeat, (runKillStreak - 2) / 16));
  }

  if (killFlash > 0.015) {
    killFlash *= 0.925;
  } else {
    killFlash = 0;
  }
}

function drawKillJuice() {
  if (!ctx) return;

  for (const wave of killShockwaves) {
    const t = 1 - wave.life / wave.maxLife;
    const radius = wave.radius + (wave.maxRadius - wave.radius) * t;
    const alpha = Math.max(0, wave.life / wave.maxLife) * (1 - t) * 0.28;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = wave.color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = wave.color;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const ring of killRings) {
    const t = 1 - ring.life / ring.maxLife;
    const radius = ring.radius + (ring.maxRadius - ring.radius) * t;
    const alpha = Math.max(0, ring.life / ring.maxLife) * 0.9;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width;
    ctx.shadowBlur = 12;
    ctx.shadowColor = ring.color;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const spark of killSparks) {
    const alpha = Math.max(0, spark.life / spark.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = spark.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = spark.color;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const callout of killCallouts) {
    const alpha = Math.max(0, callout.life / callout.maxLife);
    const pop = callout.pop > 0 ? 1 + callout.pop * 0.018 : 1;
    const baseSize = callout.size === "big" ? 18 : 14;
    const fontSize = Math.round(baseSize * (callout.scale || 1) * pop);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${fontSize}px Poppins, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = callout.color;
    ctx.shadowBlur = callout.size === "big" ? 16 : 10;
    ctx.strokeStyle = "rgba(0,0,0,0.92)";
    ctx.lineWidth = callout.size === "big" ? 4 : 3;
    ctx.strokeText(callout.text, callout.x, callout.y);
    ctx.fillStyle = callout.color;
    ctx.fillText(callout.text, callout.x, callout.y);
    ctx.restore();
  }
}

function drawActiveKillStreakHudAt(cx, hpBarTop, overheadTop = null) {
  if (!ctx || !activeKillStreakHud || activeKillStreakHud.alpha <= 0 || runKillStreak < 2) return;

  const hud = activeKillStreakHud;
  const pulse = hud.pulse > 0 ? 1 + hud.pulse * 0.012 : 1;
  const fontSize = getKillStreakHudFontSize(hud.streak, hud.scale, pulse);
  const streakY = overheadTop != null ? overheadTop - 8 : hpBarTop - 10;

  ctx.save();
  ctx.globalAlpha = hud.alpha * 0.9;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = `800 ${fontSize}px Poppins, sans-serif`;
  ctx.shadowColor = hud.color;
  ctx.shadowBlur = hud.streak >= 10 ? 7 : 4;
  ctx.strokeStyle = "rgba(0,0,0,0.88)";
  ctx.lineWidth = 2;
  ctx.strokeText(hud.text, cx, streakY);
  ctx.fillStyle = hud.color;
  ctx.fillText(hud.text, cx, streakY);
  ctx.restore();
}

function drawKillJuiceOverlay() {
  if (!ctx) return;

  if (streakHeat > 0.04 && runKillStreak >= 4) {
    const pulse = 0.035 + Math.sin(performance.now() * 0.006) * 0.018;
    const warm = streakHeat * pulse;
    ctx.fillStyle = `rgba(255,72,48,${warm * 0.16})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    if (runKillStreak >= 10) {
      ctx.fillStyle = `rgba(255,40,120,${warm * 0.08})`;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }
  }

  if (killFlash > 0.02) {
    const hot = runKillStreak >= 10;
    ctx.fillStyle = hot
      ? `rgba(255,88,120,${killFlash * 0.24})`
      : `rgba(255,120,80,${killFlash * 0.22})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  for (const banner of screenKillBanners) {
    const alpha = Math.max(0, banner.life / banner.maxLife);
    const lifeRatio = 1 - banner.life / banner.maxLife;
    const pop = 1 + Math.sin(lifeRatio * Math.PI) * 0.1;
    const fontSize = Math.round(22 * (banner.scale || 1) * pop);
    const y = VIEW_HEIGHT * 0.12 + lifeRatio * 10;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${fontSize}px Poppins, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = banner.color;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = "rgba(0,0,0,0.94)";
    ctx.lineWidth = 4;
    ctx.strokeText(banner.text, VIEW_WIDTH / 2, y);
    ctx.fillStyle = banner.color;
    ctx.fillText(banner.text, VIEW_WIDTH / 2, y);
    ctx.restore();
  }
}

const DAMAGE_NUMBER_STYLES = {
  normal: { color: "#fff4a8", scale: 0.82, pop: 1, life: 28, vy: -1.35 },
  heavy: { color: "#fff8dc", scale: 1.08, pop: 1.14, life: 30, vy: -1.42 },
  crit: { color: "#ffb347", scale: 1.42, pop: 1.32, life: 48, vy: -1.35, label: true },
  kill: { color: "#ff7b7b", scale: 1.34, pop: 1.26, life: 46, vy: -1.25, label: true, killLabel: "KILL" },
  burst: { color: "#ff4747", scale: 1.72, pop: 1.48, life: 56, vy: -1.45, label: true, killLabel: "BOOM" },
  boss: { color: "#e8b4ff", scale: 1.18, pop: 1.1, life: 40, vy: -1.25 },
  bossCrit: { color: "#ffd060", scale: 1.62, pop: 1.42, life: 54, vy: -1.55, label: true }
};

function resolveDamageNumberStyle(options = {}) {
  if (options.style && DAMAGE_NUMBER_STYLES[options.style]) return options.style;
  const isBoss = Boolean(options.isBoss || options.big);
  if (options.isCrit && options.isKill) return isBoss ? "bossCrit" : "burst";
  if (options.isCrit) return isBoss ? "bossCrit" : "crit";
  if (options.isKill) return "kill";
  if (options.heavy) return "heavy";
  if (isBoss) return "boss";
  return "normal";
}

function spawnDamageNumber(x, y, damage, options = {}) {
  if (typeof floatingTexts === "undefined") return;

  const styleKey = resolveDamageNumberStyle(options);
  const style = DAMAGE_NUMBER_STYLES[styleKey];
  const rounded = Math.max(1, Math.round(damage));
  let text = String(rounded);
  if (style.label && options.isCrit) {
    text = options.isKill && style.killLabel ? `${style.killLabel}! ${rounded}` : `CRIT ${rounded}`;
  } else if (options.isKill && style.killLabel) {
    text = `${style.killLabel}! ${rounded}`;
  }
  const drift = styleKey.includes("crit") || styleKey === "burst" ? 0.85 : 0.28;

  floatingTexts.push({
    x: x + (Math.random() - 0.5) * 8,
    y,
    text,
    color: options.color || style.color,
    scale: style.scale,
    pop: style.pop,
    style: styleKey,
    life: style.life,
    maxLife: style.life,
    vy: style.vy,
    vx: (Math.random() - 0.5) * drift,
    kind: "damage"
  });
  while (floatingTexts.length > 36) floatingTexts.shift();
}

function getRunFireRateMult() {
  return runModifiers?.fireRateMult || 1;
}

function getRunDamageMult() {
  return runModifiers?.damageMult || 1;
}

function getRunMoveSpeedMult() {
  return runModifiers?.moveSpeedMult || 1;
}

function getRunPierceCount() {
  return runModifiers?.pierce || 0;
}

function applyRunLifestealOnKill() {
  const rate = runModifiers?.lifesteal || 0;
  if (rate <= 0 || !player) return;
  const heal = Math.max(1, Math.round(player.maxHp * rate));
  player.hp = Math.min(player.maxHp, player.hp + heal);
  if (heal >= 2) {
    spawnFloatingText(player.x + PLAYER_SIZE / 2, player.y - 8, `+${heal}`, "#9dffc8", 0.9);
  }
}

function getArchetypeBudget(waveCount) {
  const profile = getPlayerPowerProfile();
  const budget = { runner: 0, spitter: 0, exploder: 0 };
  const powerEase = clamp(0.68 + Math.log10(Math.max(10, profile.rating)) * 0.11, 0.68, 1.18);

  if (wave >= 6 && profile.upgrades >= 1) {
    budget.runner = clamp(Math.round((1 + wave * 0.08) * powerEase), 0, Math.max(1, Math.floor(waveCount * 0.22)));
  }
  if (wave >= 14 && profile.upgrades >= 10) {
    budget.spitter = clamp(Math.round((wave - 10) * 0.05 * powerEase), 0, Math.max(1, Math.floor(waveCount * 0.12)));
  }
  if (wave >= 20 && profile.upgrades >= 30) {
    budget.exploder = clamp(Math.round((wave - 16) * 0.04 * powerEase), 0, Math.max(1, Math.floor(waveCount * 0.08)));
  }

  if (profile.upgrades <= 3 && wave <= 10) {
    budget.spitter = 0;
    budget.exploder = 0;
    budget.runner = Math.min(budget.runner, 1);
  }

  return budget;
}

function assignWaveArchetypes(specs) {
  const budget = getArchetypeBudget(specs.length);
  const pool = [];
  Object.entries(budget).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) pool.push(type);
  });
  if (!pool.length) return specs;

  const candidates = specs
    .map((spec, index) => ({ spec, index }))
    .filter(({ spec }) => spec.tier === "normal" && !spec.archetype)
    .sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(pool.length, candidates.length); i++) {
    const type = pool[i];
    const def = ARCHETYPE_DEFS[type];
    const target = candidates[i].spec;
    target.archetype = type;
    target.size = Math.round(target.size * def.sizeMult);
    target.speed *= def.speedMult;
    target.damage = Math.round(target.damage * (type === "runner" ? 0.9 : type === "exploder" ? 1.05 : 0.95));
    target.archetypeHpMult = def.hpMult;
  }

  return specs;
}

function applyArchetypeHpMult(spec, hp) {
  if (spec.archetypeHpMult) {
    return Math.max(1, Math.round(hp * spec.archetypeHpMult));
  }
  return hp;
}

function updateZombieArchetype(z, dist, playerCenterX, playerCenterY, zombieCenterX, zombieCenterY) {
  if (z.isWaveBoss || z.tier === "waveBoss") return false;

  z.spitCooldown = Math.max(0, (z.spitCooldown || 0) - 1);
  z.telegraphUntil = Math.max(0, (z.telegraphUntil || 0) - 1);

  if (z.archetype === "spitter") {
    const preferred = 240;
    if (dist > preferred + 40) {
      return false;
    }
    if (dist < preferred - 70) {
      const mx = -((playerCenterX - zombieCenterX) / Math.max(dist, 1)) * (z.speed || 1);
      const my = -((playerCenterY - zombieCenterY) / Math.max(dist, 1)) * (z.speed || 1);
      z.x += mx;
      z.y += my;
      return true;
    }
    if (dist >= preferred - 40 && dist <= preferred + 90 && z.spitCooldown <= 0) {
      if (z.telegraphUntil <= 0) {
        z.telegraphUntil = 34;
        z.spitWindup = { dx: (playerCenterX - zombieCenterX) / dist, dy: (playerCenterY - zombieCenterY) / dist };
        return true;
      }
      if (z.telegraphUntil === 1 && z.spitWindup) {
        spawnZombieProjectile(zombieCenterX, zombieCenterY, z.spitWindup.dx, z.spitWindup.dy, z);
        z.spitCooldown = 110 + Math.floor(Math.random() * 40);
        z.spitWindup = null;
        playSpitSound();
      }
    }
    return true;
  }

  if (z.archetype === "runner") {
    return false;
  }

  return false;
}

function spawnZombieProjectile(x, y, dx, dy, z) {
  const profile = getPlayerPowerProfile();
  const damage = Math.max(
    3,
    Math.round(
      ((z.damage || 8) * 0.55 + wave * 0.08) *
        (getDifficultyPhase() === "easy" ? 0.85 : 1) *
        clamp(0.86 + Math.log10(Math.max(10, profile.rating)) * 0.05, 0.86, 1.32)
    )
  );

  zombieProjectiles.push({
    x,
    y,
    dx,
    dy,
    speed: 4.2 + wave * 0.015,
    damage,
    life: 150,
    maxLife: 150,
    size: 8
  });
}

function updateZombieProjectiles() {
  const pcx = player.x + PLAYER_SIZE / 2;
  const pcy = player.y + PLAYER_SIZE / 2;

  for (let i = zombieProjectiles.length - 1; i >= 0; i--) {
    const p = zombieProjectiles[i];
    p.x += p.dx * p.speed;
    p.y += p.dy * p.speed;
    p.life -= 1;

    if (
      p.life <= 0 ||
      p.x < -20 ||
      p.y < -20 ||
      p.x > WORLD_WIDTH + 20 ||
      p.y > WORLD_HEIGHT + 20
    ) {
      zombieProjectiles.splice(i, 1);
      continue;
    }

    if (Math.hypot(pcx - p.x, pcy - p.y) <= p.size + PLAYER_SIZE * 0.28) {
      applyDamageToPlayer(p.damage);
      addScreenShake(2);
      hurtFlash = Math.min(1, hurtFlash + 0.25);
      zombieProjectiles.splice(i, 1);
      if (player.hp <= 0) {
        player.hp = 0;
        if (wave > runBestWave) runBestWave = wave;
        gameOver();
      }
    }
  }
}

function drawZombieProjectiles() {
  for (const p of zombieProjectiles) {
    const alpha = clamp(p.life / p.maxLife, 0.35, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(125,255,120,0.8)";
    ctx.fillStyle = "#b8ff9a";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function triggerExploderDeath(zombie) {
  const cx = zombie.x + zombie.size / 2;
  const cy = zombie.y + zombie.size / 2;
  const radius = zombie.size * 1.15;
  addScreenShake(4.5);
  playExplosionSound();

  spawnBloodBurst(zombie, { angle: 0 });
  spawnFloatingText(cx, cy - 12, "BOOM", "#ffb04a", 1.1);

  const pcx = player.x + PLAYER_SIZE / 2;
  const pcy = player.y + PLAYER_SIZE / 2;
  const dist = Math.hypot(pcx - cx, pcy - cy);
  if (dist <= radius + PLAYER_SIZE * 0.35) {
    const profile = getPlayerPowerProfile();
    const dmg = Math.max(
      8,
      Math.round(
        player.maxHp *
          (0.018 + wave * 0.00035) *
          clamp(profile.powerMult * 0.035, 0.65, 1.4)
      )
    );
    applyDamageToPlayer(dmg);
    hurtFlash = Math.min(1, hurtFlash + 0.45);
    addScreenShake(5);
  }
}

function updateWaveBossPhases(zombie) {
  if (!zombie?.isWaveBoss) return;
  const ratio = zombie.hp / Math.max(1, zombie.maxHp || zombie.hp);
  zombie.bossPhase = zombie.bossPhase || 1;

  if (zombie.bossPhase === 1 && ratio <= 0.66) {
    zombie.bossPhase = 2;
    zombie.speed = clampWaveBossSpeed(zombie.speed * 1.08, 2);
    spawnBossMinions(4);
    showMilestone("👹 Boss Phase 2 — minions incoming!");
    playBossRoar();
    addScreenShake(5);
  } else if (zombie.bossPhase === 2 && ratio <= 0.33) {
    zombie.bossPhase = 3;
    zombie.speed = clampWaveBossSpeed(zombie.speed * 1.1, 3);
    zombie.damage = Math.round((zombie.damage || 12) * 1.24);
    showMilestone("💀 Boss berserk!");
    playBossRoar();
    addScreenShake(7);
  }
}

function spawnBossMinions(count) {
  const profile = getPlayerPowerProfile();
  const cap = clamp(2 + Math.floor(profile.upgrades / 25), 2, count + 1);
  const spawnCount = Math.min(count, cap);

  for (let i = 0; i < spawnCount; i++) {
    const size = Math.round(ZOMBIE_DRAW_SIZE * 0.82);
    const spawnX = clamp(player.x + (Math.random() - 0.5) * 280, 20, WORLD_WIDTH - size - 20);
    const spawnY = clamp(player.y + (Math.random() - 0.5) * 280, 20, WORLD_HEIGHT - size - 20);
    const hp = Math.max(1, Math.round(getEffectivePlayerDamage() * 0.45));
    zombies.push({
      x: spawnX,
      y: spawnY,
      hp,
      maxHp: hp,
      tier: "normal",
      archetype: "runner",
      strength: "weak",
      size,
      speed: 1.1 + getWaveSpeedBonus() * 0.4,
      damage: Math.round(5 + wave * 0.35),
      hitCooldown: 0,
      facingAngle: 0,
      jitter: Math.random() * 0.4 + 0.6
    });
  }
}

function drawArchetypeTelegraph(z, cx, cy) {
  if ((z.telegraphUntil || 0) <= 0) return;
  const pulse = 0.55 + (z.telegraphUntil % 8) * 0.05;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = "#ff5555";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, z.size * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawArchetypeTint(z, cx, cy) {
  if (!z.archetype || z.isWaveBoss) return;
  const def = ARCHETYPE_DEFS[z.archetype];
  if (!def) return;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = def.fill;
  ctx.beginPath();
  ctx.arc(cx, cy, z.size * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnhancedVignette() {
  const w = VIEW_WIDTH;
  const h = VIEW_HEIGHT;
  const hpRatio = player ? player.hp / Math.max(1, player.maxHp) : 1;

  const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.82);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${0.38 + (1 - hpRatio) * 0.12})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  if (streakHeat > 0.05 && runKillStreak >= 6) {
    const edge = streakHeat * (0.14 + Math.sin(performance.now() * 0.005) * 0.04);
    const streakGradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.34, w / 2, h / 2, h * 0.88);
    streakGradient.addColorStop(0, "rgba(0,0,0,0)");
    streakGradient.addColorStop(
      1,
      runKillStreak >= 15
        ? `rgba(120,0,48,${edge})`
        : runKillStreak >= 10
          ? `rgba(90,10,20,${edge})`
          : `rgba(70,18,8,${edge})`
    );
    ctx.fillStyle = streakGradient;
    ctx.fillRect(0, 0, w, h);
  }

  if (typeof drawKillJuiceOverlay === "function") {
    drawKillJuiceOverlay();
  }

  if (hurtFlash > 0.02) {
    ctx.fillStyle = `rgba(255,40,60,${hurtFlash * 0.28})`;
    ctx.fillRect(0, 0, w, h);
    hurtFlash *= 0.86;
  } else {
    hurtFlash = 0;
  }

  if (hpRatio <= 0.35) {
    const pulse = 0.08 + Math.sin(performance.now() * 0.008) * 0.04;
    ctx.fillStyle = `rgba(180,0,30,${pulse * (1 - hpRatio)})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function shouldSkipGameplayUpdate() {
  return Boolean(deathSequence?.active);
}

function tickProFrame() {
  if (hitStopFrames > 0) hitStopFrames -= 1;
  updateScreenShake();
  updateKillJuice();
  if (deathSequence?.active) updateDeathSequence();
}

function startDeathSequence() {
  deathSequence = { active: true, timer: 52 };
  resetKillStreak();
  addScreenShake(14);
  hurtFlash = 1;
  playDeathSound();
}

function updateDeathSequence() {
  if (!deathSequence?.active) return;
  deathSequence.timer -= 1;
  if (deathSequence.timer <= 0) {
    deathSequence = null;
    finalizeGameOver();
  }
}

function pickRunModifierChoices(count = 3) {
  const picked = [];
  const pool = [...RUN_MODIFIER_POOL].sort(() => Math.random() - 0.5);
  for (const entry of pool) {
    if (picked.length >= count) break;
    picked.push(entry);
  }
  return picked;
}

function openRunModifierPick(clearedWave) {
  pendingModifierWave = clearedWave;
  setGamePaused(true, "modifier");

  const overlay = document.getElementById("run-modifier-modal");
  const list = document.getElementById("run-modifier-choices");
  if (!overlay || !list) {
    resumeAfterRunModifierPick();
    return;
  }

  const choices = pickRunModifierChoices(3);
  list.innerHTML = choices
    .map(
      (choice) => `<button type="button" class="run-modifier-btn" data-mod-id="${choice.id}">
        <span class="run-modifier-emoji">${choice.emoji}</span>
        <span class="run-modifier-copy">
          <strong>${choice.name}</strong>
          <small>${choice.desc}</small>
        </span>
      </button>`
    )
    .join("");

  list.querySelectorAll(".run-modifier-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-mod-id");
      const choice = choices.find((entry) => entry.id === id);
      if (choice) applyRunModifierChoice(choice);
      closeRunModifierPick();
    });
  });

  overlay.classList.add("open");
}

function closeRunModifierPick() {
  const overlay = document.getElementById("run-modifier-modal");
  if (overlay) overlay.classList.remove("open");
  resumeAfterRunModifierPick();
}

function applyRunModifierChoice(choice) {
  if (!runModifiers) runModifiers = createDefaultRunModifiers();
  choice.apply(runModifiers);
  runModifiers.picks += 1;
  showMilestone(`${choice.emoji} ${choice.name} acquired!`);
}

function resumeAfterRunModifierPick() {
  pendingModifierWave = null;
  if (paused && pauseReason === "modifier") {
    paused = false;
    pauseReason = null;
    updateUI();
  }
  if (gameRunning && !paused) {
    startWave();
  }
}

function maybeOfferRunModifier(clearedWave) {
  if (typeof gameMode !== "undefined" && gameMode === "freeplay") return false;
  if (clearedWave <= 0 || clearedWave % 5 !== 0) return false;
  const overlay = document.getElementById("run-modifier-modal");
  if (!overlay) return false;
  openRunModifierPick(clearedWave);
  return true;
}

const GAME_SFX_FILES = {
  "gun-pistol": "sounds/gun-pistol.wav?v=8",
  "gun-smg": "sounds/gun-smg.wav?v=8",
  "gun-rifle": "sounds/gun-rifle.wav?v=8",
  "gun-shotgun": "sounds/gun-shotgun.wav?v=8",
  "xp-pickup": "sounds/xp-pickup.ogg?v=1",
  "level-up": "sounds/level-up.ogg?v=1"
};

let gameSfxBuffers = {};
let gameSfxFailed = {};
let gameSfxLoading = null;

function getSfxMasterVolume() {
  return typeof getSfxVolumeMultiplier === "function" ? getSfxVolumeMultiplier() : 1;
}

function preloadGameSfx() {
  ensureAudio();
  if (!audioCtx || gameSfxLoading) return gameSfxLoading;

  gameSfxLoading = Promise.all(
    Object.entries(GAME_SFX_FILES).map(async ([key, url]) => {
      if (gameSfxBuffers[key] || gameSfxFailed[key]) return;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          gameSfxFailed[key] = true;
          return;
        }
        const data = await response.arrayBuffer();
        gameSfxBuffers[key] = await audioCtx.decodeAudioData(data);
      } catch (error) {
        gameSfxFailed[key] = true;
      }
    })
  );

  return gameSfxLoading;
}

function isGameSfxReady(key) {
  return Boolean(gameSfxBuffers[key]);
}

function isGameSfxFailed(key) {
  return Boolean(gameSfxFailed[key]);
}

function playGunshotSample(key, options = {}) {
  ensureAudio();
  if (!audioCtx || !masterGain) return false;

  const startSample = () => {
    const buffer = gameSfxBuffers[key];
    if (!buffer || audioCtx.state !== "running") return false;

    const now = audioCtx.currentTime;
    const volume = options.volume ?? 0.5;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = options.rate ?? 0.94;

    const warmLow = audioCtx.createBiquadFilter();
    warmLow.type = "lowpass";
    warmLow.frequency.value = 3100;
    warmLow.Q.value = 0.38;

    const dullHigh = audioCtx.createBiquadFilter();
    dullHigh.type = "highshelf";
    dullHigh.frequency.value = 2200;
    dullHigh.gain.value = -10;

    const dullBody = audioCtx.createBiquadFilter();
    dullBody.type = "peaking";
    dullBody.frequency.value = 420;
    dullBody.Q.value = 0.55;
    dullBody.gain.value = 2.5;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.018);
    gain.gain.setTargetAtTime(volume * 0.88, now + 0.08, 0.22);

    source.connect(warmLow);
    warmLow.connect(dullHigh);
    dullHigh.connect(dullBody);
    dullBody.connect(gain);
    gain.connect(masterGain);
    source.start(now);
    return true;
  };

  if (!gameSfxBuffers[key]) {
    if (gameSfxFailed[key]) return false;
    preloadGameSfx()
      ?.then(() => {
        if (gameSfxBuffers[key]) startSample();
      })
      .catch(() => {});
    return false;
  }

  return startSample();
}

function playGameSfx(key, options = {}) {
  ensureAudio();
  if (!audioCtx || !masterGain) return false;

  const startSample = () => {
    const buffer = gameSfxBuffers[key];
    if (!buffer || audioCtx.state !== "running") return false;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = options.rate ?? 1;

    const gain = audioCtx.createGain();
    gain.gain.value = options.volume ?? 1;

    const output =
      options.bus === "levelUp" && typeof levelUpGain !== "undefined" && levelUpGain
        ? levelUpGain
        : masterGain;

    source.connect(gain);

    if (options.lowpass) {
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = options.lowpass;
      filter.Q.value = 0.55;
      gain.connect(filter);
      filter.connect(output);
    } else {
      gain.connect(output);
    }
    source.start(0);
    return true;
  };

  if (!gameSfxBuffers[key]) {
    if (gameSfxFailed[key]) return false;
    preloadGameSfx()
      ?.then(() => {
        if (gameSfxBuffers[key]) startSample();
      })
      .catch(() => {});
    return false;
  }

  return startSample();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof resumeAudio === "function") resumeAudio();
  });
  document.addEventListener(
    "pointerdown",
    () => {
      if (typeof resumeAudio === "function") resumeAudio();
    },
    { once: true }
  );
}

let lastZombieHitSoundAt = 0;
let lastCritSoundAt = 0;
let lastGunshotSoundAt = 0;
let gunshotSoundStack = 0;
let sfxNoiseBuffer = null;

function ensureSfxNoiseBuffer() {
  if (!audioCtx || sfxNoiseBuffer) return;

  const length = Math.floor(audioCtx.sampleRate * 0.18);
  sfxNoiseBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = sfxNoiseBuffer.getChannelData(0);
  let last = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.92 + white * 0.08;
    const fade = Math.pow(1 - i / length, 0.35);
    data[i] = last * fade;
  }
}

function playNoiseBurst(output, config) {
  ensureAudio();
  ensureSfxNoiseBuffer();
  if (!audioCtx || !output || !sfxNoiseBuffer || audioCtx.state !== "running") return;

  const now = audioCtx.currentTime;
  const source = audioCtx.createBufferSource();
  source.buffer = sfxNoiseBuffer;

  const band = audioCtx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = config.bandFreq;
  band.Q.value = config.bandQ ?? 0.9;

  const lowPass = audioCtx.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = config.highCut ?? 2100;
  lowPass.Q.value = 0.45;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(config.peak, now + (config.attack ?? 0.002));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + config.decay);

  source.connect(band);
  band.connect(lowPass);
  lowPass.connect(gain);
  gain.connect(output);
  source.start(now);
  source.stop(now + config.decay + 0.03);
}

function playSoftThump(output, config) {
  if (!audioCtx || !output || audioCtx.state !== "running") return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(config.startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.decay);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(config.peak, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + config.decay);

  osc.connect(gain);
  gain.connect(output);
  osc.start(now);
  osc.stop(now + config.decay + 0.02);
}

function playTone(output, config) {
  if (!audioCtx || !output || audioCtx.state !== "running") return;

  const now = config.startTime ?? audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = config.type || "square";
  osc.frequency.setValueAtTime(config.startFreq, now);
  if (config.endFreq) {
    osc.frequency.exponentialRampToValueAtTime(config.endFreq, now + (config.duration || 0.05));
  }

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(config.peak || 0.03, now + (config.attack || 0.004));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (config.duration || 0.05));

  osc.connect(gain);
  gain.connect(output);
  osc.start(now);
  osc.stop(now + (config.duration || 0.05) + 0.01);
}

function playHitSound(variant = "normal") {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;
  if (variant === "normal" || variant === "heavy") return;

  const nowMs = performance.now();
  if (nowMs - lastZombieHitSoundAt < 90) return;
  lastZombieHitSoundAt = nowMs;

  playSoftThump(masterGain, {
    startFreq: 118,
    endFreq: 82,
    peak: 0.007,
    decay: 0.045
  });
}

function playCritSound() {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;

  const nowMs = performance.now();
  if (nowMs - lastCritSoundAt < 140) return;
  lastCritSoundAt = nowMs;

  const now = audioCtx.currentTime;
  playTone(masterGain, {
    type: "sine",
    startFreq: 523.25,
    endFreq: 659.25,
    peak: 0.016,
    duration: 0.08,
    attack: 0.008,
    startTime: now
  });
  playTone(masterGain, {
    type: "sine",
    startFreq: 784,
    endFreq: 880,
    peak: 0.011,
    duration: 0.09,
    attack: 0.012,
    startTime: now + 0.045
  });
}

let lastStreakSoundAt = 0;

function playStreakMilestoneSound(streak) {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;

  const nowMs = performance.now();
  if (nowMs - lastStreakSoundAt < 420) return;
  lastStreakSoundAt = nowMs;

  const tones = {
    5: [440, 554],
    10: [523, 659, 784],
    15: [587, 740, 932],
    20: [659, 831, 988],
    25: [740, 932, 1175]
  };
  const freqs = tones[streak] || [523, 659];
  const now = audioCtx.currentTime;

  freqs.forEach((freq, index) => {
    playTone(masterGain, {
      type: "sine",
      startFreq: freq * 0.98,
      endFreq: freq * 1.04,
      peak: 0.012 + index * 0.004,
      duration: 0.1 + index * 0.03,
      attack: 0.01,
      startTime: now + index * 0.055
    });
  });
}

let lastXpPickupSoundAt = 0;

function playXpPickupSound() {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;

  const nowMs = performance.now();
  if (nowMs - lastXpPickupSoundAt < 110) return;
  lastXpPickupSoundAt = nowMs;

  if (playGameSfx("xp-pickup", { volume: 0.36 })) return;

  playTone(masterGain, {
    type: "sine",
    startFreq: 523.25,
    endFreq: 659.25,
    peak: 0.01,
    duration: 0.08,
    attack: 0.008
  });
}

function playZombieDeathSound(zombie) {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;

  const isBoss = zombie?.tier === "waveBoss" || zombie?.isWaveBoss || zombie?.tier === "boss";
  const isElite = isBoss || zombie?.tier === "medium" || zombie?.tier === "tank";
  const isRunner = zombie?.archetype === "runner";

  playTone(masterGain, {
    type: "sawtooth",
    startFreq: isBoss ? 118 : isElite ? 148 : isRunner ? 210 : 172,
    endFreq: isBoss ? 38 : isElite ? 58 : 72,
    peak: isBoss ? 0.085 : isElite ? 0.058 : 0.046,
    duration: isBoss ? 0.18 : 0.14,
    attack: 0.008
  });

  playTone(masterGain, {
    type: "square",
    startFreq: isBoss ? 62 : 84,
    endFreq: isBoss ? 28 : 42,
    peak: isBoss ? 0.04 : 0.024,
    duration: isBoss ? 0.22 : 0.12,
    attack: 0.01
  });

  if (isBoss) {
    playTone(masterGain, {
      type: "sine",
      startFreq: 44,
      endFreq: 24,
      peak: 0.06,
      duration: 0.35,
      attack: 0.02
    });
  }
}

function playZombieGroan(zombie) {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;

  const isElite = zombie?.tier === "medium" || zombie?.tier === "tank" || zombie?.tier === "boss";
  playTone(masterGain, {
    type: "sawtooth",
    startFreq: isElite ? 92 + Math.random() * 16 : 118 + Math.random() * 28,
    endFreq: 52 + Math.random() * 18,
    peak: isElite ? 0.028 : 0.02,
    duration: 0.16,
    attack: 0.012
  });
}

function playBossRoar() {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;

  playTone(masterGain, {
    type: "sawtooth",
    startFreq: 84,
    endFreq: 34,
    peak: 0.11,
    duration: 0.55,
    attack: 0.025
  });

  playTone(masterGain, {
    type: "square",
    startFreq: 52,
    endFreq: 22,
    peak: 0.075,
    duration: 0.62,
    attack: 0.03
  });

  playTone(masterGain, {
    type: "sine",
    startFreq: 38,
    endFreq: 18,
    peak: 0.09,
    duration: 0.72,
    attack: 0.04
  });

  playTone(masterGain, {
    type: "triangle",
    startFreq: 130,
    endFreq: 58,
    peak: 0.035,
    duration: 0.28,
    attack: 0.08
  });
}

function playUpgradeDingNow() {
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;

  const notes = [659.25, 830.61, 987.77];
  const base = audioCtx.currentTime;
  notes.forEach((freq, index) => {
    const startTime = base + index * 0.085;
    playTone(masterGain, {
      type: "triangle",
      startFreq: freq,
      endFreq: freq * 1.01,
      peak: 0.055 - index * 0.008,
      duration: 0.16,
      attack: 0.006,
      startTime
    });
    playTone(masterGain, {
      type: "sine",
      startFreq: freq * 2,
      endFreq: freq * 2.01,
      peak: 0.018,
      duration: 0.12,
      attack: 0.006,
      startTime: startTime + 0.01
    });
  });
}

function playUpgradeDing() {
  ensureAudio();
  if (!audioCtx || !masterGain) return;

  if (audioCtx.state === "suspended") {
    audioCtx.resume().then(playUpgradeDingNow).catch(() => {});
    return;
  }

  playUpgradeDingNow();
}

function playSpitSound() {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.1);
}

function playExplosionSound() {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.22);
}

function playDeathSound() {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.55);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.6);
}

function enhanceGunshotNow() {}

resetProRunState();
