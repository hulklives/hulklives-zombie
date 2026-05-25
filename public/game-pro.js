/* Pro features: combat juice, enemy archetypes, run modifiers, boss phases */

let screenShake = 0;
let hurtFlash = 0;
let hitStopFrames = 0;
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
    speedMult: 1.48,
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
  hitStopFrames = 0;
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
  if (screenShake <= 0) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * screenShake * 2.2,
    y: (Math.random() - 0.5) * screenShake * 2.2
  };
}

function spawnDamageNumber(x, y, damage, options = {}) {
  if (typeof floatingTexts === "undefined") return;
  floatingTexts.push({
    x,
    y,
    text: String(Math.max(1, Math.round(damage))),
    color: options.color || "#fff4a8",
    scale: options.big ? 1.05 : 0.82,
    life: 24,
    maxLife: 24,
    vy: -1.35,
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
  const powerEase = clamp(profile.powerMult / 6, 0.35, 1.35);

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
      z.x -= ((playerCenterX - zombieCenterX) / Math.max(dist, 1)) * (z.speed || 1);
      z.y -= ((playerCenterY - zombieCenterY) / Math.max(dist, 1)) * (z.speed || 1);
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
        clamp(profile.powerMult * 0.04, 0.7, 1.6)
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
    zombie.speed *= 1.18;
    spawnBossMinions(3);
    showMilestone("👹 Boss Phase 2 — minions incoming!");
    playBossRoar();
    addScreenShake(5);
  } else if (zombie.bossPhase === 2 && ratio <= 0.33) {
    zombie.bossPhase = 3;
    zombie.speed *= 1.22;
    zombie.damage = Math.round((zombie.damage || 12) * 1.2);
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
  return hitStopFrames > 0 || (deathSequence && deathSequence.active);
}

function tickProFrame() {
  if (hitStopFrames > 0) hitStopFrames -= 1;
  updateScreenShake();
  if (deathSequence?.active) updateDeathSequence();
}

function startDeathSequence() {
  deathSequence = { active: true, timer: 52 };
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

function playHitSound() {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(180 + Math.random() * 40, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.06);
}

function playZombieDeathSound(zombie) {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;
  const isBig = zombie?.tier === "waveBoss" || zombie?.isWaveBoss || zombie?.tier === "boss";
  const osc = audioCtx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(isBig ? 120 : 160, now);
  osc.frequency.exponentialRampToValueAtTime(isBig ? 45 : 70, now + 0.12);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(isBig ? 0.07 : 0.045, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.15);
}

function playBossRoar() {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(70, now);
  osc.frequency.exponentialRampToValueAtTime(38, now + 0.35);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.45);
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

function enhanceGunshotNow() {
  ensureAudio();
  if (!audioCtx || !masterGain || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;
  const noise = audioCtx.createOscillator();
  noise.type = "square";
  noise.frequency.setValueAtTime(820, now);
  noise.frequency.exponentialRampToValueAtTime(120, now + 0.03);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.025, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  noise.connect(gain);
  gain.connect(masterGain);
  noise.start(now);
  noise.stop(now + 0.04);
}

resetProRunState();
