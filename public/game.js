const c = document.getElementById("c");

const ctx = c ? c.getContext("2d") : null;

const startOverlay = document.getElementById("nick");
const startMenuOverlay = document.getElementById("start-menu");
const tutorialOverlay = document.getElementById("tutorial-overlay");

const gameOverOverlay = document.getElementById("gameover");

const playerNameInput = document.getElementById("player-name");
const playerPasswordInput = document.getElementById("player-password");

const skillPointsDisplay = document.getElementById("skill-points");

const hpLevelDisplay = document.getElementById("hp-level");

const bulletSpeedLevelDisplay = document.getElementById("bullet-speed-level");



const VIEW_WIDTH = 1280;

const VIEW_HEIGHT = 800;

if (c) {
  c.width = VIEW_WIDTH;
  c.height = VIEW_HEIGHT;
}

const WORLD_WIDTH = 2200;

const WORLD_HEIGHT = 1400;


const BONUS_OFFER_CHANCE = 0.18;
const BONUS_OFFER_DURATION_MS = 18000;
const BONUS_WIN_CHANCE = 0.5;
const BONUS_REWARD_SP = 20;
const HP_PICKUP_SIZE = 58;
const HP_PICKUP_LIFE_FRAMES = 540;
const HP_PICKUP_SPAWN_COOLDOWN_MS = 20000;
const HP_PICKUP_LOW_HP_RATIO = 0.4;
const HP_PICKUP_HEAL_RATIO = 0.28;
const ZOMBIE_DAMAGE_TUNE = 0.58;
const ZOMBIE_SPEED_TUNE = 1.26;
const PROGRESSION_UPGRADED_NORMAL_TTK = 5.15;
const PROGRESSION_MAX_STRONG_RATIO = 0.3;
const PROGRESSION_MIN_STRONG_RATIO = 0.08;
const ZOMBIE_SWARM_EXTRA_PER_CONTACT = 0.08;
const ZOMBIE_FULL_DAMAGE_CONTACTS = 4;
const ZOMBIE_EXTRA_CONTACT_DAMAGE_FACTOR = 0.32;
const ZOMBIE_MAX_DAMAGE_PER_TICK_RATIO = 0.048;
const SKILL_POINT_KILL_INTERVAL = 5;
const WAVE_BOSS_INTERVAL = 10;
const WAVE_BOSS_COUNT = 3;
const WAVE_BOSS_BASE_SIZE = 138;
const WAVE_BOSS_MAX_SIZE = 212;
const WAVE_BOSS_SPEED_CAP_VS_PLAYER = [0.84, 0.91, 0.97];
const WAVE_BOSS_CLOSE_CHASE_MULT = 0.58;
const WAVE_BOSS_SP_REWARD = 30;
const WAVE_BOSS_XP_REWARD = 150;

const ARENA_HUE = 118;

const ACHIEVEMENTS = [
  { id: "w10", type: "wave", target: 10, name: "Survivor", desc: "Cleared wave 10", emoji: "🛡️" },
  { id: "w25", type: "wave", target: 25, name: "Veteran", desc: "Cleared wave 25", emoji: "⚔️" },
  { id: "w50", type: "wave", target: 50, name: "Elite", desc: "Cleared wave 50", emoji: "🔥" },
  { id: "w75", type: "wave", target: 75, name: "Legend", desc: "Cleared wave 75", emoji: "👑" },
  { id: "w100", type: "wave", target: 100, name: "Immortal", desc: "Cleared wave 100", emoji: "💀" },
  { id: "k500", type: "kills", target: 500, name: "Slayer", desc: "500 total kills", emoji: "🗡️" },
  { id: "k2000", type: "kills", target: 2000, name: "Hunter", desc: "2,000 total kills", emoji: "🎯" },
  { id: "k5000", type: "kills", target: 5000, name: "Mass Murderer", desc: "5,000 total kills", emoji: "☠️" },
  { id: "lvl30", type: "level", target: 30, name: "Upgraded", desc: "Reach level 30", emoji: "⭐" },
  { id: "lvl50", type: "level", target: 50, name: "Master", desc: "Reach level 50", emoji: "🏆" }
];

const MONTHLY_ACHIEVEMENTS = {
  "2026-05": {
    id: "month-2026-05",
    target: 8000,
    name: "May Slayer",
    desc: "8,000 kills in May",
    emoji: "🌸",
    monthLabel: "May 2026"
  },
  "2026-06": {
    id: "month-2026-06",
    target: 10000,
    name: "June Slayer",
    desc: "10,000 kills in June",
    emoji: "☀️",
    monthLabel: "June 2026"
  }
};

const WEAPONS = [
  {
    id: "pistol",
    hotkey: "1",
    name: "Pistol",
    emoji: "🔫",
    desc: "Balanced — good for everything",
    damageMult: 1,
    speedMult: 1,
    cooldownMult: 1,
    pellets: 1,
    spread: 0,
    color: "#d4b84a",
    unlockCost: 0
  },
  {
    id: "smg",
    hotkey: "2",
    name: "SMG",
    emoji: "⚡",
    desc: "Fast fire, slightly lower damage",
    damageMult: 0.72,
    speedMult: 1.12,
    cooldownMult: 0.4,
    pellets: 1,
    spread: 0.1,
    color: "#7cf0ff",
    unlockCost: 50
  },
  {
    id: "shotgun",
    hotkey: "3",
    name: "Shotgun",
    emoji: "💥",
    desc: "4 pellets in a spread",
    damageMult: 0.68,
    speedMult: 0.86,
    cooldownMult: 1.75,
    pellets: 4,
    spread: 0.38,
    color: "#ff8844",
    unlockCost: 100
  },
  {
    id: "rifle",
    hotkey: "4",
    name: "Rifle",
    emoji: "🎯",
    desc: "Heavy damage, slower shots",
    damageMult: 2.15,
    speedMult: 1.38,
    cooldownMult: 1.32,
    pellets: 1,
    spread: 0.03,
    color: "#ffe566",
    unlockCost: 150
  }
];

const WAVE_EVENTS = [
  { id: "normal", name: "Normal", emoji: "🌿", msg: "Normal wave", tint: null },
  { id: "doublexp", name: "Double XP", emoji: "⭐", msg: "2x XP per kill!", xpMult: 2, tint: "rgba(255,220,80,0.14)" },
  { id: "loot", name: "Loot Wave", emoji: "💰", msg: "+2 skill points if you clear it!", skillOnClear: 2, tint: "rgba(255,200,50,0.12)" },
  { id: "speed", name: "Speed Boost", emoji: "⚡", msg: "You run faster!", speedMult: 1.45, tint: "rgba(100,200,255,0.12)" },
  { id: "rage", name: "Rage Wave", emoji: "🔥", msg: "Fast zombies, extra XP!", zombieSpeedMult: 1.35, xpMult: 1.5, tint: "rgba(255,80,60,0.14)" },
  { id: "chill", name: "Chill Wave", emoji: "😎", msg: "You take less damage!", damageMult: 0.5, tint: "rgba(120,200,255,0.12)" },
  { id: "boss", name: "Boss Wave", emoji: "👹", msg: "Mini-boss + horde!", bossWave: true, tint: "rgba(180,80,255,0.14)" }
];



const SPRITE_VERSION = 35;

function loadSpriteSheet(relativePath, frameCount, frameWidth, frameHeight, meta = {}) {
  const sheet = { img: new Image(), frameCount, frameWidth, frameHeight, ready: false, ...meta };
  sheet.img.onload = () => {
    sheet.ready = true;
  };
  sheet.img.src = `${relativePath}?v=${SPRITE_VERSION}`;
  return sheet;
}

function loadStaticImage(relativePath, meta = {}) {
  const sheet = {
    img: new Image(),
    frameCount: 1,
    frameWidth: meta.frameWidth || 256,
    frameHeight: meta.frameHeight || 256,
    ready: false,
    ...meta
  };
  sheet.img.onload = () => {
    if (sheet.img.naturalWidth > 0 && sheet.img.naturalHeight > 0) {
      sheet.frameWidth = sheet.img.naturalWidth;
      sheet.frameHeight = sheet.img.naturalHeight;
    }
    sheet.ready = true;
  };
  sheet.img.src = `${relativePath}?v=${SPRITE_VERSION}`;
  return sheet;
}

const TERRAIN_TILE = 48;
const BACKGROUND_VERSION = 4;
const BACKGROUND_TILE = 512;
let groundCache = { ready: false, canvas: null };
const backgroundFloor = new Image();
backgroundFloor.src = `images/background/flesh-floor.png?v=${BACKGROUND_VERSION}`;
backgroundFloor.onload = () => {
  groundCache.ready = false;
};

function backgroundTextureReady() {
  return backgroundFloor.complete && backgroundFloor.naturalWidth > 0;
}

function hash2D(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 41.9) * 43758.5453;
  return n - Math.floor(n);
}

const ARENA_FOREST_BUSHES = (() => {
  const bushes = [];

  function pushCluster(cx, cy, clusterSeed, count, spread, minRadius, maxRadius) {
    for (let i = 0; i < count; i += 1) {
      const angle = hash2D(clusterSeed, i, 801) * Math.PI * 2;
      const dist = hash2D(clusterSeed, i, 802) * spread;
      bushes.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        radius: minRadius + hash2D(clusterSeed, i, 803) * (maxRadius - minRadius),
        rot: hash2D(clusterSeed, i, 804) * Math.PI * 2,
        alpha: 0.82 + hash2D(clusterSeed, i, 805) * 0.16
      });
    }
  }

  const corners = [
    { x: 92, y: 92 },
    { x: WORLD_WIDTH - 92, y: 92 },
    { x: 92, y: WORLD_HEIGHT - 92 },
    { x: WORLD_WIDTH - 92, y: WORLD_HEIGHT - 92 }
  ];
  for (let c = 0; c < corners.length; c += 1) {
    const count = 8 + Math.floor(hash2D(c, 0, 800) * 4);
    pushCluster(corners[c].x, corners[c].y, c + 10, count, 96, 52, 92);
  }

  const clusterCenters = [];
  let seed = 0;
  while (clusterCenters.length < 11 && seed < 220) {
    const cx = 170 + hash2D(seed, 1, 810) * (WORLD_WIDTH - 340);
    const cy = 170 + hash2D(seed, 2, 811) * (WORLD_HEIGHT - 340);
    seed += 1;
    if (Math.hypot(cx - WORLD_WIDTH / 2, cy - WORLD_HEIGHT / 2) < 340) continue;
    if (clusterCenters.some((center) => Math.hypot(center.x - cx, center.y - cy) < 240)) continue;
    clusterCenters.push({ x: cx, y: cy });
  }

  for (let c = 0; c < clusterCenters.length; c += 1) {
    const { x, y } = clusterCenters[c];
    const count = 6 + Math.floor(hash2D(c, 9, 812) * 5);
    pushCluster(x, y, c + 40, count, 78, 42, 76);
  }

  return bushes.sort((a, b) => b.radius - a.radius);
})();

const ARENA_SCATTER_STONES = (() => {
  const stones = [];
  let seed = 0;
  while (stones.length < 14 && seed < 400) {
    const x = 150 + hash2D(seed, 1, 820) * (WORLD_WIDTH - 300);
    const y = 150 + hash2D(seed, 2, 821) * (WORLD_HEIGHT - 300);
    seed += 1;
    if (Math.hypot(x - WORLD_WIDTH / 2, y - WORLD_HEIGHT / 2) < 270) continue;
    if (ARENA_FOREST_BUSHES.some((bush) => Math.hypot(bush.x - x, bush.y - y) < bush.radius * 0.75)) continue;
    if (hash2D(seed, 3, 822) < 0.42) continue;
    stones.push({
      x,
      y,
      alpha: 0.74 + hash2D(seed, 5, 824) * 0.2
    });
  }
  return stones;
})();

function drawTopDownBush(drawCtx, x, y, radius, theme, rot = 0) {
  drawCtx.save();
  drawCtx.translate(x, y);
  drawCtx.rotate(rot);

  drawCtx.fillStyle = "rgba(0,0,0,0.24)";
  drawCtx.beginPath();
  drawCtx.ellipse(radius * 0.06, radius * 0.18, radius * 0.58, radius * 0.22, 0.25, 0, Math.PI * 2);
  drawCtx.fill();

  drawCtx.fillStyle = "rgba(88, 58, 34, 0.95)";
  drawCtx.beginPath();
  drawCtx.ellipse(0, radius * 0.06, radius * 0.14, radius * 0.17, 0, 0, Math.PI * 2);
  drawCtx.fill();
  drawCtx.strokeStyle = "rgba(0,0,0,0.28)";
  drawCtx.lineWidth = Math.max(1.1, radius * 0.018);
  drawCtx.stroke();

  const lobes = [
    { ox: -radius * 0.38, oy: -radius * 0.12, rx: radius * 0.38, ry: radius * 0.3, rot: -0.45, shade: theme.grassDark },
    { ox: radius * 0.34, oy: -radius * 0.16, rx: radius * 0.34, ry: radius * 0.28, rot: 0.4, shade: theme.grass },
    { ox: 0.04, oy: -radius * 0.4, rx: radius * 0.4, ry: radius * 0.32, rot: 0.12, shade: theme.grassLight },
    { ox: -radius * 0.08, oy: -radius * 0.04, rx: radius * 0.3, ry: radius * 0.24, rot: -0.2, shade: theme.grassDark },
    { ox: radius * 0.12, oy: -radius * 0.02, rx: radius * 0.26, ry: radius * 0.22, rot: 0.55, shade: theme.grass }
  ];

  if (radius > 36) {
    lobes.push(
      { ox: -radius * 0.5, oy: radius * 0.08, rx: radius * 0.3, ry: radius * 0.24, rot: -0.15, shade: theme.grassDark },
      { ox: radius * 0.48, oy: radius * 0.06, rx: radius * 0.28, ry: radius * 0.22, rot: 0.28, shade: theme.grassDark },
      { ox: -radius * 0.18, oy: radius * 0.14, rx: radius * 0.24, ry: radius * 0.18, rot: 0.62, shade: theme.grass }
    );
  }

  for (const lobe of lobes) {
    drawCtx.save();
    drawCtx.translate(lobe.ox, lobe.oy);
    drawCtx.rotate(lobe.rot);
    drawCtx.fillStyle = lobe.shade;
    drawCtx.globalAlpha = 0.9;
    drawCtx.beginPath();
    drawCtx.ellipse(0, 0, lobe.rx, lobe.ry, 0, 0, Math.PI * 2);
    drawCtx.fill();
    drawCtx.strokeStyle = "rgba(0,0,0,0.14)";
    drawCtx.lineWidth = Math.max(1, radius * 0.014);
    drawCtx.stroke();
    drawCtx.restore();
  }

  drawCtx.restore();
}

function drawGroundStone(drawCtx, x, y, theme, seed) {
  const size = 3 + hash2D(seed, 8, 504) * 7;
  const rot = hash2D(seed, 9, 505) * Math.PI;
  drawCtx.save();
  drawCtx.translate(x, y);
  drawCtx.rotate(rot);
  drawCtx.fillStyle = theme.path;
  drawCtx.globalAlpha = 0.34 + hash2D(seed, 10, 506) * 0.24;
  drawCtx.beginPath();
  drawCtx.ellipse(0, 0, size * 1.15, size * 0.82, 0, 0, Math.PI * 2);
  drawCtx.fill();
  drawCtx.restore();
}

function drawGrassTuft(drawCtx, x, y, theme, seed) {
  const blades = 4 + Math.floor(hash2D(seed, 11, 507) * 4);
  drawCtx.save();
  drawCtx.translate(x, y);
  for (let b = 0; b < blades; b += 1) {
    const ang = -Math.PI / 2 + (hash2D(seed, b, 508) - 0.5) * 1.15;
    const len = 4 + hash2D(seed, b + 3, 509) * 8;
    drawCtx.strokeStyle = hash2D(seed, b, 510) > 0.5 ? theme.grassLight : theme.grassDark;
    drawCtx.globalAlpha = 0.34 + hash2D(seed, b, 511) * 0.28;
    drawCtx.lineWidth = 1.1;
    drawCtx.beginPath();
    drawCtx.moveTo(0, 0);
    drawCtx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
    drawCtx.stroke();
  }
  drawCtx.restore();
}

function drawDirtPatch(drawCtx, x, y, theme, seed) {
  const rx = 8 + hash2D(seed, 12, 512) * 16;
  const ry = 6 + hash2D(seed, 13, 513) * 12;
  drawCtx.fillStyle = theme.groundDark;
  drawCtx.globalAlpha = 0.12 + hash2D(seed, 14, 514) * 0.1;
  drawCtx.beginPath();
  drawCtx.ellipse(x, y, rx, ry, hash2D(seed, 15, 515) * Math.PI, 0, Math.PI * 2);
  drawCtx.fill();
}

function paintGroundDecor(drawCtx, theme) {
  for (let i = 0; i < 165; i += 1) {
    const x = hash2D(i, 1, 501) * WORLD_WIDTH;
    const y = hash2D(i, 2, 502) * WORLD_HEIGHT;
    if (Math.hypot(x - WORLD_WIDTH / 2, y - WORLD_HEIGHT / 2) < 210) continue;
    const kind = hash2D(i, 3, 503);
    if (kind < 0.42) drawGrassTuft(drawCtx, x, y, theme, i);
    else if (kind < 0.78) drawGroundStone(drawCtx, x, y, theme, i);
    else drawDirtPatch(drawCtx, x, y, theme, i);
  }
  drawCtx.globalAlpha = 1;
}


function buildGroundCanvas(theme) {
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_WIDTH;
  canvas.height = WORLD_HEIGHT;
  const g = canvas.getContext("2d");
  const cx = WORLD_WIDTH / 2;
  const cy = WORLD_HEIGHT / 2;
  const maxR = Math.hypot(cx, cy);

  if (backgroundTextureReady()) {
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < WORLD_HEIGHT; y += BACKGROUND_TILE) {
      for (let x = 0; x < WORLD_WIDTH; x += BACKGROUND_TILE) {
        g.drawImage(backgroundFloor, x, y, BACKGROUND_TILE, BACKGROUND_TILE);
      }
    }

    const wash = g.createRadialGradient(cx, cy, maxR * 0.04, cx, cy, maxR);
    wash.addColorStop(0, "rgba(90,12,12,0.06)");
    wash.addColorStop(0.45, "rgba(45,6,6,0.14)");
    wash.addColorStop(1, "rgba(12,0,0,0.32)");
    g.fillStyle = wash;
    g.globalAlpha = 1;
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    g.globalAlpha = 1;

    g.strokeStyle = "rgba(40,8,8,0.35)";
    g.lineWidth = 1;
    g.globalAlpha = 0.05;
    for (let x = 0; x <= WORLD_WIDTH; x += 128) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, WORLD_HEIGHT);
      g.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 128) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(WORLD_WIDTH, y);
      g.stroke();
    }
    g.globalAlpha = 1;

    for (let i = 0; i < 2800; i++) {
      const px = hash2D(i, 1, 3) * WORLD_WIDTH;
      const py = hash2D(i, 2, 5) * WORLD_HEIGHT;
      g.fillStyle = theme.speckle;
      g.globalAlpha = 0.025 + hash2D(i, 4, 1) * 0.05;
      g.fillRect(px, py, 1, 1);
    }
    g.globalAlpha = 1;
  } else {
    const base = g.createRadialGradient(cx, cy, maxR * 0.08, cx, cy, maxR);
    base.addColorStop(0, theme.groundLight);
    base.addColorStop(0.5, theme.groundMid);
    base.addColorStop(1, theme.groundDark);
    g.fillStyle = base;
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const tile = TERRAIN_TILE;
    for (let y = 0; y < WORLD_HEIGHT; y += tile) {
      for (let x = 0; x < WORLD_WIDTH; x += tile) {
        const h = hash2D(x / tile, y / tile, theme.patternStyle);
        if (h > 0.78) {
          g.fillStyle = theme.grassDark;
          g.globalAlpha = 0.28 + (h - 0.78) * 0.9;
          g.fillRect(x + 1, y + 1, tile - 2, tile - 2);
        } else if (h < 0.14) {
          g.fillStyle = theme.grassLight;
          g.globalAlpha = 0.16 + (0.14 - h) * 0.8;
          g.fillRect(x + 1, y + 1, tile - 2, tile - 2);
        }
      }
    }
    g.globalAlpha = 1;
  }

  if (!backgroundTextureReady()) {
    paintGroundDecor(g, theme);
  }

  const vignette = g.createRadialGradient(cx, cy, maxR * 0.22, cx, cy, maxR);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.72, "rgba(0,0,0,0.25)");
  vignette.addColorStop(1, theme.vignette);
  g.fillStyle = vignette;
  g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  return canvas;
}
const playerSprites = {
  move: loadSpriteSheet("images/player-move-sheet-noweapon.png", 20, 280, 240),
  idle: loadSpriteSheet("images/player-idle-sheet-noweapon.png", 20, 280, 240)
};

const USE_ZOMBIE_VARIANT_ART = false;

const zombieSprites = {
  move: loadSpriteSheet("images/zombie-move-sheet.png", 17, 288, 311),
  idle: loadSpriteSheet("images/zombie-idle-sheet.png", 17, 241, 222)
};

const chibiZombieSprites = {
  green: loadStaticImage("images/zombies/chibi/chibi-green.png"),
  teal: loadStaticImage("images/zombies/chibi/chibi-teal.png"),
  pink: loadStaticImage("images/zombies/chibi/chibi-pink.png")
};

function pickZombieSkinStyle() {
  const styles = ["skeleton", "chibi-green", "chibi-teal", "chibi-pink"];
  return styles[Math.floor(Math.random() * styles.length)];
}

function usesChibiZombieSkin(z) {
  if (!z.skinStyle || !z.skinStyle.startsWith("chibi-")) return false;
  const key = z.skinStyle.slice(6);
  return Boolean(chibiZombieSprites[key]?.ready);
}

function getChibiZombieSheet(z) {
  return chibiZombieSprites[z.skinStyle.slice(6)];
}

const ZOMBIE_VARIANT_FRAME_COUNT = 8;
const ZOMBIE_VARIANT_FACING_OFFSET = -Math.PI / 2;

const ZOMBIE_VARIANT_META = {
  normal: {
    idle: { path: "images/zombies/zombie-normal-idle-sheet.png", frameCount: 8, frameWidth: 640, frameHeight: 640 },
    move: { path: "images/zombies/zombie-normal-move-sheet.png", frameCount: 8, frameWidth: 640, frameHeight: 640 },
    sizeMult: 1.32
  },
  tank: {
    idle: { path: "images/zombies/zombie-tank-idle-sheet.png", frameCount: 8, frameWidth: 640, frameHeight: 640 },
    move: { path: "images/zombies/zombie-tank-move-sheet.png", frameCount: 8, frameWidth: 640, frameHeight: 640 },
    sizeMult: 1.36
  },
  boss: {
    idle: { path: "images/zombies/zombie-boss-idle-sheet.png", frameCount: 8, frameWidth: 640, frameHeight: 640 },
    move: { path: "images/zombies/zombie-boss-move-sheet.png", frameCount: 8, frameWidth: 640, frameHeight: 640 },
    sizeMult: 1.42
  },
  golden: {
    idle: { path: "images/zombies/zombie-golden-idle-sheet.png", frameCount: 8, frameWidth: 640, frameHeight: 640 },
    move: { path: "images/zombies/zombie-golden-move-sheet.png", frameCount: 8, frameWidth: 640, frameHeight: 640 },
    sizeMult: 1.28
  }
};

const zombieVariantSets = Object.fromEntries(
  Object.entries(ZOMBIE_VARIANT_META).map(([key, meta]) => [
    key,
    {
      idle: loadSpriteSheet(
        meta.idle.path,
        meta.idle.frameCount,
        meta.idle.frameWidth,
        meta.idle.frameHeight,
        { variant: key, kind: "idle" }
      ),
      move: loadSpriteSheet(
        meta.move.path,
        meta.move.frameCount,
        meta.move.frameWidth,
        meta.move.frameHeight,
        { variant: key, kind: "move" }
      ),
      sizeMult: meta.sizeMult
    }
  ])
);

function getZombieVisualKey(z) {
  if (z.golden) return "golden";
  if (z.tier === "waveBoss" || z.isWaveBoss || z.tier === "boss") return "boss";
  if (z.tier === "tank" || z.tier === "medium") return "tank";
  return "normal";
}

function getZombieVariantSet(z) {
  return zombieVariantSets[getZombieVisualKey(z)];
}

function usesZombieVariantArt(z) {
  if (!USE_ZOMBIE_VARIANT_ART) return false;
  const set = getZombieVariantSet(z);
  return Boolean(set?.move?.ready || set?.idle?.ready);
}

function getZombieDrawSheet(z) {
  if (usesChibiZombieSkin(z)) {
    return getChibiZombieSheet(z);
  }
  const set = getZombieVariantSet(z);
  if (usesZombieVariantArt(z)) {
    const moving = (z.animTick || 0) > 0;
    if (moving && set.move?.ready) return set.move;
    if (set.idle?.ready) return set.idle;
    return set.move?.ready ? set.move : set.idle;
  }
  return (z.animTick || 0) > 0 ? zombieSprites.move : zombieSprites.idle;
}

function getChibiZombieFacing(z) {
  const pcx = player.x + PLAYER_SIZE / 2;
  const pcy = player.y + PLAYER_SIZE / 2;
  const zcx = z.x + z.size / 2;
  const zcy = z.y + z.size / 2;
  const dx = pcx - zcx;
  const dy = pcy - zcy;
  const dist = Math.max(Math.hypot(dx, dy), 1);
  const faceRight = dx >= 0;
  const lean = Math.max(-0.42, Math.min(0.42, (dy / dist) * 0.42));

  return {
    squashX: faceRight ? 1 : -1,
    angle: lean
  };
}

function getZombieDrawMotion(z) {
  if (usesChibiZombieSkin(z)) {
    const moving = (z.animTick || 0) > 0;
    const facing = getChibiZombieFacing(z);
    const bob = moving ? Math.sin((z.animFrame || 0) * 0.65) * z.size * 0.035 : 0;
    return {
      frame: 0,
      cyOffset: bob,
      angle: facing.angle,
      squashX: facing.squashX,
      drawSize: z.size * 1.22,
      anchor: "center"
    };
  }

  if (!usesZombieVariantArt(z)) {
    return {
      frame: z.animFrame || 0,
      cyOffset: 0,
      angle: z.facingAngle || 0,
      squashX: 1,
      drawSize: z.size,
      anchor: "center"
    };
  }

  const set = getZombieVariantSet(z);
  const moving = (z.animTick || 0) > 0;
  const drawSize = z.size * (set.sizeMult || 1);

  return {
    frame: moving ? z.animFrame || 0 : 0,
    cyOffset: z.size * 0.12,
    angle: (z.facingAngle || 0) + ZOMBIE_VARIANT_FACING_OFFSET,
    squashX: 1,
    drawSize,
    shadowY: z.y + z.size * 0.94,
    shadowSize: drawSize * 0.38,
    anchor: "center"
  };
}

const PLAYER_SIZE = 120;
const PLAYER_VISUAL_SIZE = 97;
const PLAYER_SQUASH_X = 0.74;
const ZOMBIE_DRAW_SIZE = 86;

const PLAYER_SPRITE_SCALE = PLAYER_SIZE / 280;
const WEAPON_GRIP_OFFSET_X = 44 * PLAYER_SPRITE_SCALE;
const WEAPON_GRIP_OFFSET_Y = 4 * PLAYER_SPRITE_SCALE;
const WEAPON_HAND_TILT = 0;

const WEAPON_SPRITE_META = {
  pistol: {
    width: 120,
    height: 56,
    gripX: 34,
    gripY: 28,
    muzzleX: 108,
    muzzleY: 28,
    scale: 0.44,
    gripFineX: 0,
    gripFineY: 0
  },
  smg: {
    width: 176,
    height: 78,
    gripX: 56,
    gripY: 38,
    muzzleX: 164,
    muzzleY: 36,
    scale: 0.38,
    gripFineX: 0,
    gripFineY: 0
  },
  shotgun: {
    width: 188,
    height: 76,
    gripX: 58,
    gripY: 38,
    muzzleX: 176,
    muzzleY: 36,
    scale: 0.36,
    gripFineX: 0,
    gripFineY: 0
  },
  rifle: {
    width: 204,
    height: 76,
    gripX: 62,
    gripY: 38,
    muzzleX: 192,
    muzzleY: 36,
    scale: 0.3,
    gripFineX: -10,
    gripFineY: 2
  }
};

function loadWeaponSprite(weaponId) {
  const meta = WEAPON_SPRITE_META[weaponId];
  const sprite = { id: weaponId, img: new Image(), ready: false, ...meta };
  sprite.img.onload = () => {
    sprite.ready = true;
  };
  sprite.img.src = `images/weapon-${weaponId}.png?v=${SPRITE_VERSION}`;
  return sprite;
}

const weaponSprites = Object.fromEntries(
  WEAPONS.map((weapon) => [weapon.id, loadWeaponSprite(weapon.id)])
);

let playerAnimFrame = 0;
let playerAnimTick = 0;

const BULLET_SIZE = 7;

const BASE_SHOOT_VOLUME = 0.24;
const BASE_LEVELUP_VOLUME = 0.52;

let audioCtx = null;

let masterGain = null;
let levelUpGain = null;



function ensureAudio() {
  if (audioCtx) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioCtx = new AudioContextClass();
  masterGain = audioCtx.createGain();
  applyAudioSettings();
  masterGain.connect(audioCtx.destination);

  levelUpGain = audioCtx.createGain();
  levelUpGain.connect(audioCtx.destination);
  applyAudioSettings();
  preloadGameSfx();
}

function resumeAudio() {
  ensureAudio();
  if (typeof preloadGameSfx === "function") preloadGameSfx();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

const WEAPON_SHOT_GAPS = {
  pistol: 105,
  smg: 78,
  shotgun: 260,
  rifle: 180
};

const WEAPON_SHOT_VOLUMES = {
  pistol: 0.52,
  smg: 0.44,
  shotgun: 0.58,
  rifle: 0.54
};

const WEAPON_SHOT_RATES = {
  pistol: 0.9,
  smg: 0.92,
  shotgun: 0.88,
  rifle: 0.86
};

function playGunshot() {
  // Skottljud av — visuell feedback via muzzle flash + recoil räcker.
}

function playLevelUpNow() {
  if (!audioCtx || !levelUpGain || audioCtx.state !== "running") return;

  if (typeof playGameSfx === "function" && playGameSfx("level-up", { volume: 0.58, bus: "levelUp" })) {
    return;
  }

  const now = audioCtx.currentTime;
  const output = levelUpGain;
  const notes = [392, 523.25, 659.25];

  notes.forEach((freq, index) => {
    const t = now + index * 0.07;
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(output);
    osc.start(t);
    osc.stop(t + 0.24);
  });
}

function playLevelUp() {
  ensureAudio();
  if (!audioCtx) return;

  if (audioCtx.state === "suspended") {
    audioCtx.resume().then(playLevelUpNow).catch(() => {});
    return;
  }

  playLevelUpNow();
}

const BASE_MUSIC_VOLUME = 0.14;
const SURVIVAL_SECTIONS = [
  {
    notes: [220, 261.63, 329.63],
    bass: 55,
    arp: [220, 261.63, 329.63, 261.63, 220, 0, 329.63, 0],
    arpMs: 680,
    holdMs: 15000
  },
  {
    notes: [174.61, 220, 261.63],
    bass: 43.65,
    arp: [174.61, 220, 261.63, 220, 0, 174.61, 261.63, 220],
    arpMs: 720,
    holdMs: 13200
  },
  {
    notes: [146.83, 174.61, 220],
    bass: 36.7,
    arp: [146.83, 174.61, 220, 174.61, 146.83, 0, 0, 220],
    arpMs: 760,
    holdMs: 14800
  },
  {
    notes: [164.81, 196, 246.94],
    bass: 41.2,
    arp: [164.81, 196, 246.94, 196, 164.81, 246.94, 0, 196],
    arpMs: 640,
    holdMs: 12600
  },
  {
    notes: [196, 233.08, 293.66],
    bass: 49,
    arp: [196, 233.08, 293.66, 233.08, 196, 0, 293.66, 233.08],
    arpMs: 610,
    holdMs: 11800
  },
  {
    notes: [130.81, 164.81, 196],
    bass: 32.7,
    arp: [130.81, 164.81, 196, 0, 164.81, 130.81, 0, 196],
    arpMs: 820,
    holdMs: 16000
  }
];

let musicGain = null;
let musicFilter = null;
let musicPadVoices = [];
let musicBassOsc = null;
let musicTimers = [];
let musicPlaying = false;
let musicSectionIndex = 0;
let musicArpStep = 0;

function getMusicIntensity() {
  if (typeof gameRunning !== "undefined" && !gameRunning) return 0.32;
  if (typeof isFreeplayMode === "function" && isFreeplayMode()) {
    const seconds = typeof freeplayRunSeconds === "number" ? freeplayRunSeconds : 0;
    return clamp(0.42 + seconds * 0.0018, 0.42, 0.92);
  }
  const w = typeof wave === "number" ? wave : 1;
  const horde = typeof zombies !== "undefined" && Array.isArray(zombies) ? zombies.length : 0;
  return clamp(0.38 + w * 0.016 + Math.min(horde, 22) * 0.011, 0.38, 1);
}

function updateMusicFilterForIntensity() {
  if (!musicFilter) return;
  const intensity = getMusicIntensity();
  musicFilter.frequency.value = 760 + intensity * 520;
  musicFilter.Q.value = 0.35 + intensity * 0.18;
}

function rampMusicVolume(target, seconds) {
  if (!audioCtx || !musicGain) return;
  const now = audioCtx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(musicGain.gain.value, now);
  musicGain.gain.linearRampToValueAtTime(target, now + seconds);
}

function getMusicSection() {
  return SURVIVAL_SECTIONS[musicSectionIndex];
}

function playMusicArp(freq, intensity) {
  if (!audioCtx || !musicFilter || !musicPlaying || !freq) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, now);

  const sub = audioCtx.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(freq * 0.5, now);

  const gain = audioCtx.createGain();
  const peak = 0.024 + intensity * 0.022;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.028);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42 + (1 - intensity) * 0.18);

  const subGain = audioCtx.createGain();
  subGain.gain.setValueAtTime(0.001, now);
  subGain.gain.exponentialRampToValueAtTime(peak * 0.35, now + 0.03);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

  osc.connect(gain);
  sub.connect(subGain);
  gain.connect(musicFilter);
  subGain.connect(musicFilter);

  osc.start(now);
  sub.start(now);
  osc.stop(now + 0.65);
  sub.stop(now + 0.55);
}

function playMusicBassPulse(freq, accent = false) {
  if (!audioCtx || !musicFilter || !musicPlaying || !freq) return;

  const now = audioCtx.currentTime;
  const intensity = getMusicIntensity();
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.82, now + 0.12);

  const gain = audioCtx.createGain();
  const peak = (accent ? 0.034 : 0.022) + intensity * 0.014;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (accent ? 0.22 : 0.16));

  osc.connect(gain);
  gain.connect(musicFilter);
  osc.start(now);
  osc.stop(now + 0.24);
}

function setMusicChord(section, glideSeconds) {
  if (!audioCtx || !musicPlaying) return;

  const t = audioCtx.currentTime;
  musicPadVoices.forEach((voice, index) => {
    const freq = section.notes[index];
    const detune = 1 + (index - 1) * 0.0015;
    voice.osc.frequency.linearRampToValueAtTime(freq * detune, t + glideSeconds);
  });

  if (musicBassOsc) {
    musicBassOsc.frequency.linearRampToValueAtTime(section.bass, t + glideSeconds);
  }
}

function scheduleNextMusicArp() {
  if (!musicPlaying || !audioCtx) return;

  const section = getMusicSection();
  const intensity = getMusicIntensity();
  const pattern = section.arp;
  const freq = pattern[musicArpStep % pattern.length];

  playMusicArp(freq, intensity);
  if (musicArpStep % 4 === 0) {
    playMusicBassPulse(section.bass, musicArpStep % 16 === 0);
  }

  musicArpStep += 1;
  const restPad = freq ? 0 : 110;
  const gap = Math.round(section.arpMs * (1.04 - intensity * 0.2) + restPad);
  musicTimers.push(setTimeout(scheduleNextMusicArp, gap));
}

function scheduleNextMusicSection() {
  if (!musicPlaying) return;

  const section = getMusicSection();
  const intensity = getMusicIntensity();
  const holdMs = Math.round(section.holdMs * (1.06 - intensity * 0.24));

  musicTimers.push(
    setTimeout(() => {
      if (!musicPlaying) return;
      musicSectionIndex = (musicSectionIndex + 1) % SURVIVAL_SECTIONS.length;
      musicArpStep = 0;
      setMusicChord(getMusicSection(), 1.8 + intensity * 0.9);
      scheduleNextMusicSection();
    }, holdMs)
  );
}

function clearBackgroundMusicResources() {
  musicTimers.forEach((timer) => {
    clearInterval(timer);
    clearTimeout(timer);
  });
  musicTimers = [];

  musicPadVoices.forEach((voice) => {
    try {
      voice.osc.stop();
    } catch (error) {}
  });
  musicPadVoices = [];

  if (musicBassOsc) {
    try {
      musicBassOsc.stop();
    } catch (error) {}
    musicBassOsc = null;
  }

  musicFilter = null;
  musicArpStep = 0;
  musicSectionIndex = 0;
}

function buildBackgroundMusic() {
  if (!audioCtx || !musicGain) return;

  musicFilter = audioCtx.createBiquadFilter();
  musicFilter.type = "lowpass";
  updateMusicFilterForIntensity();
  musicFilter.connect(musicGain);

  const firstSection = getMusicSection();
  firstSection.notes.forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq * (1 + (index - 1) * 0.0015);

    const voiceGain = audioCtx.createGain();
    voiceGain.gain.value = 0.014;

    osc.connect(voiceGain);
    voiceGain.connect(musicFilter);
    osc.start();

    musicPadVoices.push({ osc });
  });

  musicBassOsc = audioCtx.createOscillator();
  musicBassOsc.type = "sine";
  musicBassOsc.frequency.value = firstSection.bass;
  const bassGain = audioCtx.createGain();
  bassGain.gain.value = 0.008;
  musicBassOsc.connect(bassGain);
  bassGain.connect(musicFilter);
  musicBassOsc.start();

  scheduleNextMusicArp();
  scheduleNextMusicSection();

  musicTimers.push(
    setInterval(() => {
      if (!musicPlaying) return;
      updateMusicFilterForIntensity();
    }, 1800)
  );
}

function startBackgroundMusicNow() {
  if (!audioCtx) return;

  clearBackgroundMusicResources();

  if (!musicGain) {
    musicGain = audioCtx.createGain();
    musicGain.connect(audioCtx.destination);
  }

  musicPlaying = true;
  musicGain.gain.value = 0;
  buildBackgroundMusic();
  rampMusicVolume(getMusicVolumeTarget(), 2.5);
}

function startBackgroundMusic() {
  ensureAudio();
  if (!audioCtx) return;

  if (audioCtx.state === "suspended") {
    audioCtx.resume().then(startBackgroundMusicNow).catch(() => {});
    return;
  }

  startBackgroundMusicNow();
}

function stopBackgroundMusic() {
  if (!musicPlaying || !audioCtx || !musicGain) return;

  musicPlaying = false;
  rampMusicVolume(0, 1.8);

  const stopTimer = setTimeout(() => {
    clearBackgroundMusicResources();
  }, 1900);
  musicTimers.push(stopTimer);
}

const STORAGE_KEY = "hulkLivesSave";

const PLAYER_NAME_KEY = "hulkLivesNickname";
const AUTH_TOKEN_KEY = "hulkLivesAuthToken";
const SOCIAL_FEATURES_ENABLED = false;
window.SOCIAL_FEATURES_ENABLED = SOCIAL_FEATURES_ENABLED;
const SETTINGS_KEY = "hulkLivesSettings";

const DEFAULT_SETTINGS = {
  musicVolume: 100,
  sfxVolume: 100
};

let gameSettings = { ...DEFAULT_SETTINGS };

function clampSettingVolume(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    gameSettings = {
      ...DEFAULT_SETTINGS,
      musicVolume: clampSettingVolume(parsed.musicVolume),
      sfxVolume: clampSettingVolume(parsed.sfxVolume)
    };
  } catch (error) {}
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(gameSettings));
  } catch (error) {}
}

function getSfxVolumeMultiplier() {
  return clampSettingVolume(gameSettings.sfxVolume) / 100;
}

function getMusicVolumeMultiplier() {
  return clampSettingVolume(gameSettings.musicVolume) / 100;
}

function getMusicVolumeTarget() {
  return BASE_MUSIC_VOLUME * getMusicVolumeMultiplier();
}

function applyAudioSettings() {
  if (masterGain) {
    masterGain.gain.value = BASE_SHOOT_VOLUME * getSfxVolumeMultiplier();
  }
  if (levelUpGain) {
    levelUpGain.gain.value = BASE_LEVELUP_VOLUME * getSfxVolumeMultiplier();
  }
  if (musicGain && musicPlaying) {
    musicGain.gain.value = getMusicVolumeTarget();
  }
}

function updateSettingsUI() {
  const musicSlider = document.getElementById("settings-music-volume");
  const sfxSlider = document.getElementById("settings-sfx-volume");
  const musicValue = document.getElementById("settings-music-value");
  const sfxValue = document.getElementById("settings-sfx-value");

  if (musicSlider) musicSlider.value = String(gameSettings.musicVolume);
  if (sfxSlider) sfxSlider.value = String(gameSettings.sfxVolume);
  if (musicValue) musicValue.textContent = `${gameSettings.musicVolume}%`;
  if (sfxValue) sfxValue.textContent = `${gameSettings.sfxVolume}%`;
}

function setMusicVolumeSetting(value) {
  gameSettings.musicVolume = clampSettingVolume(value);
  saveSettings();
  applyAudioSettings();
  updateSettingsUI();
}

function setSfxVolumeSetting(value) {
  gameSettings.sfxVolume = clampSettingVolume(value);
  saveSettings();
  applyAudioSettings();
  updateSettingsUI();
}

function openSettingsMenu() {
  const modal = document.getElementById("settings-modal");
  if (!modal) return;
  if (isStartMenuVisible()) hideStartMenu();
  pauseForRunModal("settings");
  updateSettingsUI();
  modal.classList.add("open");
}

function hideSettingsModal() {
  const modal = document.getElementById("settings-modal");
  if (modal) modal.classList.remove("open");
}

function closeSettingsMenu() {
  const modal = document.getElementById("settings-modal");
  const wasOpen = modal?.classList.contains("open");
  hideSettingsModal();
  if (wasOpen) {
    resumeFromRunModal("settings");
    restoreStartMenuAfterModal();
  }
}

let feedbackCategory = "bug";
let feedbackSubmitting = false;

function setFeedbackCategory(category) {
  feedbackCategory = ["bug", "idea", "other"].includes(category) ? category : "bug";
  document.querySelectorAll(".feedback-category-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.feedbackCategory === feedbackCategory);
  });
}

function getFeedbackContext() {
  const level = getXpProgress(player.totalXp).level;
  let page = "menu";
  if (isNicknameScreenVisible()) page = "login";
  else if (isStartMenuVisible()) page = "start menu";
  else if (isGameOverVisible()) page = "game over";
  else if (gameRunning) page = paused ? "paused game" : "in game";

  return {
    wave: Math.max(0, Number(wave) || 0),
    level,
    gameRunning: Boolean(gameRunning),
    equippedWeapon: equippedWeaponId || "pistol",
    page
  };
}

function updateFeedbackUI() {
  const contextLine = document.getElementById("feedback-context-line");
  const statusEl = document.getElementById("feedback-status");
  const submitBtn = document.getElementById("feedback-submit-btn");
  const context = getFeedbackContext();

  if (contextLine) {
    contextLine.textContent = `Sent from: ${context.page} · Wave ${context.wave} · Level ${context.level} · Weapon ${context.equippedWeapon}`;
  }

  if (submitBtn) {
    submitBtn.disabled = feedbackSubmitting || !authToken;
  }

  if (statusEl && !feedbackSubmitting && statusEl.classList.contains("success")) {
    statusEl.textContent = "";
    statusEl.className = "feedback-status";
  }
}

function setFeedbackStatus(message, type = "") {
  const statusEl = document.getElementById("feedback-status");
  if (!statusEl) return;
  statusEl.textContent = message || "";
  statusEl.className = type ? `feedback-status ${type}` : "feedback-status";
}

function openFeedbackMenu() {
  const modal = document.getElementById("feedback-modal");
  if (!modal) return;

  if (!authToken) {
    showMilestone("Log in to send feedback");
    return;
  }

  pauseForRunModal("feedback");
  feedbackCategory = "bug";
  feedbackSubmitting = false;
  setFeedbackCategory("bug");

  const messageEl = document.getElementById("feedback-message");
  if (messageEl) messageEl.value = "";

  setFeedbackStatus("");
  updateFeedbackUI();
  if (isStartMenuVisible()) hideStartMenu();
  modal.classList.add("open");

  if (messageEl) {
    setTimeout(() => messageEl.focus(), 0);
  }
}

function hideFeedbackModal() {
  const modal = document.getElementById("feedback-modal");
  if (modal) modal.classList.remove("open");
}

function closeFeedbackMenu() {
  const modal = document.getElementById("feedback-modal");
  const wasOpen = modal?.classList.contains("open");
  hideFeedbackModal();
  feedbackSubmitting = false;
  if (wasOpen) {
    resumeFromRunModal("feedback");
    restoreStartMenuAfterModal();
  }
}

async function submitFeedback() {
  if (feedbackSubmitting) return;

  const messageEl = document.getElementById("feedback-message");
  const message = String(messageEl?.value || "").trim();

  if (!authToken) {
    setFeedbackStatus("You must be logged in to send feedback.", "error");
    return;
  }

  if (message.length < 8) {
    setFeedbackStatus("Write at least 8 characters so we understand the issue.", "error");
    return;
  }

  feedbackSubmitting = true;
  updateFeedbackUI();
  setFeedbackStatus("Sending...");

  try {
    const response = await authFetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        category: feedbackCategory,
        message,
        context: getFeedbackContext()
      })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setFeedbackStatus(payload.error || "Could not send right now.", "error");
      feedbackSubmitting = false;
      updateFeedbackUI();
      return;
    }

    if (messageEl) messageEl.value = "";
    setFeedbackStatus("Thanks! Your report was sent to HulkLives.", "success");
    showMilestone("💬 Feedback sent — thanks!");
    feedbackSubmitting = false;
    updateFeedbackUI();
    if (canViewFeedbackInbox) {
      refreshFeedbackInboxCounts();
    }

    setTimeout(() => {
      closeFeedbackMenu();
    }, 900);
  } catch (error) {
    setFeedbackStatus("Could not reach the server. Try again.", "error");
    feedbackSubmitting = false;
    updateFeedbackUI();
  }
}

const FEEDBACK_CATEGORY_LABELS = {
  bug: "Bug",
  idea: "Suggestion",
  feedback: "Feedback",
  other: "Other"
};

function isFeedbackInboxAdminName(name) {
  return isGameAdminName(name);
}

function isGameAdminName(name) {
  return String(name || "").trim().toLowerCase() === "hulklives";
}

function updateFeedbackAdminUI(total = null) {
  updateGameAdminUI(total);
}

function updateGameAdminUI(openReports = null) {
  window.isGameAdmin = isGameAdmin;
  document.querySelectorAll(".game-admin-only, .feedback-admin-only").forEach((el) => {
    el.hidden = !isGameAdmin;
  });

  const countText = openReports === null ? null : String(Math.max(0, Number(openReports) || 0));
  if (countText !== null) {
    const countEl = document.getElementById("feedback-inbox-count");
    const countMenuEl = document.getElementById("feedback-inbox-count-menu");
    const adminBadge = document.getElementById("admin-open-reports-count");
    const adminMenuBadge = document.getElementById("admin-open-reports-count-menu");
    if (countEl) countEl.textContent = countText;
    if (countMenuEl) countMenuEl.textContent = countText;
    if (adminBadge) adminBadge.textContent = countText;
    if (adminMenuBadge) adminMenuBadge.textContent = countText;
  }
}

async function refreshAccountAccess() {
  isGameAdmin = false;
  canViewFeedbackInbox = false;
  if (!authToken) {
    updateGameAdminUI(0);
    return;
  }

  try {
    const response = await authFetch("/api/me");
    if (!response.ok) {
      updateGameAdminUI(0);
      return;
    }

    const payload = await response.json();
    isGameAdmin =
      Boolean(payload.isGameAdmin || payload.canViewFeedbackInbox) &&
      isGameAdminName(payload.username || playerName);
    canViewFeedbackInbox = isGameAdmin;
  } catch (error) {
    isGameAdmin = false;
    canViewFeedbackInbox = false;
  }

  updateGameAdminUI();

  if (isGameAdmin) {
    await refreshFeedbackInboxCounts();
  }
}

async function refreshFeedbackInboxCounts() {
  if (!isGameAdmin) return;

  try {
    const response = await authFetch("/api/feedback/inbox?status=open");
    if (!response.ok) return;
    const payload = await response.json();
    updateGameAdminUI(payload.openTotal ?? payload.total ?? 0);
  } catch (error) {
    // ignore
  }
}

function formatFeedbackTimestamp(value) {
  const date = new Date(Number(value) || 0);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderFeedbackInbox(reports) {
  const list = document.getElementById("feedback-inbox-list");
  if (!list) return;

  if (!reports || reports.length === 0) {
    list.innerHTML = '<div class="lb-empty">No reports yet.</div>';
    return;
  }

  list.innerHTML = reports
    .map((report) => {
      const category = report.category || "other";
      const label = FEEDBACK_CATEGORY_LABELS[category] || FEEDBACK_CATEGORY_LABELS.other;
      const context = report.context || {};
      return `<article class="feedback-report-card ${escapeHtml(category)}">
  <div class="feedback-report-head">
    <span class="feedback-report-user">${escapeHtml(report.username || "Unknown")}</span>
    <span class="feedback-report-time">${escapeHtml(formatFeedbackTimestamp(report.createdAt))}</span>
  </div>
  <span class="feedback-report-tag">${escapeHtml(label)}</span>
  <p class="feedback-report-message">${escapeHtml(report.message || "")}</p>
  <div class="feedback-report-meta">
    <span class="lb-stat">${escapeHtml(context.page || "unknown location")}</span>
    <span class="lb-stat">Wave ${Number(context.wave) || 0}</span>
    <span class="lb-stat">Lv ${Number(context.level) || 1}</span>
    <span class="lb-stat">${escapeHtml(context.equippedWeapon || "pistol")}</span>
  </div>
</article>`;
    })
    .join("");
}

async function refreshFeedbackInbox() {
  const list = document.getElementById("feedback-inbox-list");
  if (!canViewFeedbackInbox) return;

  if (list) {
    list.innerHTML = '<div class="lb-empty">Loading...</div>';
  }

  try {
    const response = await authFetch("/api/feedback/inbox");
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (list) {
        list.innerHTML = `<div class="lb-empty">${escapeHtml(payload.error || "Could not load reports.")}</div>`;
      }
      return;
    }

    renderFeedbackInbox(payload.reports || []);
    updateFeedbackAdminUI(payload.total || 0);
  } catch (error) {
    if (list) {
      list.innerHTML = '<div class="lb-empty">Could not reach the server.</div>';
    }
  }
}

function openFeedbackInboxMenu() {
  const modal = document.getElementById("feedback-inbox-modal");
  if (!modal || !canViewFeedbackInbox) return;

  pauseForRunModal("feedback-inbox");
  modal.classList.add("open");
  refreshFeedbackInbox();
}

function hideFeedbackInboxModal() {
  const modal = document.getElementById("feedback-inbox-modal");
  if (modal) modal.classList.remove("open");
}

function closeFeedbackInboxMenu() {
  const modal = document.getElementById("feedback-inbox-modal");
  const wasOpen = modal?.classList.contains("open");
  hideFeedbackInboxModal();
  if (wasOpen) resumeFromRunModal("feedback-inbox");
}

function hideAchievementsModal() {
  const modal = document.getElementById("achievements-modal");
  if (modal) modal.classList.remove("open");
}

let authToken = "";
let authMode = "login";
let canViewFeedbackInbox = false;
let isGameAdmin = false;
let saveHydrated = false;



let camera = { x: 0, y: 0 };

let lastAnnouncedEventId = null;
let playerBaseSpeed = 4;
let bonusOffer = null;
let hpPickups = [];
let lastHpPickupSpawnAt = 0;

let bestWave = 0;

let unlockedAchievements = new Set();

let monthlyProgress = { monthKey: "", kills: 0 };
let completedMonthlyKeys = new Set();

let unlockedWeapons = new Set(["pistol"]);
let equippedWeaponId = "pistol";
let weaponLevels = { pistol: 0, smg: 0, shotgun: 0, rifle: 0 };

let achievementPopupQueue = [];
let achievementPopupShowing = false;

let runBestWave = 0;



let player = {

  x: WORLD_WIDTH / 2,

  y: WORLD_HEIGHT / 2,

  speed: 4,

  maxHp: 500,

  hp: 500,

  damage: 1,

  bulletSpeed: 10,

  kills: 0,

  totalXp: 0,

  score: 0,

  skillPoints: 0,

  nextSkillPointKill: SKILL_POINT_KILL_INTERVAL,

  hurtCooldown: 0,

  facingAngle: 0,

  weaponRecoil: 0,

  muzzleFlash: 0,

  rewardGlow: 0,

  rewardGlowColor: "#8ef5c8",

  upgrades: {

    hp: 0,

    damage: 0,

    bulletSpeed: 0

  }

};



let zombies = [];

let bullets = [];

let playerBombs = [];
let playerMolotovs = [];
let molotovFireZones = [];
let explosionEffects = [];
let bombCharges = 3;
let bombReadyAt = 0;
let molotovCharges = 2;
let molotovReadyAt = 0;

let muzzleTracers = [];

let bulletAfterglows = [];

let bloodEffects = [];
let floatingTexts = [];
let playerRewardEffects = [];
let playerXpFeed = null;

let keys = {};

let isMouseDown = false;

let mouseTarget = { x: 0, y: 0 };

let playerName = "";

let wave = 1;

let nextWaveTimer = null;
let nextWaveTimerEndsAt = 0;
let nextWaveResumeDelay = null;

let waveInProgress = false;

let paused = false;
let pauseReason = null;

const NEXT_WAVE_DELAY_MS = 2500;

const SHOOT_COOLDOWN = 12;
const BOMB_COOLDOWN_MS = 30000;
const BOMB_MAX_CHARGES = 3;
const BOMB_THROW_SPEED = 8.5;
const BOMB_BLAST_RADIUS = 168;
const BOMB_DAMAGE_MULT = 8.5;
const BOMB_MAX_FLIGHT_MS = 1200;
const BOMB_MAX_RANGE = 420;
const MOLOTOV_COOLDOWN_MS = 18000;
const MOLOTOV_MAX_CHARGES = 2;
const MOLOTOV_THROW_SPEED = 9.2;
const MOLOTOV_MAX_FLIGHT_MS = 1100;
const MOLOTOV_MAX_RANGE = 380;
const MOLOTOV_FIRE_RADIUS = 118;
const MOLOTOV_FIRE_LIFE = 270;
const MOLOTOV_TICK_INTERVAL = 12;
const WAVE_BOSS_ABILITY_DAMAGE_CAP = 0.44;

let gameRunning = false;
let gameMode = "campaign";
let lastGameMode = "campaign";
let runKills = 0;
let freeplaySpawnTick = 0;
let freeplayRunSeconds = 0;
let freeplayPhase = "steady";
let freeplayPhaseTimer = 0;
let freeplayPhaseDuration = 0;
let freeplayArenaTint = null;
let freeplayCombo = 0;
let freeplayComboTimer = 0;
let freeplayBestCombo = 0;
let freeplayLastBossAt = -999;

let animationFrameId = null;

let zombieSpawner = null;
let pendingClearedWave = null;



let leaderboardRefreshTimer = null;
let communityConfig = {
  giveaway: { showComingSoon: true },
  featured: { active: false },
  announcement: { active: false, message: "" },
  live: {
    freeplayEnabled: true,
    bonusOfferChance: 18,
    bonusWinChance: 50
  }
};

let runtimeLiveConfig = {
  freeplayEnabled: true,
  bonusOfferChance: 18,
  bonusWinChance: 50
};

let runtimeAnnouncement = {
  active: false,
  message: ""
};

function getBonusOfferChance() {
  return Math.max(0, Math.min(1, Number(runtimeLiveConfig.bonusOfferChance || 18) / 100));
}

function getBonusWinChance() {
  return Math.max(0, Math.min(1, Number(runtimeLiveConfig.bonusWinChance || 50) / 100));
}

function applyRuntimeConfigFromCommunity(config) {
  communityConfig = config || communityConfig;
  runtimeLiveConfig = {
    freeplayEnabled: config?.live?.freeplayEnabled !== false,
    bonusOfferChance: Number(config?.live?.bonusOfferChance) || 18,
    bonusWinChance: Number(config?.live?.bonusWinChance) || 50
  };
  runtimeAnnouncement = {
    active: Boolean(config?.announcement?.active),
    message: String(config?.announcement?.message || "").trim()
  };
  renderStartMenuAnnouncement();
  updateFreeplayMenuState();

  const bonusCopy = document.querySelector("#bonus-offer p");
  if (bonusCopy) {
    bonusCopy.textContent = `${runtimeLiveConfig.bonusWinChance}% chance for ${BONUS_REWARD_SP} skill points`;
  }
}

function renderStartMenuAnnouncement() {
  const banner = document.getElementById("start-menu-announcement");
  const textEl = document.getElementById("start-menu-announcement-text");
  if (!banner || !textEl) return;

  const show = Boolean(runtimeAnnouncement.active && runtimeAnnouncement.message);
  banner.hidden = !show;
  textEl.textContent = show ? runtimeAnnouncement.message : "";
}

function updateFreeplayMenuState() {
  const freeplayBtn = document.querySelector(".start-menu-freeplay");
  if (!freeplayBtn) return;

  const enabled = runtimeLiveConfig.freeplayEnabled !== false;
  freeplayBtn.disabled = !enabled;
  freeplayBtn.classList.toggle("disabled-mode", !enabled);
  freeplayBtn.title = enabled ? "" : "Freeplay is temporarily disabled.";
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

function getXpProgress(totalXp) {
  let level = 1;
  let xp = Math.max(0, Number(totalXp || 0));
  while (level < 500 && xp >= getXpForNextLevel(level)) {
    xp -= getXpForNextLevel(level);
    level++;
  }
  return {
    level,
    current: xp,
    needed: getXpForNextLevel(level)
  };
}

function getKillXp(zombie) {
  if (zombie?.tier === "waveBoss" || zombie?.isWaveBoss) {
    return Math.round(WAVE_BOSS_XP_REWARD * (getCurrentEvent().xpMult || 1));
  }

  const size = zombie?.size || ZOMBIE_DRAW_SIZE;
  let xp = 3;
  if (size >= 108) xp = 10;
  else if (size >= 92) xp = 6;
  return Math.round(xp * (getCurrentEvent().xpMult || 1));
}

function getZombieRewardKind(zombie) {
  if (zombie?.tier === "waveBoss" || zombie?.isWaveBoss) return "waveBoss";
  if (zombie?.tier === "boss") return "boss";
  if (zombie?.tier === "tank") return "tank";
  if (zombie?.tier === "medium") return "medium";
  return "normal";
}

function getZombieRewardTier(zombie) {
  const kind = getZombieRewardKind(zombie);
  if (kind === "waveBoss") return "waveBoss";
  if (kind !== "normal") return "elite";
  return "normal";
}

const ZOMBIE_REWARD_COLORS = {
  normal: {
    xp: "#8ef5c8",
    sp: "#ffe066",
    ring: "#8ef5c8",
    glow: "#8ef5c8",
    stroke: "rgba(142, 245, 200, 0.55)",
    shadow: "rgba(142, 245, 200, 0.4)",
    sparkles: ["#8ef5c8", "#b8ffe0"]
  },
  medium: {
    xp: "#d4bcff",
    sp: "#ffe066",
    ring: "#a98cff",
    glow: "#a98cff",
    stroke: "rgba(169, 140, 255, 0.58)",
    shadow: "rgba(169, 140, 255, 0.42)",
    sparkles: ["#a98cff", "#dcc8ff"]
  },
  tank: {
    xp: "#ffc56a",
    sp: "#ffe066",
    ring: "#ffb054",
    glow: "#ffb054",
    stroke: "rgba(255, 176, 84, 0.58)",
    shadow: "rgba(255, 176, 84, 0.42)",
    sparkles: ["#ffb054", "#ffd699"]
  },
  boss: {
    xp: "#ddb0ff",
    sp: "#ffe066",
    ring: "#b86cff",
    glow: "#b86cff",
    stroke: "rgba(184, 108, 255, 0.58)",
    shadow: "rgba(184, 108, 255, 0.42)",
    sparkles: ["#b86cff", "#e4c0ff"]
  },
  waveBoss: {
    xp: "#9df7ff",
    sp: "#ff9dff",
    ring: "#9df7ff",
    ring2: "#ffd54a",
    glow: "#9df7ff",
    stroke: "rgba(157, 247, 255, 0.62)",
    shadow: "rgba(157, 247, 255, 0.55)",
    sparkles: ["#9df7ff", "#ff9dff"]
  }
};

function getZombieRewardColors(kind) {
  return ZOMBIE_REWARD_COLORS[kind] || ZOMBIE_REWARD_COLORS.normal;
}

function onZombieKilled(zombie) {
  if (isFreeplayMode()) {
    onFreeplayZombieKilled(zombie);
    return;
  }

  runKills += 1;
  player.kills += 1;
  player.score = player.kills * 10;

  const levelBefore = getLevelFromXp(player.totalXp);
  const killXp = getKillXp(zombie);
  player.totalXp += killXp;
  const levelAfter = getLevelFromXp(player.totalXp);

  let bonusSp = 0;
  let spLabel = "";

  if (player.kills >= player.nextSkillPointKill) {
    player.skillPoints += 1;
    player.nextSkillPointKill += SKILL_POINT_KILL_INTERVAL;
    bonusSp += 1;
    spLabel = "+1 SP";
  }

  if (zombie?.tier === "waveBoss" || zombie?.isWaveBoss) {
    player.skillPoints += WAVE_BOSS_SP_REWARD;
    bonusSp += WAVE_BOSS_SP_REWARD;
    spLabel = `+${WAVE_BOSS_SP_REWARD} SP BOSS`;
    showMilestone(`👹 Wave boss defeated! +${WAVE_BOSS_SP_REWARD} SP · +${killXp} XP`);
  }

  spawnPlayerKillReward({
    xp: killXp,
    sp: bonusSp,
    spLabel,
    tier: getZombieRewardTier(zombie),
    kind: getZombieRewardKind(zombie)
  });

  if (levelAfter > levelBefore) {
    playLevelUp();
    showMilestone(`Level up! You reached level ${levelAfter}`);
  }

  registerMonthlyKill();
  if (typeof registerDailyRunKill === "function") registerDailyRunKill(zombie);
  checkAndUnlockAchievements();
  checkAndUnlockMonthlyAchievement();
  applyRunLifestealOnKill();
  saveProgress();
}

function onFreeplayZombieKilled(zombie) {
  runKills += 1;
  player.score = runKills * 10;

  freeplayComboTimer = 52;
  freeplayCombo += 1;
  if (freeplayCombo > freeplayBestCombo) {
    freeplayBestCombo = freeplayCombo;
  }

  const cx = zombie.x + zombie.size / 2;
  const cy = zombie.y + zombie.size / 2;
  const label = freeplayCombo >= 4 ? `+1 x${freeplayCombo}` : "+1";
  spawnFloatingText(cx, cy - zombie.size * 0.18, label, zombie.golden ? "#ffe066" : "#b8f5d4", 0.92);

  if (freeplayCombo >= 5 && freeplayCombo % 5 === 0) {
    addScreenShake(1.2 + Math.min(3.5, freeplayCombo / 12));
  }
  if (freeplayCombo === 10 || freeplayCombo === 25 || freeplayCombo === 50) {
    showMilestone(`🔥 ${freeplayCombo} kill combo!`);
  }
  if (zombie?.freeplayBoss || zombie?.isWaveBoss) {
    showMilestone("👹 Freeplay boss destroyed!");
    addScreenShake(8);
    freeplayCombo += 4;
  }
  if (freeplayCombo > 0 && freeplayCombo % 20 === 0) {
    const heal = Math.max(1, Math.round(player.maxHp * 0.06));
    player.hp = Math.min(player.maxHp, player.hp + heal);
    spawnFloatingText(cx, cy - 24, `+${heal} HP`, "#9dffc8", 1);
  }
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentMonthlyAchievement() {
  const monthKey = getCurrentMonthKey();
  const def = MONTHLY_ACHIEVEMENTS[monthKey];
  if (!def) return null;
  return { ...def, monthKey };
}

function getNextMonthlyAchievement() {
  const currentKey = getCurrentMonthKey();
  const nextKey = Object.keys(MONTHLY_ACHIEVEMENTS)
    .sort()
    .find((key) => key > currentKey);
  if (!nextKey) return null;
  return { ...MONTHLY_ACHIEVEMENTS[nextKey], monthKey: nextKey };
}

function isMonthlyAchievementComplete(monthKey) {
  return completedMonthlyKeys.has(monthKey);
}

function getMonthlyKillProgress() {
  ensureMonthlyProgressCurrent();
  return monthlyProgress.kills;
}

function ensureMonthlyProgressCurrent() {
  const monthKey = getCurrentMonthKey();
  if (monthlyProgress.monthKey !== monthKey) {
    monthlyProgress = { monthKey, kills: 0 };
  }
}

function mergeMonthlyProgressObjects(serverData, localData) {
  const s = serverData && typeof serverData === "object" ? serverData : {};
  const l = localData && typeof localData === "object" ? localData : {};
  const currentKey = getCurrentMonthKey();
  const candidates = [s.monthlyProgress, l.monthlyProgress].filter(
    (progress) => progress && progress.monthKey === currentKey
  );

  if (candidates.length === 0) {
    return { monthKey: currentKey, kills: 0 };
  }

  return {
    monthKey: currentKey,
    kills: Math.max(...candidates.map((progress) => Number(progress.kills || 0)))
  };
}

function applyMonthlyProgressFromSave(data) {
  const payload = data && typeof data === "object" ? data : {};
  const currentKey = getCurrentMonthKey();

  completedMonthlyKeys = new Set(
    Array.isArray(payload.completedMonthlyAchievements)
      ? payload.completedMonthlyAchievements
      : []
  );

  const saved = payload.monthlyProgress;
  if (saved && saved.monthKey === currentKey) {
    monthlyProgress = {
      monthKey: currentKey,
      kills: Number(saved.kills || 0)
    };
  } else {
    monthlyProgress = { monthKey: currentKey, kills: 0 };
  }
}

function registerMonthlyKill() {
  const monthly = getCurrentMonthlyAchievement();
  if (!monthly || isMonthlyAchievementComplete(monthly.monthKey)) return;

  ensureMonthlyProgressCurrent();
  monthlyProgress.kills += 1;
}

function checkAndUnlockMonthlyAchievement() {
  const monthly = getCurrentMonthlyAchievement();
  if (!monthly || isMonthlyAchievementComplete(monthly.monthKey)) return;

  ensureMonthlyProgressCurrent();
  if (monthlyProgress.kills < monthly.target) return;

  completedMonthlyKeys.add(monthly.monthKey);
  showAchievementUnlock({ ...monthly, monthly: true });
  updateMonthlyAchievementHUD();
  updateAchievementsUI();
}

function getAchievementProgressValue(achievement) {
  if (achievement.type === "wave") {
    return Math.max(bestWave, runBestWave, waveInProgress ? wave - 1 : 0);
  }
  if (achievement.type === "kills") return player.kills;
  if (achievement.type === "level") return getXpProgress(player.totalXp).level;
  return 0;
}

function isAchievementComplete(achievement) {
  return getAchievementProgressValue(achievement) >= achievement.target;
}

function showAchievementUnlock(achievement) {
  if (!gameRunning) return;

  achievementPopupQueue.push(achievement);
  if (!achievementPopupShowing) {
    showNextAchievementPopup();
  }
}

const ACHIEVEMENT_POPUP_DURATION_MS = 3000;

function showNextAchievementPopup() {
  const popup = document.getElementById("achievement-popup");
  if (!popup || achievementPopupQueue.length === 0) {
    achievementPopupShowing = false;
    return;
  }

  achievementPopupShowing = true;
  const achievement = achievementPopupQueue.shift();

  const iconEl = document.getElementById("achievement-popup-icon");
  const nameEl = document.getElementById("achievement-popup-name");
  const descEl = document.getElementById("achievement-popup-desc");
  const labelEl = document.getElementById("achievement-popup-label");

  if (iconEl) iconEl.textContent = achievement.emoji;
  if (nameEl) nameEl.textContent = achievement.name;
  if (descEl) descEl.textContent = achievement.desc;
  if (labelEl) {
    labelEl.textContent = achievement.monthly
      ? "Monthly achievement unlocked!"
      : "Achievement unlocked!";
  }

  popup.classList.remove("hide");
  popup.classList.add("visible");

  playLevelUp();

  const cx = player.x + PLAYER_SIZE / 2;
  const cy = player.y + PLAYER_SIZE / 2;
  spawnFloatingText(
    cx,
    cy - 50,
    achievement.monthly ? "MONTHLY!" : "ACHIEVEMENT!",
    "#ffd54a",
    1.4
  );

  clearTimeout(showNextAchievementPopup._timer);
  showNextAchievementPopup._timer = setTimeout(() => {
    popup.classList.add("hide");
    popup.classList.remove("visible");

    setTimeout(() => {
      popup.classList.remove("hide");
      showNextAchievementPopup();
    }, 450);
  }, ACHIEVEMENT_POPUP_DURATION_MS);
}

function checkAndUnlockAchievements() {
  let unlockedAny = false;

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedAchievements.has(achievement.id) || !isAchievementComplete(achievement)) {
      continue;
    }

    unlockedAchievements.add(achievement.id);
    showAchievementUnlock(achievement);
    unlockedAny = true;
  }

  if (unlockedAny) {
    saveProgress();
  }

  updateAchievementsUI();
  updateMonthlyAchievementHUD();
}

function getUnlockedAchievementCount() {
  return ACHIEVEMENTS.filter((achievement) => unlockedAchievements.has(achievement.id)).length;
}

function updateMonthlyAchievementHUD() {
  const hudEl = document.getElementById("monthly-achievement-hud");
  if (!hudEl) return;

  const current = getCurrentMonthlyAchievement();
  const upcoming = getNextMonthlyAchievement();

  if (current) {
    const unlocked = isMonthlyAchievementComplete(current.monthKey);
    const progress = getMonthlyKillProgress();
    const pct = Math.min(100, Math.round((progress / current.target) * 100));
    const progressText = unlocked
      ? "Done!"
      : `${Math.min(progress, current.target).toLocaleString("en-US")} / ${current.target.toLocaleString("en-US")}`;

    hudEl.innerHTML = `<div class="monthly-hud${unlocked ? " done" : ""}">
  <div class="monthly-hud-header">📅 Month · ${escapeHtml(current.monthLabel)}</div>
  <div class="monthly-hud-name">${current.emoji} ${escapeHtml(current.name)}</div>
  <div class="monthly-hud-desc">${escapeHtml(current.desc)}</div>
  <div class="monthly-hud-bar-wrap"><div class="monthly-hud-bar" style="width:${unlocked ? 100 : pct}%"></div></div>
  <div class="monthly-hud-progress">${progressText}${unlocked ? "" : " kills"}</div>
</div>`;
    return;
  }

  if (upcoming) {
    hudEl.innerHTML = `<div class="monthly-hud upcoming">
  <div class="monthly-hud-header">📅 Upcoming · ${escapeHtml(upcoming.monthLabel)}</div>
  <div class="monthly-hud-name">${upcoming.emoji} ${escapeHtml(upcoming.name)}</div>
  <div class="monthly-hud-desc">${escapeHtml(upcoming.desc)}</div>
  <div class="monthly-hud-progress">Starting soon</div>
</div>`;
    return;
  }

  hudEl.innerHTML = "";
}

function renderAchievementsList() {
  const listEl = document.getElementById("achievements-list");
  if (!listEl) return;

  listEl.innerHTML = ACHIEVEMENTS.map((achievement) => {
    const unlocked = unlockedAchievements.has(achievement.id);
    const current = getAchievementProgressValue(achievement);
    const pct = Math.min(100, Math.round((current / achievement.target) * 100));
    const progressText = unlocked
      ? "Done!"
      : `${Math.min(current, achievement.target)}/${achievement.target}`;

    return `<div class="achievement-card${unlocked ? " unlocked" : ""}">
  <div class="achievement-icon">${unlocked ? achievement.emoji : "🔒"}</div>
  <div class="achievement-body">
    <div class="achievement-name">${escapeHtml(achievement.name)}</div>
    <div class="achievement-desc">${escapeHtml(achievement.desc)}</div>
    <div class="achievement-bar-wrap"><div class="achievement-bar" style="width:${unlocked ? 100 : pct}%"></div></div>
    <div class="achievement-progress">${progressText}</div>
  </div>
  ${unlocked ? '<div class="achievement-check">✓</div>' : ""}
</div>`;
  }).join("");
}

function updateAchievementsUI() {
  const countEl = document.getElementById("achievements-count");
  const summaryEl = document.getElementById("achievements-summary");
  const unlocked = getUnlockedAchievementCount();
  const total = ACHIEVEMENTS.length;

  if (countEl) countEl.textContent = `${unlocked}/${total}`;
  if (summaryEl) summaryEl.textContent = `${unlocked} of ${total} achievements`;
  renderAchievementsList();
}

function openAchievementsMenu() {
  const modal = document.getElementById("achievements-modal");
  if (!modal) return;
  if (isStartMenuVisible()) hideStartMenu();
  pauseForRunModal("achievements");
  updateAchievementsUI();
  updateMonthlyAchievementHUD();
  modal.classList.add("open");
}

function closeAchievementsMenu() {
  const modal = document.getElementById("achievements-modal");
  const wasOpen = modal?.classList.contains("open");
  hideAchievementsModal();
  if (wasOpen) {
    resumeFromRunModal("achievements");
    restoreStartMenuAfterModal();
  }
}

function getLeaderboardCrownHtml(rank) {
  if (rank === 1) return '<span class="lb-crown gold" aria-hidden="true">👑</span>';
  if (rank === 2) return '<span class="lb-crown silver" aria-hidden="true">👑</span>';
  if (rank === 3) return '<span class="lb-crown bronze" aria-hidden="true">👑</span>';
  return "";
}

function getFeaturedPlayerKey() {
  const featured = communityConfig?.featured;
  if (!featured?.active) return "";
  const name = featured.gameName || featured.displayName || "";
  return String(name).trim().toLowerCase();
}

function getFeaturedTagHtml(rowName) {
  const featured = communityConfig?.featured;
  if (!featured?.active) return "";
  const key = getFeaturedPlayerKey();
  if (!key || String(rowName || "").trim().toLowerCase() !== key) return "";
  const label = escapeHtml(featured.rankLabel || "Featured");
  return `<span class="lb-featured-tag">${label}</span>`;
}

function getLeaderboardRoleSlug(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getLeaderboardRoleHtml(role) {
  const label = String(role || "").trim();
  if (!label) return "";
  const slug = getLeaderboardRoleSlug(label) || "custom";
  return `<span class="lb-role-tag lb-role-${slug}">${escapeHtml(label)}</span>`;
}

function renderCommunityPanel() {
  const giveawayEl = document.getElementById("giveaway-coming-soon");
  const featuredEl = document.getElementById("featured-creator");
  const featured = communityConfig?.featured || {};
  const giveaway = communityConfig?.giveaway || {};

  if (giveawayEl) {
    giveawayEl.classList.toggle("hidden", !Boolean(giveaway.showComingSoon));
  }

  const giveawayEyebrow = document.getElementById("giveaway-eyebrow");
  const giveawayTitle = document.getElementById("giveaway-title");
  const giveawayTeaser = document.getElementById("giveaway-teaser");
  if (giveawayEyebrow && giveaway.eyebrow) giveawayEyebrow.textContent = giveaway.eyebrow;
  if (giveawayTitle && giveaway.title) giveawayTitle.textContent = giveaway.title;
  if (giveawayTeaser && giveaway.teaser) giveawayTeaser.textContent = giveaway.teaser;

  if (!featuredEl) return;

  if (!featured.active) {
    featuredEl.classList.remove("visible");
    featuredEl.hidden = true;
    return;
  }

  featuredEl.hidden = false;

  featuredEl.classList.add("visible");

  const rankEmoji = document.getElementById("featured-rank-emoji");
  const rankLabel = document.getElementById("featured-rank-label");
  const playerNameEl = document.getElementById("featured-player-name");
  const tiktokLink = document.getElementById("featured-tiktok-link");
  const tiktokHandle = document.getElementById("featured-tiktok-handle");

  const displayName = featured.displayName || featured.gameName || "Player";
  const handle = featured.tiktokHandle
    ? `@${String(featured.tiktokHandle).replace(/^@+/, "")}`
    : "TikTok";
  const url = featured.tiktokUrl || "#";

  if (rankEmoji) rankEmoji.textContent = featured.rankEmoji || "⭐";
  if (rankLabel) rankLabel.textContent = featured.rankLabel || "Featured Survivor";
  if (playerNameEl) playerNameEl.textContent = displayName;
  if (tiktokHandle) tiktokHandle.textContent = handle;
  if (tiktokLink) {
    tiktokLink.href = url;
    tiktokLink.setAttribute(
      "aria-label",
      `Open ${displayName}'s TikTok`
    );
  }
}

async function refreshCommunityPanel() {
  try {
    const response = await fetch("/api/community");
    if (response.ok) {
      applyRuntimeConfigFromCommunity(await response.json());
    }
  } catch (error) {
    // Offline / gammal server — använd default communityConfig
  }
  renderCommunityPanel();
  renderStartMenuAnnouncement();
  updateFreeplayMenuState();
}

function renderLeaderboard(rows) {
  const list = document.getElementById("leaderboard-list");
  const youEl = document.getElementById("leaderboard-you");
  if (!list) return;

  if (!rows || rows.length === 0) {
    list.innerHTML = '<div class="lb-empty">No players yet — be the first!</div>';
    if (youEl) youEl.textContent = "";
    return;
  }

  list.innerHTML = rows
    .map((row) => {
      const me =
        playerName &&
        row.name.toLowerCase() === playerName.toLowerCase()
          ? " me"
          : "";
      const crown = getLeaderboardCrownHtml(row.rank);
      const rankClass = row.rank <= 3 ? ` rank-${row.rank}` : "";
      const featuredTag = getFeaturedTagHtml(row.name);
      const roleHtml = getLeaderboardRoleHtml(row.role);
      const roleClass = roleHtml ? " has-role" : "";
      return `<div class="lb-row${me}${rankClass}${roleClass}">
  <div class="lb-rank-badge">${row.rank}</div>
  <div class="lb-row-body">
    <div class="lb-row-head">
      <div class="lb-row-identity">
        ${roleHtml}
        <span class="lb-row-name">${crown}${escapeHtml(row.name)}</span>
      </div>
      <span class="lb-row-tags">${featuredTag}<span class="lb-level-pill">Lv ${row.level}</span></span>
    </div>
    <div class="lb-row-stats">
      <span class="lb-stat">W${row.bestWave || 0}</span>
      <span class="lb-stat">${formatHudNumber(row.kills || 0)} K</span>
    </div>
  </div>
</div>`;
    })
    .join("");

  if (youEl) youEl.textContent = "";
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function refreshLeaderboard() {
  try {
    const response = await fetch("/leaderboard?limit=50");
    if (!response.ok) return;
    const rows = await response.json();
    renderLeaderboard(rows);
  } catch (error) {
    const list = document.getElementById("leaderboard-list");
    if (list) {
      list.innerHTML =
        '<div class="lb-empty">Leaderboard offline — start server to sync ranks.</div>';
    }
  }
}

function scheduleLeaderboardRefresh() {
  clearTimeout(leaderboardRefreshTimer);
  leaderboardRefreshTimer = setTimeout(refreshLeaderboard, 400);
}

function getSaveKey() {
  return `${STORAGE_KEY}-${playerName || "guest"}`;
}



function loadSavedName() {
  return localStorage.getItem(PLAYER_NAME_KEY) || "";
}

function normalizeNickname(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function validateNickname(value) {
  const name = normalizeNickname(value);
  if (name.length < 2) {
    return "Nickname must be at least 2 characters.";
  }
  if (name.length > 16) {
    return "Nickname must be at most 16 characters.";
  }
  if (!/^[a-zA-Z0-9 _\-åäöÅÄÖ]+$/.test(name)) {
    return "Use only letters, numbers, spaces, - or _.";
  }
  return "";
}

function loadAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

function saveAuthToken(token) {
  authToken = String(token || "");
  if (authToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

function clearAuthToken() {
  saveAuthToken("");
}

function handleSessionExpired(message = "Session expired. Log in again.") {
  clearAuthToken();
  playerName = "";
  canViewFeedbackInbox = false;
  isGameAdmin = false;
  saveHydrated = false;
  updateGameAdminUI(0);
  gameRunning = false;
  paused = false;
  pauseReason = null;
  hideStartMenu();
  hideTutorialOverlay();
  hideCenterHud();
  hideBonusOffer();
  closeShopMenu();
  closeShopUpgradeMenu();
  closeSettingsMenu();
  closeAchievementsMenu();
  if (typeof closeFriendsMenu === "function") closeFriendsMenu();
  if (typeof closeDailyChallengesMenu === "function") closeDailyChallengesMenu();
  closeFeedbackMenu();
  closeFeedbackInboxMenu();
  closeRunModifierPick();

  const adminModal = document.getElementById("admin-modal");
  if (adminModal?.classList.contains("open")) {
    adminModal.classList.remove("open");
    adminModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("admin-open");
  }

  if (zombieSpawner) {
    clearInterval(zombieSpawner);
    zombieSpawner = null;
  }

  if (nextWaveTimer) {
    clearTimeout(nextWaveTimer);
    nextWaveTimer = null;
  }

  waveInProgress = false;
  isMouseDown = false;
  stopBackgroundMusic();

  if (gameOverOverlay) gameOverOverlay.style.display = "none";

  showAuthScreen("login");
  setAuthError(message);
  updateUI();

  if (typeof refreshGlobalChat === "function") refreshGlobalChat();
  if (typeof refreshFriendsPanel === "function") refreshFriendsPanel();
}

function refreshAuthTokenFromStorage() {
  authToken = loadAuthToken();
  return authToken;
}

async function authFetch(url, options = {}) {
  refreshAuthTokenFromStorage();

  const headers = {
    ...(options.headers || {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, { ...options, headers });
}

function setAuthError(message) {
  const el = document.getElementById("auth-error");
  if (el) el.textContent = message || "";
}

function setAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";
  const loginTab = document.getElementById("auth-tab-login");
  const registerTab = document.getElementById("auth-tab-register");
  const submitBtn = document.getElementById("auth-submit-btn");
  const hintEl = document.querySelector("#nick .auth-hint");

  if (loginTab) loginTab.classList.toggle("active", authMode === "login");
  if (registerTab) registerTab.classList.toggle("active", authMode === "register");
  if (submitBtn) submitBtn.textContent = authMode === "register" ? "Create account" : "Log in";
  if (hintEl) {
    hintEl.textContent =
      authMode === "register"
        ? "Create an account with your username and password. Your name is yours — no one else can take it. Played before? Register the same name to keep your progress."
        : "Log in with your username and password.";
  }
  if (playerPasswordInput) {
    playerPasswordInput.autocomplete = authMode === "register" ? "new-password" : "current-password";
  }
  setAuthError("");
}

function showAuthScreen(mode = "login") {
  setAuthMode(mode);
  if (startOverlay) startOverlay.style.display = "flex";
  hideStartMenu();
  hideTutorialOverlay();
  if (playerNameInput) {
    playerNameInput.value = loadSavedName();
    playerNameInput.focus();
  }
  if (playerPasswordInput) playerPasswordInput.value = "";
  setAuthError("");
}

async function completeLogin(username, token) {
  playerName = normalizeNickname(username);
  saveAuthToken(token);
  savePlayerName();
  hideNicknameScreen();

  const saveResult = await loadSave();
  if (!authToken || saveResult?.sessionExpired) return;

  await refreshAccountAccess();
  applyArenaTheme();
  updateUI();
  updateAchievementsUI();
  updateMonthlyAchievementHUD();
  refreshLeaderboard();
  enterMainMenuFlow();
  repairUiState();
  syncAuthSidePanels();
}

async function submitAuth() {
  const username = normalizeNickname(playerNameInput ? playerNameInput.value : playerName);
  const password = String(playerPasswordInput?.value || "");
  const nickError = validateNickname(username);

  if (nickError) {
    setAuthError(nickError);
    return;
  }
  if (password.length < 6) {
    setAuthError("Password must be at least 6 characters.");
    return;
  }

  const endpoint = authMode === "register" ? "/api/register" : "/api/login";
  setAuthError("");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setAuthError(payload.error || "Could not log in right now.");
      return;
    }

    await completeLogin(payload.username, payload.token);
  } catch (error) {
    setAuthError("Could not reach the server. Try again.");
  }
}

async function tryRestoreSession() {
  authToken = loadAuthToken();
  if (!authToken) return false;

  try {
    const response = await authFetch("/api/me");
    if (!response.ok) {
      clearAuthToken();
      return false;
    }

    const payload = await response.json();
    playerName = normalizeNickname(payload.username);
    savePlayerName();
    return !!playerName;
  } catch (error) {
    clearAuthToken();
    return false;
  }
}

function resetSessionState() {
  player = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    speed: 4,
    maxHp: 500,
    hp: 500,
    damage: 1,
    bulletSpeed: 10,
    kills: 0,
    totalXp: 0,
    score: 0,
    skillPoints: 0,
    nextSkillPointKill: SKILL_POINT_KILL_INTERVAL,
    hurtCooldown: 0,
    facingAngle: 0,
    weaponRecoil: 0,
    muzzleFlash: 0,
    rewardGlow: 0,
    rewardGlowColor: "#8ef5c8",
    shootCooldown: 0,
    upgrades: { hp: 0, damage: 0, bulletSpeed: 0 }
  };

  bestWave = 0;
  runBestWave = 0;
  wave = 1;
  gameRunning = false;
  paused = false;
  pauseReason = null;
  unlockedAchievements = new Set();
  monthlyProgress = { monthKey: getCurrentMonthKey(), kills: 0 };
  completedMonthlyKeys = new Set();
  unlockedWeapons = new Set(["pistol"]);
  equippedWeaponId = "pistol";
  weaponLevels = { pistol: 0, smg: 0, shotgun: 0, rifle: 0 };
  zombies = [];
  bullets = [];
  playerBombs = [];
  playerMolotovs = [];
  molotovFireZones = [];
  explosionEffects = [];
  bombCharges = BOMB_MAX_CHARGES;
  bombReadyAt = 0;
  molotovCharges = MOLOTOV_MAX_CHARGES;
  molotovReadyAt = 0;
  hpPickups = [];
  lastHpPickupSpawnAt = 0;
  playerBaseSpeed = 4;
  syncPlayerDamageFromWeapon();
}

async function logoutAccount() {
  try {
    if (authToken) {
      await authFetch("/api/logout", { method: "POST" });
    }
  } catch (error) {
    // ignore
  }

  clearAuthToken();
  playerName = "";
  canViewFeedbackInbox = false;
  isGameAdmin = false;
  saveHydrated = false;
  updateGameAdminUI(0);
  resetSessionState();
  hideStartMenu();
  hideTutorialOverlay();
  hideCenterHud();
  if (typeof closeFriendsMenu === "function") closeFriendsMenu();
  if (typeof closeDailyChallengesMenu === "function") closeDailyChallengesMenu();
  showAuthScreen("login");
  setAuthError("");
  updateUI();
  if (typeof refreshGlobalChat === "function") refreshGlobalChat();
  if (typeof refreshFriendsPanel === "function") refreshFriendsPanel();
  if (typeof disconnectCoopLobbySocket === "function") disconnectCoopLobbySocket();
}

function savePlayerName() {
  if (playerName) {
    localStorage.setItem(PLAYER_NAME_KEY, playerName);
  }
}

function showNicknameScreen() {
  showAuthScreen("login");
}

function hideNicknameScreen() {
  if (startOverlay) startOverlay.style.display = "none";
}

function isOverlayVisible(el) {
  return !!(el && window.getComputedStyle(el).display !== "none");
}

function isStartMenuVisible() {
  return !!(
    startMenuOverlay &&
    startMenuOverlay.classList.contains("open") &&
    isOverlayVisible(startMenuOverlay)
  );
}

function isTutorialVisible() {
  return !!(tutorialOverlay && tutorialOverlay.classList.contains("open"));
}

function isAdminPanelVisible() {
  const adminModal = document.getElementById("admin-modal");
  return !!(adminModal?.classList.contains("open") && isOverlayVisible(adminModal));
}

const START_MENU_MODAL_IDS = [
  "shop-main-modal",
  "shop-upgrade-modal",
  "achievements-modal",
  "friends-modal",
  "daily-challenges-modal",
  "settings-modal",
  "feedback-modal",
  "feedback-inbox-modal",
  "run-modifier-modal",
  "coop-lobby-modal"
];

function isStartMenuSubModalOpen() {
  return START_MENU_MODAL_IDS.some((id) => {
    const el = document.getElementById(id);
    return !!el?.classList.contains("open");
  });
}

function shouldShowStartMenuNow() {
  return !!(
    authToken &&
    !gameRunning &&
    !isGameOverVisible() &&
    !isTutorialVisible() &&
    !isNicknameScreenVisible() &&
    !isAdminPanelVisible() &&
    !isStartMenuSubModalOpen()
  );
}

function restoreStartMenuAfterModal() {
  if (shouldShowStartMenuNow()) {
    showStartMenu();
  }
}

function syncAuthSidePanels() {
  if (typeof refreshGlobalChat === "function") refreshGlobalChat(true);
  if (typeof refreshFriendsPanel === "function") refreshFriendsPanel(true);
  if (typeof refreshDailyChallenges === "function") refreshDailyChallenges(true);
  if (typeof initCoopLobbyConnection === "function") initCoopLobbyConnection();
}

function repairUiState() {
  if (!isAdminPanelVisible() && document.body.classList.contains("admin-open")) {
    document.body.classList.remove("admin-open");
  }

  refreshAuthTokenFromStorage();

  if (!authToken) {
    hideStartMenu();
    if (!isNicknameScreenVisible()) showAuthScreen("login");
    return;
  }

  if (isNicknameScreenVisible()) hideNicknameScreen();

  if (gameRunning || isGameOverVisible() || isTutorialVisible()) {
    hideStartMenu();
    ensureRenderLoop();
    return;
  }

  if (isStartMenuSubModalOpen()) {
    hideStartMenu();
    ensureRenderLoop();
    return;
  }

  if (!isAdminPanelVisible() && shouldShowStartMenuNow()) {
    showStartMenu();
  } else if (!shouldShowStartMenuNow()) {
    hideStartMenu();
  }

  syncAuthSidePanels();
  ensureRenderLoop();
}

function updateStartMenuUI() {
  const nameEl = document.getElementById("start-menu-name");
  const statsEl = document.getElementById("start-menu-stats");
  const progress = getXpProgress(player.totalXp);
  const achievements = getUnlockedAchievementCount();

  if (nameEl) nameEl.textContent = playerName || "Player";
  renderStartMenuAnnouncement();
  updateFreeplayMenuState();

  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card accent stat-card-fun">
        <span class="stat-icon">💚</span>
        <div class="stat-copy"><span class="stat-label">Level</span><strong class="stat-value">${formatHudNumber(progress.level)}</strong></div>
      </div>
      <div class="stat-card stat-card-fun">
        <span class="stat-icon">🌊</span>
        <div class="stat-copy"><span class="stat-label">Best Wave</span><strong class="stat-value">${formatHudNumber(bestWave)}</strong></div>
      </div>
      <div class="stat-card stat-card-fun">
        <span class="stat-icon">💀</span>
        <div class="stat-copy"><span class="stat-label">Kills</span><strong class="stat-value">${formatHudNumber(player.kills)}</strong></div>
      </div>
      <div class="stat-card stat-card-fun">
        <span class="stat-icon">⚡</span>
        <div class="stat-copy"><span class="stat-label">Skill Points</span><strong class="stat-value">${formatHudNumber(player.skillPoints)}</strong></div>
      </div>
      <div class="stat-card wide stat-card-fun">
        <span class="stat-icon">🏅</span>
        <div class="stat-copy"><span class="stat-label">Achievements</span><strong class="stat-value">${achievements}/${ACHIEVEMENTS.length}</strong></div>
      </div>
    `;
  }
}

function showStartMenu() {
  if (startOverlay) startOverlay.style.display = "none";
  if (startMenuOverlay) {
    startMenuOverlay.style.display = "flex";
    startMenuOverlay.classList.add("open");
  }
  document.body.classList.add("lobby-open");
  document.documentElement.classList.add("lobby-open");
  ensureRenderLoop();
  updateStartMenuUI();
  updateShopControls();
  syncAuthSidePanels();
}

function hideStartMenu() {
  if (startMenuOverlay) {
    startMenuOverlay.style.display = "none";
    startMenuOverlay.classList.remove("open");
  }
  document.body.classList.remove("lobby-open");
  document.documentElement.classList.remove("lobby-open");
}

const TUTORIAL_DONE_KEY = "hulkLivesTutorialDone";

const TUTORIAL_STEPS = [
  {
    icon: "💀",
    title: "Welcome to HulkLives!",
    body: "Top-down zombie survival — survive as many waves as you can and climb the leaderboard.",
    keys: []
  },
  {
    icon: "⌨️",
    title: "Move",
    body: "Use WASD to move your character. Watch the edges — zombies come from every direction.",
    keys: ["W", "A", "S", "D"]
  },
  {
    icon: "🎯",
    title: "Aim & shoot",
    body: "The mouse aims automatically. Hold left click or click to shoot zombies. R = bomb (x3, big blast). T = molotov (x2, fire pool on the ground).",
    keys: ["🖱️ Aim", "🔫 Shoot", "R Bomb x3", "T Molotov x2"]
  },
  {
    icon: "🌊",
    title: "Waves",
    body: "Kill every zombie in a wave to advance. Every 10th wave brings a big boss scaled to your level and upgrades.",
    keys: []
  },
  {
    icon: "⭐",
    title: "Skill Points & shop",
    body: "Every 5th kill gives 1 SP. Open the shop from the menu for HP, bullet speed, and new weapons.",
    keys: ["🛠 Shop"]
  },
  {
    icon: "▶️",
    title: "Ready to go!",
    body: "Switch weapons with 1–4 during a run. Check the shop, press START GAME — and survive!",
    keys: ["1", "2", "3", "4"]
  }
];

let tutorialStepIndex = 0;
let tutorialReturnToMenu = false;

function hasCompletedTutorial() {
  return localStorage.getItem(TUTORIAL_DONE_KEY) === "1";
}

function markTutorialComplete() {
  localStorage.setItem(TUTORIAL_DONE_KEY, "1");
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialStepIndex];
  if (!step) return;

  const iconEl = document.getElementById("tutorial-icon");
  const labelEl = document.getElementById("tutorial-step-label");
  const titleEl = document.getElementById("tutorial-title");
  const bodyEl = document.getElementById("tutorial-body");
  const keysEl = document.getElementById("tutorial-keys");
  const progressEl = document.getElementById("tutorial-progress");
  const nextBtn = document.getElementById("tutorial-next-btn");
  const skipBtn = document.getElementById("tutorial-skip-btn");

  if (iconEl) iconEl.textContent = step.icon;
  if (labelEl) {
    labelEl.textContent = `Step ${tutorialStepIndex + 1} of ${TUTORIAL_STEPS.length} · click Next`;
  }
  if (titleEl) titleEl.textContent = step.title;
  if (bodyEl) bodyEl.textContent = step.body;

  if (keysEl) {
    keysEl.innerHTML = (step.keys || [])
      .map((key) => `<span>${key}</span>`)
      .join("");
    keysEl.style.display = step.keys?.length ? "flex" : "none";
  }

  if (progressEl) {
    progressEl.innerHTML = TUTORIAL_STEPS.map((_, index) => {
      let cls = "tutorial-dot";
      if (index === tutorialStepIndex) cls += " active";
      else if (index < tutorialStepIndex) cls += " done";
      return `<span class="${cls}"></span>`;
    }).join("");
  }

  const isLast = tutorialStepIndex >= TUTORIAL_STEPS.length - 1;
  if (nextBtn) nextBtn.textContent = isLast ? "To menu →" : "Next →";
  if (skipBtn) skipBtn.textContent = tutorialReturnToMenu ? "Close" : "Skip";
}

function showTutorialOverlay() {
  if (!tutorialOverlay) return;
  hideStartMenu();
  tutorialOverlay.classList.add("open");
  renderTutorialStep();
}

function hideTutorialOverlay() {
  if (tutorialOverlay) tutorialOverlay.classList.remove("open");
}

function finishTutorial() {
  markTutorialComplete();
  hideTutorialOverlay();
  showStartMenu();
  showMilestone("📖 Tutorial complete — go get em! 💀");
}

function skipTutorial() {
  if (tutorialReturnToMenu) {
    hideTutorialOverlay();
    showStartMenu();
    return;
  }
  finishTutorial();
}

function nextTutorialStep() {
  if (tutorialStepIndex >= TUTORIAL_STEPS.length - 1) {
    if (tutorialReturnToMenu) {
      hideTutorialOverlay();
      showStartMenu();
      return;
    }
    finishTutorial();
    return;
  }

  tutorialStepIndex += 1;
  renderTutorialStep();
}

function openTutorial(fromMenu = false) {
  tutorialReturnToMenu = !!fromMenu;
  tutorialStepIndex = 0;
  showTutorialOverlay();
}

function enterMainMenuFlow() {
  if (hasCompletedTutorial()) {
    showStartMenu();
  } else {
    openTutorial(false);
  }
}

async function submitNickname() {
  await submitAuth();
}

function hslColor(h, s, l, a) {
  if (a !== undefined) return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function isFreeplayMode() {
  return gameMode === "freeplay";
}

function isCampaignMode() {
  return gameMode !== "freeplay";
}

function getArenaTheme() {
  const hue = isFreeplayMode() ? 168 : ARENA_HUE;
  const accent = hslColor(hue, 92, 55);
  const bg = hslColor(hue, 58, 8);
  const bgAlt = hslColor(hue, 45, 14);
  const grid = hslColor(hue, 80, 42, 0.16);
  const fog = hslColor(hue, 70, 18, 0.22);

  return {
    bg,
    bgAlt,
    grid,
    fog,
    border: accent,
    accent,
    hue,
    patternStyle: isFreeplayMode() ? 2 : 0,
    grass: hslColor(hue, 48, 22),
    grassDark: hslColor(hue, 42, 17),
    grassLight: hslColor(hue, 55, 28),
    groundLight: hslColor(hue, 38, 20),
    groundMid: hslColor(hue, 32, 14),
    groundDark: hslColor(hue, 28, 10),
    groundTint: hslColor(hue, 35, 6, 0.85),
    speckle: hslColor(hue, 70, 52),
    vignette: hslColor(hue, 40, 3, 0.72),
    spotlight: hslColor(hue, 92, 52, 0.14),
    spotlightMid: hslColor(hue, 75, 28, 0.05),
    entityGlow: hslColor(hue, 95, 55, 0.65),
    zombieGlow: hslColor(hue, 80, 42, 0.4),
    path: hslColor(hue, 25, 28)
  };
}

function applyArenaTheme() {
  const theme = getArenaTheme();

  if (c) {
    c.style.background = theme.bg;
    c.style.border = "none";
    c.style.boxShadow = "none";
  }

  const frame = document.getElementById("game-canvas-frame");
  if (frame) {
    frame.style.boxShadow = `var(--shadow-frame), 0 0 48px ${hslColor(theme.hue, 80, 55, 0.12)}`;
  }

  const titleBrand = document.querySelector("#title .title-brand");
  if (titleBrand) {
    titleBrand.style.color = theme.accent;
    titleBrand.style.textShadow = `0 0 24px ${hslColor(theme.hue, 80, 55, 0.35)}`;
  }

  const ui = document.getElementById("ui");
  if (ui) ui.style.borderColor = theme.border;

  const shop = document.getElementById("skill-shop");
  if (shop) shop.style.borderColor = theme.border;

  const rankBoard = document.getElementById("global-leaderboard");
  if (rankBoard) rankBoard.style.borderColor = theme.border;

  const featuredPanel = document.getElementById("featured-creator");
  if (featuredPanel) featuredPanel.style.borderColor = theme.border;

  const centerWave = document.querySelector("#center-hud .center-wave");
  if (centerWave) centerWave.style.color = theme.accent;

  document.body.style.background = `
    radial-gradient(ellipse 110% 75% at 50% 42%, ${hslColor(theme.hue, 80, 55, 0.1)} 0%, transparent 52%),
    radial-gradient(ellipse 95% 85% at 50% 50%, ${hslColor(theme.hue, 42, 14)} 0%, ${hslColor(theme.hue, 48, 9)} 42%, ${hslColor(theme.hue, 55, 5)} 100%)
  `;
}

function segmentIntersectsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  const rSq = radius * radius;

  if (lenSq === 0) {
    const ddx = cx - x1;
    const ddy = cy - y1;
    return ddx * ddx + ddy * ddy <= rSq;
  }

  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const ddx = cx - closestX;
  const ddy = cy - closestY;
  return ddx * ddx + ddy * ddy <= rSq;
}

function getZombieHitRadius(zombie) {
  const boss = zombie?.tier === "waveBoss" || zombie?.isWaveBoss;
  return zombie.size * (boss ? 0.54 : 0.56) + BULLET_SIZE * 0.85;
}

function getBulletZombieHitInfo(bullet, zombie) {
  const cx = zombie.x + zombie.size / 2;
  const cy = zombie.y + zombie.size / 2;
  const hitRadius = getZombieHitRadius(zombie);
  const x1 = bullet.prevX ?? bullet.x;
  const y1 = bullet.prevY ?? bullet.y;
  const x2 = bullet.x;
  const y2 = bullet.y;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  let t;
  let closestX;
  let closestY;

  if (lenSq < 0.001) {
    t = 0;
    closestX = x2;
    closestY = y2;
  } else {
    t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
    t = clamp(t, 0, 1);
    closestX = x1 + t * dx;
    closestY = y1 + t * dy;
  }

  const ddx = cx - closestX;
  const ddy = cy - closestY;
  const distSq = ddx * ddx + ddy * ddy;
  if (distSq > hitRadius * hitRadius) return null;

  return { t, distSq };
}

function findBulletHitZombieIndex(bullet) {
  let bestIndex = -1;
  let bestT = Infinity;
  let bestDistSq = Infinity;

  for (let j = 0; j < zombies.length; j++) {
    if (bullet.hitZombies?.has(zombies[j])) continue;
    const hit = getBulletZombieHitInfo(bullet, zombies[j]);
    if (!hit) continue;

    if (
      hit.t < bestT - 0.000001 ||
      (Math.abs(hit.t - bestT) <= 0.000001 && hit.distSq < bestDistSq)
    ) {
      bestT = hit.t;
      bestDistSq = hit.distSq;
      bestIndex = j;
    }
  }

  return bestIndex;
}

function bulletHitsZombie(bullet, zombie) {
  return getBulletZombieHitInfo(bullet, zombie) !== null;
}

const BLOOD_COLORS = {
  poolDeep: "#240606",
  poolDark: "#3d0a0a",
  poolMid: "#5c1010",
  poolWet: "#731616",
  fresh: "#8a1a1a",
  sheen: "rgba(150,36,36,0.42)",
  mist: "rgba(70,14,14,0.55)",
  dry: "#2a1410",
  edge: "rgba(12,4,4,0.72)"
};

const BLOOD_GORE = {
  maxEffects: 560,
  sprayMult: 2.85,
  killSprayMult: 3.6,
  splatSizeMult: 1.55,
  hitIntensity: { normal: 1.85, heavy: 2.65, crit: 3.8 },
  killIntensityBase: 2.4,
  killIntensityStreak: 0.18
};

function buildBloodBlobPoints(rx, ry, hitAngle) {
  const points = [];
  const lobes = 8 + Math.floor(Math.random() * 4);

  for (let i = 0; i < lobes; i++) {
    const t = (Math.PI * 2 * i) / lobes + (Math.random() - 0.5) * 0.35;
    const bulge = 0.52 + Math.random() * 0.5;
    const squash = 0.68 + Math.random() * 0.38;
    points.push({
      x: Math.cos(t) * rx * bulge,
      y: Math.sin(t) * ry * bulge * squash
    });
  }

  const tendrils = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < tendrils; i++) {
    const spread = (Math.random() - 0.5) * 0.75;
    const dist = 0.72 + Math.random() * 0.58;
    points.push({
      x: Math.cos(hitAngle + spread) * rx * dist,
      y: Math.sin(hitAngle + spread) * ry * dist * 0.62
    });
  }

  return points;
}

function traceBloodBlob(ctx, points) {
  if (points.length < 3) return;
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const mx = (prev.x + curr.x) * 0.5;
    const my = (prev.y + curr.y) * 0.5;
    ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
  }
  const last = points[points.length - 1];
  const first = points[0];
  ctx.quadraticCurveTo(last.x, last.y, (last.x + first.x) * 0.5, (last.y + first.y) * 0.5);
  ctx.closePath();
}

function mixBloodTone(brightHex, dryHex, age) {
  const t = Math.max(0, Math.min(1, age));
  const parse = (hex) => {
    const value = hex.replace("#", "");
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16)
    ];
  };
  const a = parse(brightHex);
  const b = parse(dryHex);
  const mix = a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function pushBloodSplat(x, y, rx, ry, rot, lifeScale = 1) {
  const splatLife = Math.round((150 + Math.random() * 110) * lifeScale);
  bloodEffects.push({
    type: "splat",
    x,
    y,
    rx,
    ry,
    life: splatLife,
    maxLife: splatLife,
    rot,
    blob: buildBloodBlobPoints(rx, ry, rot)
  });
}

function pushBloodSpray(cx, cy, angle, scale, intensity = 1, spreadMult = 1) {
  const sprayPower = intensity * BLOOD_GORE.sprayMult;
  const dropCount = Math.round((16 + Math.floor(12 * scale)) * sprayPower);
  for (let i = 0; i < dropCount; i++) {
    const spread = (Math.random() - 0.5) * (1.45 + intensity * 0.55) * spreadMult;
    const speed = (3.5 + Math.random() * (8 + intensity * 3.5)) * (0.9 + scale * 0.12);
    const a = angle + spread;
    const dropLife = 28 + Math.floor(Math.random() * 34);
    bloodEffects.push({
      type: "drop",
      x: cx + (Math.random() - 0.5) * 14 * scale,
      y: cy + (Math.random() - 0.5) * 14 * scale,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 0.45,
      life: dropLife,
      maxLife: dropLife,
      size: (2.4 + Math.random() * 4.8 * scale) * (0.9 + intensity * 0.2)
    });
  }

  const streakCount = Math.max(5, Math.round(9 * sprayPower));
  for (let i = 0; i < streakCount; i++) {
    const spread = (Math.random() - 0.5) * 1.15 * spreadMult;
    const speed = 6 + Math.random() * (11 + intensity * 4);
    const a = angle + spread;
    const streakLife = 14 + Math.floor(Math.random() * 18);
    bloodEffects.push({
      type: "streak",
      x: cx + Math.cos(a) * 5,
      y: cy + Math.sin(a) * 5,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: streakLife,
      maxLife: streakLife,
      len: (12 + Math.random() * 22 * scale) * (0.95 + intensity * 0.45),
      width: 1.2 + Math.random() * (2.2 + intensity * 0.9)
    });
  }

  const mistCount = Math.round((14 + Math.random() * 16) * sprayPower);
  for (let i = 0; i < mistCount; i++) {
    const spread = (Math.random() - 0.5) * 1.85 * spreadMult;
    const speed = 1.8 + Math.random() * (4.2 + intensity * 1.2);
    const a = angle + spread;
    const mistLife = 18 + Math.floor(Math.random() * 24);
    bloodEffects.push({
      type: "mist",
      x: cx + (Math.random() - 0.5) * 12,
      y: cy + (Math.random() - 0.5) * 12,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 0.25,
      life: mistLife,
      maxLife: mistLife,
      size: 1.4 + Math.random() * (3.4 + intensity * 0.6)
    });
  }
}

function pushBloodGush(cx, cy, angle, scale, intensity = 1) {
  const gushPower = intensity * BLOOD_GORE.killSprayMult;
  const jetCount = Math.round(14 + gushPower * 8);
  for (let i = 0; i < jetCount; i++) {
    const spread = (Math.random() - 0.5) * 2.4;
    const speed = 8 + Math.random() * (14 + intensity * 5);
    const a = angle + spread;
    const streakLife = 16 + Math.floor(Math.random() * 20);
    bloodEffects.push({
      type: "streak",
      x: cx + Math.cos(a) * 3,
      y: cy + Math.sin(a) * 3,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 0.8,
      life: streakLife,
      maxLife: streakLife,
      len: (18 + Math.random() * 28 * scale) * (1 + intensity * 0.35),
      width: 1.5 + Math.random() * (2.8 + intensity)
    });
  }

  const burstCount = Math.round(24 + gushPower * 14);
  for (let i = 0; i < burstCount; i++) {
    const a = angle + (Math.random() - 0.5) * Math.PI * 0.95;
    const speed = 4 + Math.random() * (12 + intensity * 4);
    const dropLife = 30 + Math.floor(Math.random() * 36);
    bloodEffects.push({
      type: "drop",
      x: cx + (Math.random() - 0.5) * 10,
      y: cy + (Math.random() - 0.5) * 10,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 1.1,
      life: dropLife,
      maxLife: dropLife,
      size: 2.8 + Math.random() * (5.5 * scale + intensity)
    });
  }
}

function spawnBloodHit(zombie, hitInfo, options = {}) {
  const cx = zombie.x + zombie.size / 2;
  const cy = zombie.y + zombie.size / 2;
  const angle = hitInfo?.angle ?? Math.random() * Math.PI * 2;
  const scale = Math.max(0.75, zombie.size / ZOMBIE_DRAW_SIZE);
  const intensity = options.isCrit
    ? BLOOD_GORE.hitIntensity.crit
    : options.isHeavy
      ? BLOOD_GORE.hitIntensity.heavy
      : BLOOD_GORE.hitIntensity.normal;
  const splatMult = BLOOD_GORE.splatSizeMult;

  pushBloodSpray(cx, cy - zombie.size * 0.04, angle, scale, intensity, 1);
  pushBloodSpray(cx, cy - zombie.size * 0.04, angle + (Math.random() - 0.5) * 0.35, scale, intensity * 0.72, 1.35);

  if (options.isCrit || options.isHeavy) {
    pushBloodGush(cx, cy, angle, scale, intensity * 0.55);
  }

  pushBloodSplat(
    cx + Math.cos(angle) * 4,
    cy + zombie.size * 0.06 + Math.sin(angle) * 2,
    (10 + Math.random() * 10) * scale * splatMult * (options.isCrit ? 1.15 : 0.9),
    (6 + Math.random() * 7) * scale * splatMult * (options.isCrit ? 1.15 : 0.9),
    angle + (Math.random() - 0.5) * 0.45,
    options.isCrit || options.isHeavy ? 0.95 : 0.78
  );

  if (options.isCrit || options.isHeavy) {
    pushBloodSplat(
      cx + Math.cos(angle) * (10 + Math.random() * 8),
      cy + zombie.size * 0.06 + Math.sin(angle) * (6 + Math.random() * 6),
      (7 + Math.random() * 8) * scale * splatMult,
      (5 + Math.random() * 6) * scale * splatMult,
      angle + (Math.random() - 0.5) * 0.8,
      0.82
    );
  }

  trimBloodEffects();
}

function spawnBloodBurst(zombie, hitInfo) {
  const cx = zombie.x + zombie.size / 2;
  const cy = zombie.y + zombie.size / 2;
  const angle = hitInfo?.angle ?? Math.random() * Math.PI * 2;
  const scale = Math.max(0.8, zombie.size / ZOMBIE_DRAW_SIZE);
  const streakBonus = typeof runKillStreak !== "undefined" ? Math.min(12, Math.max(0, runKillStreak - 2)) : 0;
  const intensity = BLOOD_GORE.killIntensityBase + streakBonus * BLOOD_GORE.killIntensityStreak;
  const splatMult = BLOOD_GORE.splatSizeMult;

  pushBloodSplat(
    cx + Math.cos(angle) * 2,
    cy + zombie.size * 0.08 + Math.sin(angle) * 2,
    (28 + Math.random() * 22) * scale * splatMult,
    (18 + Math.random() * 16) * scale * splatMult,
    angle + (Math.random() - 0.5) * 0.55
  );

  pushBloodSplat(
    cx + Math.cos(angle + Math.PI) * 6,
    cy + zombie.size * 0.08 + Math.sin(angle + Math.PI) * 4,
    (18 + Math.random() * 14) * scale * splatMult,
    (12 + Math.random() * 10) * scale * splatMult,
    angle + Math.PI + (Math.random() - 0.5) * 0.7
  );

  const satelliteCount = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < satelliteCount; i++) {
    const offsetAngle = angle + (Math.random() - 0.5) * 2.4;
    const dist = (18 + Math.random() * 34) * scale;
    pushBloodSplat(
      cx + Math.cos(offsetAngle) * dist,
      cy + zombie.size * 0.08 + Math.sin(offsetAngle) * dist * 0.45,
      (10 + Math.random() * 12) * scale * splatMult,
      (7 + Math.random() * 9) * scale * splatMult,
      offsetAngle + (Math.random() - 0.5) * 0.7,
      0.88
    );
  }

  pushBloodSpray(cx, cy - zombie.size * 0.02, angle, scale, intensity, 1);
  pushBloodSpray(cx, cy - zombie.size * 0.02, angle + 0.55, scale, intensity * 0.85, 1.6);
  pushBloodSpray(cx, cy - zombie.size * 0.02, angle - 0.55, scale, intensity * 0.85, 1.6);
  pushBloodGush(cx, cy, angle, scale, intensity);
  trimBloodEffects();
}

function trimBloodEffects() {
  while (bloodEffects.length > BLOOD_GORE.maxEffects) bloodEffects.shift();
}

function updateBloodEffects() {
  for (let i = bloodEffects.length - 1; i >= 0; i--) {
    const p = bloodEffects[i];
    p.life -= 1;
    if (p.life <= 0) {
      bloodEffects.splice(i, 1);
      continue;
    }
    if (p.type === "drop") {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.vy += 0.18;
    } else if (p.type === "streak") {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.84;
      p.vy *= 0.84;
      p.vy += 0.04;
    } else if (p.type === "mist") {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.vy += 0.015;
    }
  }
}

function drawBloodSplat(p, alpha) {
  const age = 1 - p.life / p.maxLife;
  const bodyColor = mixBloodTone(BLOOD_COLORS.poolMid, BLOOD_COLORS.dry, age * 0.85);
  const wetColor = mixBloodTone(BLOOD_COLORS.poolWet, BLOOD_COLORS.poolDark, age * 0.55);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);

  ctx.globalAlpha = alpha * (0.92 - age * 0.08);
  ctx.fillStyle = BLOOD_COLORS.poolDeep;
  ctx.beginPath();
  traceBloodBlob(ctx, p.blob);
  ctx.fill();

  ctx.globalAlpha = alpha * (0.88 - age * 0.12);
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  traceBloodBlob(ctx, p.blob);
  ctx.fill();

  ctx.save();
  ctx.scale(0.72, 0.68);
  ctx.globalAlpha = alpha * (0.42 - age * 0.28);
  ctx.fillStyle = wetColor;
  ctx.beginPath();
  traceBloodBlob(ctx, p.blob);
  ctx.fill();
  ctx.restore();

  ctx.globalAlpha = alpha * Math.max(0, 0.34 - age * 0.24);
  ctx.fillStyle = BLOOD_COLORS.sheen;
  ctx.beginPath();
  ctx.ellipse(-p.rx * 0.12, -p.ry * 0.18, p.rx * 0.22, p.ry * 0.14, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha * (0.55 - age * 0.2);
  ctx.strokeStyle = BLOOD_COLORS.edge;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  traceBloodBlob(ctx, p.blob);
  ctx.stroke();

  ctx.restore();
}

function drawBloodDrop(p, alpha) {
  const speed = Math.hypot(p.vx, p.vy);
  const angle = Math.atan2(p.vy, p.vx);
  const stretch = 1 + Math.min(2.4, speed * 0.2);
  const age = 1 - p.life / p.maxLife;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha * (0.9 - age * 0.15);
  ctx.fillStyle = mixBloodTone(BLOOD_COLORS.poolDark, BLOOD_COLORS.dry, age * 0.7);
  ctx.beginPath();
  ctx.ellipse(0, 0, p.size * stretch, p.size * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha * Math.max(0, 0.28 - age * 0.18);
  ctx.fillStyle = BLOOD_COLORS.sheen;
  ctx.beginPath();
  ctx.ellipse(-p.size * 0.12 * stretch, -p.size * 0.18, p.size * 0.24, p.size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBloodStreak(p, alpha) {
  const angle = Math.atan2(p.vy, p.vx);
  const lifeRatio = p.life / p.maxLife;
  const len = p.len * (0.35 + lifeRatio * 0.65);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha * 0.78;
  ctx.lineCap = "round";
  ctx.strokeStyle = BLOOD_COLORS.poolDark;
  ctx.lineWidth = p.width * 1.15;
  ctx.beginPath();
  ctx.moveTo(-len * 0.08, 0);
  ctx.lineTo(len * 0.92, 0);
  ctx.stroke();

  const grad = ctx.createLinearGradient(-len * 0.1, 0, len * 0.9, 0);
  grad.addColorStop(0, BLOOD_COLORS.poolDeep);
  grad.addColorStop(0.25, BLOOD_COLORS.fresh);
  grad.addColorStop(0.72, "rgba(90,18,18,0.45)");
  grad.addColorStop(1, "rgba(60,12,12,0)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = p.width;
  ctx.beginPath();
  ctx.moveTo(-len * 0.08, 0);
  ctx.lineTo(len * 0.92, 0);
  ctx.stroke();
  ctx.restore();
}

function drawBloodMist(p, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillStyle = BLOOD_COLORS.mist;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.22;
  ctx.fillStyle = BLOOD_COLORS.sheen;
  ctx.beginPath();
  ctx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBloodEffects() {
  for (const p of bloodEffects) {
    const alpha = Math.max(0, p.life / p.maxLife);
    if (p.type === "splat") {
      drawBloodSplat(p, alpha);
      continue;
    }
    if (p.type === "streak") {
      drawBloodStreak(p, alpha);
      continue;
    }
    if (p.type === "mist") {
      drawBloodMist(p, alpha);
      continue;
    }
    drawBloodDrop(p, alpha);
  }
  ctx.globalAlpha = 1;
}

function spawnFloatingText(x, y, text, color = "#ffe066", scale = 1) {
  floatingTexts.push({
    x,
    y,
    text,
    color,
    scale,
    life: 50,
    maxLife: 50,
    vy: -0.9
  });
  while (floatingTexts.length > 24) floatingTexts.shift();
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const t = floatingTexts[i];
    t.life -= 1;
    t.y += t.vy;
    if (t.vx) t.x += t.vx;
    if (t.life <= 0) floatingTexts.splice(i, 1);
  }
}

function drawFloatingTexts() {
  for (const t of floatingTexts) {
    const alpha = Math.max(0, t.life / t.maxLife);
    const lifeRatio = 1 - t.life / t.maxLife;
    const popScale =
      t.kind === "damage"
        ? (t.pop || 1) + Math.sin(lifeRatio * Math.PI) * 0.16
        : 1;
    const size = Math.round(11 * (t.scale || 1) * popScale);
    const isBigDamage =
      t.kind === "damage" &&
      (t.style === "crit" ||
        t.style === "burst" ||
        t.style === "bossCrit" ||
        t.style === "kill");

    ctx.save();
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = alpha;

    if (isBigDamage) {
      ctx.shadowColor =
        t.style === "kill" || t.style === "burst" ? "#ff5555" : "#ffaa33";
      ctx.shadowBlur = t.style === "burst" || t.style === "bossCrit" ? 18 : 12;
    }

    ctx.strokeStyle = "rgba(0,0,0,0.92)";
    ctx.lineWidth = isBigDamage ? 3 : 2;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

const PLAYER_REWARD_TIERS = {
  normal: {
    life: 150,
    feedLife: 140,
    glow: 24,
    sparkles: 4,
    motes: 2,
    showRing: false,
    badgeW: 92,
    badgeH: 34,
    fontXp: 14,
    fontSp: 11,
    playSound: false
  },
  elite: {
    life: 190,
    feedLife: 190,
    glow: 50,
    sparkles: 7,
    motes: 4,
    showRing: true,
    badgeW: 104,
    badgeH: 44,
    fontXp: 15,
    fontSp: 11,
    playSound: false
  },
  waveBoss: {
    life: 230,
    feedLife: 230,
    glow: 90,
    sparkles: 10,
    motes: 6,
    showRing: true,
    badgeW: 124,
    badgeH: 54,
    fontXp: 16,
    fontSp: 12,
    playSound: true
  }
};

function getRewardFadeAlpha(life, maxLife) {
  const ratio = life / maxLife;
  if (ratio > 0.45) return 1;
  return ratio / 0.45;
}

function createPlayerRewardEffect({ xp, sp, spLabel, tier, kind, stackIndex }) {
  const config = PLAYER_REWARD_TIERS[tier] || PLAYER_REWARD_TIERS.normal;
  const colors = getZombieRewardColors(kind);

  return {
    tier,
    kind,
    colors,
    life: config.life,
    maxLife: config.life,
    xp: Math.max(0, Math.round(Number(xp) || 0)),
    sp: Math.max(0, Math.round(Number(sp) || 0)),
    spLabel: spLabel || (sp > 0 ? `+${sp} SP` : ""),
    stackIndex,
    ringScale: tier === "waveBoss" ? 0.35 : 0.22,
    floatY: 0,
    sparkles: Array.from({ length: config.sparkles }, (_, index) => ({
      angle: (index / config.sparkles) * Math.PI * 2 + Math.random() * 0.35,
      dist: 6 + Math.random() * (tier === "normal" ? 6 : 10),
      speed: 0.55 + Math.random() * (tier === "normal" ? 0.45 : 0.9),
      size: tier === "normal" ? 1.2 + Math.random() * 1.2 : 1.8 + Math.random() * 2.2,
      tone: colors.sparkles[index % colors.sparkles.length]
    })),
    motes: Array.from({ length: config.motes }, (_, index) => ({
      x: (Math.random() - 0.5) * (tier === "normal" ? 24 : 36),
      y: 8 + Math.random() * 16,
      vy: -0.28 - Math.random() * 0.22,
      life: 40 + Math.round(Math.random() * 20),
      maxLife: 60,
      tone: index % 2 ? colors.sp : colors.xp
    }))
  };
}

function applyPlayerRewardGlow(config, colors) {
  player.rewardGlow = Math.max(player.rewardGlow, config.glow);
  player.rewardGlowColor = colors.glow;
}

function spawnPlayerKillReward({ xp, sp = 0, spLabel = "", tier = "normal", kind = "normal" }) {
  const config = PLAYER_REWARD_TIERS[tier] || PLAYER_REWARD_TIERS.normal;
  const colors = getZombieRewardColors(kind);

  if (tier === "normal" && sp === 0) {
    if (!playerXpFeed) {
      playerXpFeed = {
        xp: 0,
        killCount: 0,
        kind,
        colors,
        life: config.feedLife,
        maxLife: config.feedLife,
        floatY: 0,
        pulse: 0
      };
    }

    playerXpFeed.xp += xp;
    playerXpFeed.killCount += 1;
    playerXpFeed.kind = kind;
    playerXpFeed.colors = colors;
    playerXpFeed.life = playerXpFeed.maxLife;
    playerXpFeed.floatY = 0;
    playerXpFeed.pulse = 16;
    applyPlayerRewardGlow(config, colors);
    return;
  }

  if (tier === "normal" && sp > 0) {
    const totalXp = (playerXpFeed?.xp || 0) + xp;
    const feedKind = playerXpFeed?.kind || kind;
    playerXpFeed = null;
    playerRewardEffects.push(
      createPlayerRewardEffect({
        xp: totalXp,
        sp,
        spLabel,
        tier: "elite",
        kind: feedKind,
        stackIndex: playerRewardEffects.length
      })
    );
  } else {
    playerXpFeed = null;
    playerRewardEffects.push(
      createPlayerRewardEffect({
        xp,
        sp,
        spLabel,
        tier,
        kind,
        stackIndex: playerRewardEffects.length
      })
    );
  }

  applyPlayerRewardGlow(config, colors);
  while (playerRewardEffects.length > 4) playerRewardEffects.shift();

  if (config.playSound && typeof playXpPickupSound === "function") playXpPickupSound();
}

function updatePlayerRewardEffects() {
  if (player.rewardGlow > 0) player.rewardGlow -= 1;

  if (playerXpFeed) {
    playerXpFeed.life -= 1;
    playerXpFeed.floatY -= 0.06;
    if (playerXpFeed.pulse > 0) playerXpFeed.pulse -= 1;
    if (playerXpFeed.life <= 0) playerXpFeed = null;
  }

  for (let i = playerRewardEffects.length - 1; i >= 0; i--) {
    const fx = playerRewardEffects[i];
    fx.life -= 1;
    fx.floatY -= fx.tier === "normal" ? 0.08 : 0.11;
    fx.ringScale += fx.tier === "normal" ? 0.018 : 0.028;
    fx.stackIndex = i;

    for (const sparkle of fx.sparkles) {
      sparkle.dist += sparkle.speed;
      sparkle.angle += fx.tier === "normal" ? 0.008 : 0.012;
    }

    for (let j = fx.motes.length - 1; j >= 0; j--) {
      const mote = fx.motes[j];
      mote.life -= 1;
      mote.y += mote.vy;
      mote.x *= 0.985;
      if (mote.life <= 0) fx.motes.splice(j, 1);
    }

    if (fx.life <= 0) playerRewardEffects.splice(i, 1);
  }
}

function drawRewardBadge({
  cx,
  badgeY,
  badgeW,
  badgeH,
  radius,
  alpha,
  pop,
  xpText,
  xpColor,
  spText,
  spColor,
  fontXp,
  fontSp,
  shadowBlur,
  shadowColor,
  strokeColor
}) {
  const badgeX = cx - badgeW / 2;
  const hasSp = !!spText;

  ctx.globalAlpha = Math.min(1, alpha * 1.12);
  ctx.shadowBlur = shadowBlur;
  ctx.shadowColor = shadowColor;
  ctx.fillStyle = "rgba(6, 16, 24, 0.92)";
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const xpY = hasSp ? badgeY + badgeH * 0.36 : badgeY + badgeH / 2;
  ctx.font = `bold ${Math.round(fontXp * pop)}px monospace`;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.lineWidth = 3;
  ctx.strokeText(xpText, cx, xpY);
  ctx.fillStyle = xpColor;
  ctx.fillText(xpText, cx, xpY);

  if (hasSp) {
    const spY = badgeY + badgeH * 0.74;
    ctx.font = `bold ${Math.round(fontSp * pop)}px monospace`;
    ctx.strokeText(spText, cx, spY);
    ctx.fillStyle = spColor;
    ctx.fillText(spText, cx, spY);
  }
}

function getPlayerOverheadStackTop() {
  let top = null;
  if (playerXpFeed) {
    top = player.y - 34 + playerXpFeed.floatY;
  }
  for (const fx of playerRewardEffects) {
    const config = PLAYER_REWARD_TIERS[fx.tier] || PLAYER_REWARD_TIERS.normal;
    const stackLift = fx.stackIndex * (fx.tier === "normal" ? 10 : 13);
    const badgeY = player.y - 32 - stackLift + fx.floatY;
    top = top == null ? badgeY : Math.min(top, badgeY);
  }
  return top;
}

function drawPlayerXpFeed() {
  if (!playerXpFeed) return;

  const config = PLAYER_REWARD_TIERS.normal;
  const colors = playerXpFeed.colors || ZOMBIE_REWARD_COLORS.normal;
  const cx = player.x + PLAYER_SIZE / 2;
  const alpha = getRewardFadeAlpha(playerXpFeed.life, playerXpFeed.maxLife);
  const pop = playerXpFeed.pulse > 0 ? 1 + playerXpFeed.pulse * 0.02 : 1;
  const badgeY = player.y - 34 + playerXpFeed.floatY;
  const xpText = `+${formatHudNumber(playerXpFeed.xp)} XP`;

  ctx.save();
  drawRewardBadge({
    cx,
    badgeY,
    badgeW: config.badgeW,
    badgeH: config.badgeH,
    radius: 10,
    alpha,
    pop,
    xpText,
    xpColor: colors.xp,
    spText: "",
    spColor: "",
    fontXp: config.fontXp,
    fontSp: config.fontSp,
    shadowBlur: 10,
    shadowColor: colors.shadow,
    strokeColor: colors.stroke
  });
  ctx.restore();
}

function drawPlayerRewardEffects() {
  const cx = player.x + PLAYER_SIZE / 2;
  const cy = player.y + PLAYER_SIZE / 2;

  for (const fx of playerRewardEffects) {
    const config = PLAYER_REWARD_TIERS[fx.tier] || PLAYER_REWARD_TIERS.normal;
    const colors = fx.colors || getZombieRewardColors(fx.kind);
    const progress = 1 - fx.life / fx.maxLife;
    const alpha = getRewardFadeAlpha(fx.life, fx.maxLife);
    const pop = progress < 0.18 ? 0.76 + (progress / 0.18) * 0.24 : 1;
    const stackLift = fx.stackIndex * (fx.tier === "normal" ? 10 : 13);

    ctx.save();

    if (config.showRing) {
      for (const sparkle of fx.sparkles) {
        const sx = cx + Math.cos(sparkle.angle) * sparkle.dist;
        const sy = cy + Math.sin(sparkle.angle) * sparkle.dist * 0.82 - fx.floatY * 0.25;
        const sparkleAlpha = alpha * Math.max(0, 1 - sparkle.dist / 92);
        ctx.globalAlpha = sparkleAlpha;
        ctx.fillStyle = sparkle.tone;
        ctx.shadowBlur = fx.kind === "waveBoss" ? 10 : 6;
        ctx.shadowColor = sparkle.tone;
        ctx.beginPath();
        ctx.arc(sx, sy, sparkle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      ctx.globalAlpha = alpha * (fx.kind === "waveBoss" ? 0.55 : 0.38);
      ctx.strokeStyle = colors.ring;
      ctx.lineWidth = fx.kind === "waveBoss" ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 8, 18 + fx.ringScale * (fx.kind === "waveBoss" ? 58 : 42), 0, Math.PI * 2);
      ctx.stroke();

      if (colors.ring2) {
        ctx.globalAlpha = alpha * 0.34;
        ctx.strokeStyle = colors.ring2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 8, 14 + fx.ringScale * 34, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (const mote of fx.motes) {
      const moteAlpha = alpha * (mote.life / mote.maxLife);
      ctx.globalAlpha = moteAlpha;
      ctx.fillStyle = mote.tone;
      ctx.beginPath();
      ctx.arc(cx + mote.x, cy + mote.y + fx.floatY * 0.15, config.showRing ? 2.2 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    const badgeH = fx.sp > 0 ? config.badgeH : Math.max(28, config.badgeH - 12);
    const badgeY = player.y - 32 - stackLift + fx.floatY;
    const xpText = `+${formatHudNumber(fx.xp)} XP`;

    drawRewardBadge({
      cx,
      badgeY,
      badgeW: config.badgeW,
      badgeH,
      radius: fx.tier === "normal" ? 10 : 12,
      alpha,
      pop,
      xpText,
      xpColor: colors.xp,
      spText: fx.sp > 0 ? fx.spLabel : "",
      spColor: fx.kind === "waveBoss" ? colors.sp : colors.sp,
      fontXp: config.fontXp,
      fontSp: config.fontSp,
      shadowBlur: fx.kind === "waveBoss" ? 20 : fx.kind === "normal" ? 10 : 14,
      shadowColor: colors.shadow,
      strokeColor: colors.stroke
    });

    ctx.restore();
  }

  drawPlayerXpFeed();

  if (typeof drawActiveKillStreakHudAt === "function") {
    drawActiveKillStreakHudAt(cx, player.y - 2, getPlayerOverheadStackTop());
  }

  ctx.globalAlpha = 1;
}

function getWeaponById(weaponId) {
  return WEAPONS.find((weapon) => weapon.id === weaponId) || WEAPONS[0];
}

function getEquippedWeapon() {
  return getWeaponById(equippedWeaponId);
}

function getShootCooldown() {
  return Math.max(
    3,
    Math.round(SHOOT_COOLDOWN * getEquippedWeapon().cooldownMult * getRunFireRateMult())
  );
}

function canPlayerShoot() {
  if (!gameRunning || !c || paused || isGameOverVisible()) return false;
  if (deathSequence?.active) return false;
  return true;
}

function getWeaponLevel(weaponId) {
  return Number(weaponLevels[weaponId] || 0);
}

function getTotalWeaponLevels() {
  return WEAPONS.reduce((sum, weapon) => sum + getWeaponLevel(weapon.id), 0);
}

function getTotalPowerUpgrades() {
  return (
    getTotalWeaponLevels() +
    Number(player.upgrades.hp || 0) +
    Number(player.upgrades.bulletSpeed || 0)
  );
}

function getWeaponPower(weaponId) {
  const weapon = getWeaponById(weaponId);
  const level = getWeaponLevel(weaponId);
  const levelScale = 1 + level * (1.08 + level * 0.035);
  return Math.max(1, Math.round(levelScale * weapon.damageMult));
}

function getEffectivePlayerDamage() {
  return getWeaponPower(equippedWeaponId);
}

function syncPlayerDamageFromWeapon() {
  player.damage = getEffectivePlayerDamage();
}

function getBulletDamage(weapon) {
  return Math.round(getWeaponPower(weapon.id) * getRunDamageMult());
}

function isWeaponUnlocked(weaponId) {
  return unlockedWeapons.has(weaponId);
}

function selectWeapon(weaponId) {
  if (!isWeaponUnlocked(weaponId) || equippedWeaponId === weaponId) return false;
  if (isNicknameScreenVisible() || isGameOverVisible()) return false;
  if (!gameRunning && !canUseSkillShop()) return false;

  equippedWeaponId = weaponId;
  const weapon = getEquippedWeapon();
  syncPlayerDamageFromWeapon();
  showMilestone(`${weapon.emoji} Weapon: ${weapon.name}`);
  saveProgress();
  updateUI();
  return true;
}

function unlockWeapon(weaponId) {
  if (!canUseSkillShop()) return false;

  const weapon = getWeaponById(weaponId);
  if (!weapon || isWeaponUnlocked(weaponId)) return false;
  if (player.skillPoints < weapon.unlockCost) return false;

  player.skillPoints -= weapon.unlockCost;
  unlockedWeapons.add(weaponId);
  equippedWeaponId = weaponId;
  syncPlayerDamageFromWeapon();
  playShopUpgradeFeedback();
  showMilestone(`${weapon.emoji} ${weapon.name} unlocked!`);
  saveProgress();
  updateUI();
  return true;
}

function getWeaponShopRenderKey() {
  return [
    player.skillPoints,
    equippedWeaponId,
    ...WEAPONS.map(
      (weapon) =>
        `${weapon.id}:${getWeaponLevel(weapon.id)}:${isWeaponUnlocked(weapon.id) ? 1 : 0}`
    )
  ].join("|");
}

let lastWeaponShopRenderKey = "";

function renderWeaponShopList(force = false) {
  const listEl = document.getElementById("weapon-shop-list");
  if (!listEl) return;

  const renderKey = getWeaponShopRenderKey();
  if (!force && renderKey === lastWeaponShopRenderKey) return;
  lastWeaponShopRenderKey = renderKey;

  listEl.innerHTML = WEAPONS.map((weapon) => {
    const unlocked = isWeaponUnlocked(weapon.id);
    const equipped = equippedWeaponId === weapon.id;
    const level = getWeaponLevel(weapon.id);
    const power = getWeaponPower(weapon.id);
    const canBuy = !unlocked && player.skillPoints >= weapon.unlockCost;
    const canUpgrade = unlocked && player.skillPoints > 0;

    let action = "";
    if (unlocked) {
      action = `<button type="button" class="weapon-shop-btn equip${equipped ? " active" : ""}" data-weapon-action="equip" data-weapon-id="${weapon.id}" ${equipped ? "disabled" : ""}>${equipped ? "Equipped" : "Select"}</button>`;
      action += `<button type="button" class="weapon-shop-btn upgrade" data-weapon-action="upgrade" data-weapon-id="${weapon.id}" ${canUpgrade ? "" : "disabled"}>Upgrade</button>`;
    } else {
      action = `<button type="button" class="weapon-shop-btn buy" data-weapon-action="buy" data-weapon-id="${weapon.id}" ${canBuy ? "" : "disabled"}>Buy ${weapon.unlockCost} SP</button>`;
    }

    return `<div class="weapon-shop-row${equipped ? " equipped" : ""}">
  <div class="weapon-shop-top">
    <span class="weapon-shop-name">${weapon.hotkey}. ${weapon.emoji} ${escapeHtml(weapon.name)}</span>
    <div class="weapon-shop-actions">${action}</div>
  </div>
  <div class="weapon-shop-desc">${escapeHtml(weapon.desc)}</div>
  <div class="weapon-shop-meta">${unlocked ? `Level ${level} · ${power} damage` : "Unlock to upgrade"}</div>
</div>`;
  }).join("");
}

function playShopUpgradeFeedback() {
  if (typeof playUpgradeDing === "function") playUpgradeDing();
}

function upgradeWeaponLevel(weaponId, count) {
  if (!canUseSkillShop() || !isWeaponUnlocked(weaponId)) return 0;

  const spend = Math.min(Math.max(1, count || 1), player.skillPoints);
  if (spend <= 0) return 0;

  player.skillPoints -= spend;
  weaponLevels[weaponId] = getWeaponLevel(weaponId) + spend;
  syncPlayerDamageFromWeapon();
  playShopUpgradeFeedback();
  return spend;
}

function handleWeaponHotkey(key) {
  if (!gameRunning || isGameOverVisible() || isNicknameScreenVisible()) return;
  const weapon = WEAPONS.find((entry) => entry.hotkey === key);
  if (!weapon) return;
  selectWeapon(weapon.id);
}

function rollCritHit() {
  return Math.random() < 0.12;
}

function processBulletHit(bullet, hitIndex) {
  const zombie = zombies[hitIndex];
  if (!zombie) return "remove";
  if (!bullet.hitZombies) bullet.hitZombies = new Set();
  if (bullet.hitZombies.has(zombie)) return "continue";
  bullet.hitZombies.add(zombie);
  damageZombie(
    zombie,
    hitIndex,
    { angle: bullet.angle ?? Math.atan2(bullet.dy, bullet.dx) },
    bullet.damage
  );
  if ((bullet.pierceLeft ?? 0) <= 0) return "remove";
  bullet.pierceLeft -= 1;
  return "continue";
}

function updateBullets() {
  const maxStep = 10;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    let remainingX = b.dx * b.speed;
    let remainingY = b.dy * b.speed;
    let travelLeft = Math.hypot(remainingX, remainingY);

    if (travelLeft <= 0.001) {
      bullets.splice(i, 1);
      continue;
    }

    let removeBullet = false;

    while (travelLeft > 0.001) {
      const step = Math.min(maxStep, travelLeft);
      const ratio = step / travelLeft;
      const stepX = remainingX * ratio;
      const stepY = remainingY * ratio;

      b.prevX = b.x;
      b.prevY = b.y;
      b.x += stepX;
      b.y += stepY;
      remainingX -= stepX;
      remainingY -= stepY;
      travelLeft -= step;

      if (Math.hypot(b.x - b.prevX, b.y - b.prevY) > 0.35) {
        pushBulletAfterglow(b.prevX, b.prevY, b.x, b.y, b.color);
      }

      if (b.x < 0 || b.y < 0 || b.x > WORLD_WIDTH || b.y > WORLD_HEIGHT) {
        removeBullet = true;
        break;
      }

      const hitIndex = findBulletHitZombieIndex(b);
      if (hitIndex < 0) continue;

      const result = processBulletHit(b, hitIndex);
      if (result === "remove") {
        removeBullet = true;
        break;
      }
    }

    if (removeBullet) bullets.splice(i, 1);
  }
}

function damageZombie(zombie, index, hitInfo, bulletDamage) {
  const baseDamage = Math.max(
    1,
    Math.round((bulletDamage ?? player.damage) * getRunDamageMult())
  );
  const isCrit = rollCritHit();
  const damage = isCrit ? Math.max(1, Math.round(baseDamage * 1.8)) : baseDamage;
  const hpBefore = zombie.hp;
  const isBoss = zombie.tier === "waveBoss" || zombie.isWaveBoss || zombie.tier === "boss";
  const isElite = isBoss || zombie.tier === "medium" || zombie.tier === "tank";
  zombie.hp -= damage;

  const cx = zombie.x + zombie.size / 2;
  const cy = zombie.y + zombie.size / 2;
  const isKill = zombie.hp <= 0;
  const isHeavy = !isCrit && damage >= Math.round(getEffectivePlayerDamage() * 0.85);

  spawnDamageNumber(cx, cy - zombie.size * 0.15, damage, {
    isCrit,
    isKill,
    isBoss,
    heavy: isHeavy
  });

  if (isCrit && typeof playCritSound === "function") {
    playCritSound();
  } else if (typeof playHitSound === "function") {
    playHitSound(isElite ? "elite" : isHeavy ? "heavy" : "normal");
  }

  if (!isKill && Math.random() < 0.035 && typeof playZombieGroan === "function") {
    playZombieGroan(zombie);
  }

  addScreenShake(
    isKill ? 0 : isBoss ? 0.55 : isCrit ? 0.22 : 0.12
  );

  if (!isKill) {
    spawnBloodHit(zombie, hitInfo, { isCrit, isHeavy });
  }

  if (zombie.isWaveBoss || zombie.tier === "waveBoss") {
    updateWaveBossPhases(zombie);
  }

  if (zombie.hp <= 0) {
    if (zombie.archetype === "exploder") {
      triggerExploderDeath(zombie);
    }

    const wasElite =
      zombie.tier !== "normal" ||
      zombie.isWaveBoss ||
      zombie.archetype === "exploder" ||
      zombie.archetype === "spitter";

    spawnBloodBurst(zombie, hitInfo);
    if (typeof spawnKillJuice === "function") {
      spawnKillJuice(zombie, { isCrit, isBoss, isElite: wasElite });
    } else {
      if (wasElite) triggerHitStop(zombie.isWaveBoss ? 4 : 2);
      if (zombie.isWaveBoss || zombie.tier === "waveBoss") addScreenShake(6);
    }
    playZombieDeathSound(zombie);
    zombies.splice(index, 1);
    onZombieKilled(zombie);
  }
}

function pushBullet(x, y, dx, dy, speed, options = {}) {
  const color = options.color || "#ffe566";
  const beamLen = Math.min(72, 28 + speed * 1.8);

  muzzleTracers.push({
    x1: x,
    y1: y,
    x2: x + dx * beamLen,
    y2: y + dy * beamLen,
    color,
    life: 8,
    maxLife: 8
  });

  bullets.push({
    x,
    y,
    prevX: x,
    prevY: y,
    dx,
    dy,
    speed,
    angle: Math.atan2(dy, dx),
    damage: options.damage,
    color,
    pierceLeft: getRunPierceCount()
  });
}

function colorWithAlpha(hex, alpha) {
  const raw = String(hex || "#ffe566").replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pushBulletAfterglow(x1, y1, x2, y2, color) {
  bulletAfterglows.push({
    x1,
    y1,
    x2,
    y2,
    color: color || "#ffe566",
    life: 10,
    maxLife: 10
  });
  if (bulletAfterglows.length > 120) {
    bulletAfterglows.splice(0, bulletAfterglows.length - 120);
  }
}

function drawBulletPath(x1, y1, x2, y2, color, options = {}) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  if (dist < 1) return;

  const width = options.width ?? 3;
  const alpha = options.alpha ?? 1;
  const dotSpacing = options.dotSpacing ?? 10;
  const drawDots = options.dots === true;

  ctx.save();
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, colorWithAlpha(color, 0.05 * alpha));
  grad.addColorStop(0.45, colorWithAlpha(color, 0.42 * alpha));
  grad.addColorStop(1, colorWithAlpha(color, 0.88 * alpha));

  ctx.strokeStyle = grad;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.shadowBlur = 8;
  ctx.shadowColor = colorWithAlpha(color, 0.45 * alpha);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(255,255,255,${0.55 * alpha})`;
  ctx.lineWidth = Math.max(1, width * 0.35);
  ctx.stroke();

  if (drawDots) {
    const steps = Math.max(1, Math.ceil(dist / dotSpacing));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      ctx.fillStyle = colorWithAlpha(color, (0.25 + t * 0.45) * alpha);
      ctx.beginPath();
      ctx.arc(px, py, t > 0.85 ? 2.2 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function updateMuzzleTracers() {
  for (let i = muzzleTracers.length - 1; i >= 0; i--) {
    muzzleTracers[i].life -= 1;
    if (muzzleTracers[i].life <= 0) {
      muzzleTracers.splice(i, 1);
    }
  }
}

function updateBulletAfterglows() {
  for (let i = bulletAfterglows.length - 1; i >= 0; i--) {
    bulletAfterglows[i].life -= 1;
    if (bulletAfterglows[i].life <= 0) {
      bulletAfterglows.splice(i, 1);
    }
  }
}

function drawBulletAfterglows() {
  bulletAfterglows.forEach((glow) => {
    const alpha = (glow.life / glow.maxLife) * 0.45;
    drawBulletPath(glow.x1, glow.y1, glow.x2, glow.y2, glow.color, {
      width: 2.2,
      alpha
    });
  });
}

function drawMuzzleTracers() {
  muzzleTracers.forEach((tracer) => {
    const alpha = tracer.life / tracer.maxLife;
    drawBulletPath(tracer.x1, tracer.y1, tracer.x2, tracer.y2, tracer.color, {
      width: 2.8,
      alpha: alpha * 0.75
    });
  });
}

function drawBullet(b) {
  const angle = b.angle ?? Math.atan2(b.dy, b.dx);
  const speed = b.speed || 10;
  const bulletColor = b.color || "#ffe566";
  const prevX = b.prevX ?? b.x;
  const prevY = b.prevY ?? b.y;
  const bodyLen = Math.min(18, 10 + speed * 0.22);
  const bodyW = 3.4;
  const tailLen = Math.min(34, 14 + speed * 0.85);
  const tailX = b.x - Math.cos(angle) * tailLen;
  const tailY = b.y - Math.sin(angle) * tailLen;

  drawBulletPath(tailX, tailY, b.x, b.y, bulletColor, {
    width: 3.2,
    alpha: 0.9
  });

  if (Math.hypot(b.x - prevX, b.y - prevY) > 0.5) {
    drawBulletPath(prevX, prevY, b.x, b.y, bulletColor, {
      width: 2.4,
      alpha: 0.55
    });
  }

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(angle);

  ctx.fillStyle = colorWithAlpha(bulletColor, 0.95);
  ctx.beginPath();
  ctx.roundRect(-bodyLen * 0.42, -bodyW * 0.55, bodyLen * 0.72, bodyW * 1.1, bodyW * 0.35);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(bodyLen * 0.18, 0, 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function getEventForWave(w) {
  return WAVE_EVENTS[(Math.max(1, w) - 1) % WAVE_EVENTS.length];
}

function getCurrentEvent() {
  return getEventForWave(wave);
}

function applyEventPlayerSpeed() {
  const event = getCurrentEvent();
  player.speed = playerBaseSpeed * (event.speedMult || 1);
}

function syncWaveEvent(announce) {
  const event = getCurrentEvent();
  applyEventPlayerSpeed();

  if (announce || lastAnnouncedEventId !== event.id) {
    lastAnnouncedEventId = event.id;
    showMilestone(`${event.emoji} ${event.name} — ${event.msg}`);
    showCenterHudBriefly();
  }

  updateUI();
}

function formatBonusOfferTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  return `${totalSec}s`;
}

function hideBonusOffer() {
  bonusOffer = null;

  const panel = document.getElementById("bonus-offer");
  if (panel) panel.style.display = "none";
}

function showBonusOffer() {
  bonusOffer = {
    expiresAt: Date.now() + BONUS_OFFER_DURATION_MS,
    used: false
  };

  const panel = document.getElementById("bonus-offer");
  const result = document.getElementById("bonus-offer-result");
  const btn = document.getElementById("bonus-offer-btn");

  if (panel) panel.style.display = "block";
  if (result) result.textContent = "";
  if (btn) btn.disabled = false;

  updateBonusOfferUI();
}

function maybeSpawnBonusOffer() {
  if (bonusOffer || !gameRunning || paused) return;
  if (Math.random() >= getBonusOfferChance()) return;

  showBonusOffer();
}

function updateBonusOfferUI() {
  const panel = document.getElementById("bonus-offer");
  const timerEl = document.getElementById("bonus-offer-timer");
  if (!panel || !bonusOffer) return;

  const left = bonusOffer.expiresAt - Date.now();
  if (left <= 0) {
    hideBonusOffer();
    return;
  }

  if (timerEl) timerEl.textContent = formatBonusOfferTime(left);
}

function tryBonusOffer() {
  if (!bonusOffer || bonusOffer.used) return;

  bonusOffer.used = true;
  const btn = document.getElementById("bonus-offer-btn");
  const result = document.getElementById("bonus-offer-result");
  if (btn) btn.disabled = true;

  const won = Math.random() < getBonusWinChance();
  if (won) {
    player.skillPoints += BONUS_REWARD_SP;
    if (result) result.textContent = `+${BONUS_REWARD_SP} skill points!`;
    showMilestone(`🎁 +${BONUS_REWARD_SP} skill points!`);
  } else if (result) {
    result.textContent = "No reward...";
  }

  saveProgress();
  updateUI();

  setTimeout(hideBonusOffer, 2200);
}

function getPlayerHpRatio() {
  return player.hp / Math.max(1, player.maxHp);
}

function findHpPickupSpawnPoint() {
  const playerCx = player.x + PLAYER_SIZE / 2;
  const playerCy = player.y + PLAYER_SIZE / 2;

  for (let attempt = 0; attempt < 16; attempt++) {
    const x = 70 + Math.random() * (WORLD_WIDTH - 140 - HP_PICKUP_SIZE);
    const y = 70 + Math.random() * (WORLD_HEIGHT - 140 - HP_PICKUP_SIZE);
    const cx = x + HP_PICKUP_SIZE / 2;
    const cy = y + HP_PICKUP_SIZE / 2;
    const playerDist = Math.hypot(cx - playerCx, cy - playerCy);

    if (playerDist < 170 || playerDist > 720) continue;

    let blocked = false;
    for (const z of zombies) {
      const zx = z.x + z.size / 2;
      const zy = z.y + z.size / 2;
      if (Math.hypot(cx - zx, cy - zy) < z.size * 0.55 + 36) {
        blocked = true;
        break;
      }
    }

    if (!blocked) return { x, y };
  }

  return null;
}

function spawnHpPickup(amount) {
  const pos = findHpPickupSpawnPoint();
  if (!pos) return false;

  hpPickups.push({
    x: pos.x,
    y: pos.y,
    size: HP_PICKUP_SIZE,
    amount: Math.max(25, Math.round(amount)),
    life: HP_PICKUP_LIFE_FRAMES,
    maxLife: HP_PICKUP_LIFE_FRAMES,
    pulse: Math.random() * Math.PI * 2
  });

  return true;
}

function maybeSpawnHpPickups(force = false) {
  if (!gameRunning || paused || isGameOverVisible()) return;
  if (hpPickups.length >= 2) return;

  const hpRatio = getPlayerHpRatio();
  if (hpRatio > HP_PICKUP_LOW_HP_RATIO) return;
  if (hpRatio >= 0.98) return;

  const now = Date.now();
  if (!force) {
    if (now - lastHpPickupSpawnAt < HP_PICKUP_SPAWN_COOLDOWN_MS) return;
    if (Math.random() > 0.5) return;
  }

  const missingHp = player.maxHp - player.hp;
  if (missingHp <= 0) return;

  const lowBoost = hpRatio < 0.2 ? 1.35 : hpRatio < 0.28 ? 1.18 : 1;
  const amount = Math.min(missingHp, player.maxHp * HP_PICKUP_HEAL_RATIO * lowBoost);
  if (!spawnHpPickup(amount)) return;

  lastHpPickupSpawnAt = now;
  if (hpPickups.length === 1) {
    showMilestone("❤️ HP on the field — run and grab it!");
  }
}

function updateHpPickups() {
  if (paused) return;

  for (let i = hpPickups.length - 1; i >= 0; i--) {
    const pickup = hpPickups[i];
    pickup.life -= 1;
    pickup.pulse += 0.08;
    if (pickup.life <= 0) hpPickups.splice(i, 1);
  }
}

function collectHpPickup(index) {
  const pickup = hpPickups[index];
  if (!pickup) return;

  const before = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + pickup.amount);
  const gained = Math.max(0, player.hp - before);

  hpPickups.splice(index, 1);

  const cx = player.x + PLAYER_SIZE / 2;
  const cy = player.y + PLAYER_SIZE / 2;
  spawnFloatingText(cx, cy - 42, `+${formatHudNumber(gained)} HP`, "#7dffb0", 1.15);
  showMilestone(`❤️ +${formatHudNumber(gained)} HP`);
  updateUI();
}

function checkHpPickupCollisions() {
  const playerCx = player.x + PLAYER_SIZE / 2;
  const playerCy = player.y + PLAYER_SIZE / 2;
  const pickupRadius = PLAYER_SIZE * 0.34;

  for (let i = hpPickups.length - 1; i >= 0; i--) {
    const pickup = hpPickups[i];
    const cx = pickup.x + pickup.size / 2;
    const cy = pickup.y + pickup.size / 2;
    const reach = pickup.size * 0.42 + pickupRadius;

    if (Math.hypot(playerCx - cx, playerCy - cy) <= reach) {
      collectHpPickup(i);
    }
  }
}

function applyDamageToPlayer(amount) {
  const damage = Math.max(0, Math.round(Number(amount) || 0));
  if (damage <= 0) return;
  player.hp -= damage;
  hurtFlash = Math.min(1, hurtFlash + 0.28);
  addScreenShake(2.2);
}

function drawHpPickups() {
  for (const pickup of hpPickups) {
    const cx = pickup.x + pickup.size / 2;
    const cy = pickup.y + pickup.size / 2;
    const alpha = clamp(pickup.life / pickup.maxLife, 0.25, 1);
    const pulse = 1 + Math.sin(pickup.pulse) * 0.08;
    const radius = pickup.size * 0.34 * pulse;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + pickup.size * 0.12, radius * 0.9, radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(125, 255, 176, 0.75)";
    ctx.strokeStyle = "rgba(125, 255, 176, 0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(10, 36, 18, 0.82)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = `bold ${Math.round(22 * pulse)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#9dffc8";
    ctx.fillText("❤️", cx, cy - 1);

    ctx.font = "600 10px Poppins, sans-serif";
    ctx.fillStyle = "#d7ffe8";
    ctx.fillText("+HP", cx, cy + radius * 0.58);

    ctx.restore();
  }

  ctx.globalAlpha = 1;
}

function getWaveDifficultyMultiplier() {
  if (wave <= 10) {
    return 0.7 + (wave - 1) * 0.003;
  }
  return 0.88 + (wave - 11) * 0.012;
}

function getWaveDifficultyEase() {
  if (wave <= 10) return 0.5;
  if (wave <= 25) return 0.65;
  return 0.82 + (wave - 26) * 0.015;
}



const CENTER_HUD_DURATION_MS = 3000;
let centerHudTimer = null;

function showCenterHudBriefly() {
  const hud = document.getElementById("center-hud");
  if (!hud || !gameRunning) return;

  const centerWave = document.getElementById("center-wave");
  const centerEventEmoji = document.getElementById("center-event-emoji");
  const centerEventName = document.getElementById("center-event-name");
  const event = getCurrentEvent();
  if (centerWave) centerWave.innerText = isFreeplayMode() ? "∞" : wave;
  if (centerEventEmoji) centerEventEmoji.innerText = isFreeplayMode() ? "♾️" : event.emoji;
  if (centerEventName) {
    centerEventName.innerText = isFreeplayMode()
      ? `${getFreeplayPhaseDef().emoji} ${getFreeplayPhaseDef().label}`
      : event.name;
  }

  hud.classList.add("visible");
  clearTimeout(centerHudTimer);
  centerHudTimer = setTimeout(() => {
    hud.classList.remove("visible");
    centerHudTimer = null;
  }, CENTER_HUD_DURATION_MS);
}

function hideCenterHud() {
  clearTimeout(centerHudTimer);
  centerHudTimer = null;
  const hud = document.getElementById("center-hud");
  if (hud) hud.classList.remove("visible");
}

function showMilestone(message) {

  const el = document.getElementById("milestone-toast");

  if (!el) return;

  el.textContent = message;

  el.classList.add("visible");

  clearTimeout(showMilestone._timer);

  showMilestone._timer = setTimeout(() => {

    el.classList.remove("visible");

  }, 3200);

}



function getDifficultyBoost() {
  const ease = getWaveDifficultyEase();
  const threat = getPlayerThreatMultiplier();
  return Math.min(1.85, Math.max(0, threat - 0.92) * 0.16) * ease;
}

function getDifficultyPhase() {
  if (wave <= 10) return "easy";
  if (wave <= 25) return "medium";
  return "hard";
}

function getWaveProgressMultiplier() {
  const w = wave;
  const ease = getWaveDifficultyEase();
  let mult;
  if (w <= 10) mult = 0.28 + w * 0.04;
  else if (w <= 25) mult = 0.68 + ((w - 10) / 15) * 0.35;
  else mult = 1.03 + (w - 25) * 0.015;
  return mult * ease;
}

function getWaveSpeedBonus() {
  const w = wave;
  const ease = getWaveDifficultyEase();
  let bonus;
  if (w <= 10) bonus = (w - 1) * 0.034;
  else if (w <= 25) bonus = 0.31 + (w - 10) * 0.038;
  else bonus = 0.88 + (w - 25) * 0.044;
  return bonus * ease;
}

function tuneZombieSpeed(speed) {
  return speed * ZOMBIE_SPEED_TUNE;
}

function getMaxZombiesForWave() {
  if (wave <= 10) return 12 + wave * 2;
  if (wave <= 25) return 32 + Math.floor((wave - 10) * 1.5);
  return 50 + Math.floor((wave - 25) * 2);
}

function getWaveZombieCount() {
  const boost = getDifficultyBoost();
  const difficultyMultiplier = getUpgradeDifficultyMultiplier();
  const profile = getPlayerPowerProfile();

  let count = Math.round(
    (10 + (wave - 1) * 1.28) *
      (0.96 + boost * 0.14) *
      (0.94 + (difficultyMultiplier - 1) * 0.08) *
      (0.98 + Math.min(0.12, Math.log10(Math.max(10, profile.rating)) * 0.05))
  );

  if (wave <= 5) {
    count = clamp(count, 10, 16);
  } else if (wave <= 15) {
    count = clamp(count, 12, 28);
  } else if (wave <= 30) {
    count = clamp(count, 16, 42);
  } else {
    count = clamp(count, 20, getMaxZombiesForWave());
  }

  return count;
}

function getWaveScale() {
  const boost = getDifficultyBoost();
  const waveMult = getWaveDifficultyMultiplier();
  const ease = getWaveDifficultyEase();
  const w = wave;
  let waveComponent;

  if (w <= 10) {
    waveComponent = (w - 1) * 0.035;
  } else if (w <= 25) {
    waveComponent = 9 * 0.035 + (w - 10) * 0.055;
  } else {
    waveComponent = 9 * 0.035 + 15 * 0.055 + (w - 25) * 0.08;
  }

  return (1 + waveComponent + boost * 0.35) * waveMult * (0.75 + ease * 0.35);
}

function getTotalShopUpgrades() {
  return getTotalPowerUpgrades();
}

function getEliteRollThresholds() {
  const profile = getPlayerPowerProfile();
  const elitePresence = clamp(
    Math.pow(Math.max(profile.upgrades, 1) / 28, 0.48) * (0.52 + Math.log10(Math.max(10, profile.rating)) * 0.08),
    0,
    0.82
  );

  let base;
  if (wave <= 10) base = { boss: 0.02, medium: 0.15, tank: 0.42 };
  else if (wave <= 25) base = { boss: 0.04, medium: 0.22, tank: 0.48 };
  else if (wave <= 40) base = { boss: 0.07, medium: 0.28, tank: 0.52 };
  else base = { boss: 0.11, medium: 0.35, tank: 0.58 };

  return {
    boss: base.boss * elitePresence,
    medium: base.medium * elitePresence,
    tank: base.tank * elitePresence
  };
}

function getUpgradePowerProgress() {
  const total = getTotalShopUpgrades();
  return clamp(Math.pow(total / 58, 0.68), 0, 1);
}

function getTargetTtkForTier(tier, strength = "strong") {
  const progress = getUpgradePowerProgress();
  const tierMult = {
    normal: 1,
    tank: 1.85,
    medium: 2.85,
    boss: 6.4
  };
  const strengthMult = strength === "weak" ? 0.92 : 1;
  const mult = (tierMult[tier] || 1) * strengthMult;

  const wavePressure = clamp((wave - 1) * 0.045, 0, 2.4);
  const baseline = 1.15 + wave * 0.058 + wavePressure * 0.34;
  const upgradedFloor = PROGRESSION_UPGRADED_NORMAL_TTK + Math.min(1.1, wave * 0.012);
  const ttk = (baseline * (1 - progress * 0.76) + upgradedFloor * progress) * mult;
  return Math.max(0.95, ttk);
}

function getTargetHitsForTier(tier) {
  return getTargetTtkForTier(tier, "strong");
}

function getZombieHpForTier(tier, waveScale, strength = "strong") {
  const total = getTotalPowerUpgrades();
  const playerDamage = getEffectivePlayerDamage();
  const ttk = getTargetTtkForTier(tier, strength);
  let hp = Math.max(1, Math.round(playerDamage * ttk));

  if (total <= 3 && strength === "strong") {
    hp = Math.max(1, Math.round(hp * (0.32 + total * 0.18)));
  } else if (wave <= 4 && strength === "weak") {
    hp = Math.max(1, Math.round(hp * 0.86));
  }

  return hp;
}

function getBombKillTier(zombie) {
  if (zombie?.isWaveBoss || zombie?.tier === "waveBoss") return "waveBoss";
  if (zombie?.tier === "boss") return "boss";
  if (zombie?.tier === "medium") return "medium";
  if (zombie?.tier === "tank") return "tank";
  return "normal";
}

function isWaveBossZombie(zombie) {
  return Boolean(zombie?.isWaveBoss || zombie?.tier === "waveBoss");
}

function initWaveBossAbilityTracking(zombie) {
  if (!isWaveBossZombie(zombie)) return;
  const maxHp = Math.max(1, zombie.maxHp || zombie.hp || 1);
  zombie.abilityDamageTaken = 0;
  zombie.abilityDamageCap = Math.max(1, Math.round(maxHp * WAVE_BOSS_ABILITY_DAMAGE_CAP));
}

function capAbilityDamageForWaveBoss(zombie, proposedDamage) {
  if (!isWaveBossZombie(zombie)) return proposedDamage;
  const cap = zombie.abilityDamageCap ?? Math.round((zombie.maxHp || zombie.hp || 1) * WAVE_BOSS_ABILITY_DAMAGE_CAP);
  const taken = zombie.abilityDamageTaken || 0;
  const remaining = Math.max(0, cap - taken);
  const applied = Math.min(Math.max(0, proposedDamage), remaining);
  zombie.abilityDamageTaken = taken + applied;
  return applied;
}

function getBombDamageForZombie(zombie, falloff) {
  const mult = getRunDamageMult();
  const base = Math.round(getEffectivePlayerDamage() * BOMB_DAMAGE_MULT * mult * falloff);
  const progress = getUpgradePowerProgress();
  const tier = getBombKillTier(zombie);
  const maxHp = Math.max(1, zombie.maxHp || zombie.hp || 1);

  const hpPortion = {
    normal: 1.02,
    tank: 0.78,
    medium: 0.72,
    boss: 0.38,
    waveBoss: 0.12
  };
  const antiUpgradeBoost = tier === "waveBoss" ? 1 + progress * 0.06 : 1 + progress * 0.22;
  let hpDamage = Math.ceil(maxHp * (hpPortion[tier] || 0.95) * falloff * antiUpgradeBoost);
  let damage = Math.max(1, Math.max(base, hpDamage));
  return capAbilityDamageForWaveBoss(zombie, damage);
}

function getMolotovTickDamageForZombie(zombie, falloff) {
  const mult = getRunDamageMult();
  const progress = getUpgradePowerProgress();
  const tier = getBombKillTier(zombie);
  const maxHp = Math.max(1, zombie.maxHp || zombie.hp || 1);

  const hpPortionPerTick = {
    normal: 0.058,
    tank: 0.042,
    medium: 0.038,
    boss: 0.016,
    waveBoss: 0.0042
  };
  const antiUpgradeBoost = tier === "waveBoss" ? 1 + progress * 0.05 : 1 + progress * 0.2;
  const base = Math.round(getEffectivePlayerDamage() * 1.15 * mult * falloff);
  let hpDamage = Math.ceil(maxHp * (hpPortionPerTick[tier] || 0.05) * falloff * antiUpgradeBoost);
  let damage = Math.max(1, Math.max(base, hpDamage));
  return capAbilityDamageForWaveBoss(zombie, damage);
}

function getStrongZombieRatio() {
  const profile = getPlayerPowerProfile();
  let ratio =
    0.16 +
    wave * 0.0038 -
    Math.log10(Math.max(profile.upgrades, 1) + 1) * 0.038 -
    Math.log10(Math.max(10, profile.damage)) * 0.012;

  if (wave <= 5) ratio *= 0.55;
  return clamp(ratio, PROGRESSION_MIN_STRONG_RATIO, PROGRESSION_MAX_STRONG_RATIO);
}

function getStrongZombieCount(waveCount) {
  const maxStrong = Math.max(1, Math.floor(waveCount * PROGRESSION_MAX_STRONG_RATIO));
  let count = Math.round(waveCount * getStrongZombieRatio());

  if (wave <= 3) return 0;
  if (wave <= 8) return clamp(count, 1, Math.min(maxStrong, 2));
  return clamp(count, 1, maxStrong);
}

function getTierPriority(tier) {
  if (tier === "waveBoss") return 5;
  if (tier === "boss") return 4;
  if (tier === "medium") return 3;
  if (tier === "tank") return 2;
  return 1;
}

function pickStrongZombieIndices(specs) {
  const strongCount = getStrongZombieCount(specs.length);
  const ranked = specs
    .map((spec, index) => ({ index, priority: getTierPriority(spec.tier) }))
    .sort((a, b) => b.priority - a.priority || Math.random() - 0.5);

  return new Set(ranked.slice(0, strongCount).map((entry) => entry.index));
}

function getUpgradeDifficultyMultiplier() {
  return getPlayerThreatMultiplier();
}



function getDifficultyTier() {

  const phase = getDifficultyPhase();

  if (phase === "easy") return "Easy";

  if (phase === "medium") return "Medium";

  return "Hard";

}



function screenToWorld(screenX, screenY) {

  return { x: screenX + camera.x, y: screenY + camera.y };

}

function clientToView(clientX, clientY) {
  if (!c) return { x: 0, y: 0 };

  const rect = c.getBoundingClientRect();
  const scaleX = rect.width > 0 ? VIEW_WIDTH / rect.width : 1;
  const scaleY = rect.height > 0 ? VIEW_HEIGHT / rect.height : 1;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}



function updateCamera() {

  camera.x = clamp(

    player.x + PLAYER_SIZE / 2 - VIEW_WIDTH / 2,

    0,

    Math.max(0, WORLD_WIDTH - VIEW_WIDTH)

  );

  camera.y = clamp(

    player.y + PLAYER_SIZE / 2 - VIEW_HEIGHT / 2,

    0,

    Math.max(0, WORLD_HEIGHT - VIEW_HEIGHT)

  );

}



function onWaveCleared(clearedWave) {
  if (clearedWave > runBestWave) {
    runBestWave = clearedWave;
  }
  if (clearedWave > bestWave) {
    bestWave = clearedWave;
  }

  const clearedEvent = getEventForWave(clearedWave);
  if (clearedEvent.skillOnClear) {
    player.skillPoints += clearedEvent.skillOnClear;
    showMilestone(`💰 +${clearedEvent.skillOnClear} skill points!`);
  }

  if (clearedWave > 0 && clearedWave % 3 === 0) {
    showMilestone(`Wave ${clearedWave} cleared!`);
  }

  maybeSpawnBonusOffer();

  if (clearedWave === 25) {
    showMilestone("Wave 25 — you reached Hard mode!");
  }

  saveProgress();
  if (typeof registerDailyWaveClear === "function") registerDailyWaveClear(clearedWave);
  checkAndUnlockAchievements();
}

function finishWaveTransition() {
  if (pendingClearedWave === null) return;

  const clearedWave = pendingClearedWave;
  pendingClearedWave = null;
  wave += 1;
  onWaveCleared(clearedWave);

  if (maybeOfferRunModifier(clearedWave)) return;

  if (!paused && gameRunning) {
    startWave();
  }
}



function checkWaveMilestonesOnStart() {
  if (isWaveBossWave()) {
    const profile = getPlayerPowerProfile();
    showMilestone(
      `👹 WAVE BOSSES x${WAVE_BOSS_COUNT}! Level ${profile.level} · ~${getWaveBossHitCount()} hits each`
    );
    return;
  }

  if (wave === 10) showMilestone("Mid game — stay sharp!");
  if (wave === 26) showMilestone("Hard mode — chaos incoming!");
}



function hasMeaningfulSaveData(data) {
  return !!(
    data &&
    typeof data === "object" &&
    (Number(data.kills || 0) > 0 ||
      Number(data.bestWave || 0) > 0 ||
      Number(data.totalXp || 0) > 0 ||
      Number(data.skillPoints || 0) > 0 ||
      (Array.isArray(data.unlockedAchievements) && data.unlockedAchievements.length > 0))
  );
}

function mergeSaveData(serverData, localData) {
  const s = serverData && typeof serverData === "object" ? serverData : null;
  const l = localData && typeof localData === "object" ? localData : {};

  if (authToken && s && hasMeaningfulSaveData(s)) {
    return {
      kills: Number(s.kills || 0),
      skillPoints: Number(s.skillPoints || 0),
      nextSkillPointKill: Number(s.nextSkillPointKill || SKILL_POINT_KILL_INTERVAL),
      bestWave: Number(s.bestWave || 0),
      totalXp: Number(s.totalXp || 0),
      upgrades: {
        hp: Number(s.upgrades?.hp || 0),
        damage: Number(s.upgrades?.damage || 0),
        bulletSpeed: Number(s.upgrades?.bulletSpeed || 0)
      },
      hp: s.hp,
      unlockedAchievements: Array.isArray(s.unlockedAchievements) ? s.unlockedAchievements : [],
      monthlyProgress: s.monthlyProgress || { monthKey: "", kills: 0 },
      completedMonthlyAchievements: Array.isArray(s.completedMonthlyAchievements)
        ? s.completedMonthlyAchievements
        : [],
      unlockedWeapons: Array.isArray(s.unlockedWeapons) ? s.unlockedWeapons : ["pistol"],
      equippedWeaponId: s.equippedWeaponId || "pistol",
      weaponLevels: s.weaponLevels || { pistol: 0, smg: 0, shotgun: 0, rifle: 0 }
    };
  }

  const hasServerSave =
    s &&
    (Number(s.kills || 0) > 0 ||
      Number(s.bestWave || 0) > 0 ||
      Number(s.totalXp || 0) > 0 ||
      Number(s.skillPoints || 0) > 0 ||
      (Array.isArray(s.unlockedAchievements) && s.unlockedAchievements.length > 0));

  if (hasServerSave) {
    return {
      kills: Number(s.kills || 0),
      skillPoints: Number(s.skillPoints || 0),
      nextSkillPointKill: Number(s.nextSkillPointKill || SKILL_POINT_KILL_INTERVAL),
      bestWave: Number(s.bestWave || 0),
      totalXp: Number(s.totalXp || 0),
      upgrades: {
        hp: Number(s.upgrades?.hp || 0),
        damage: Number(s.upgrades?.damage || 0),
        bulletSpeed: Number(s.upgrades?.bulletSpeed || 0)
      },
      hp: s.hp,
      unlockedAchievements: [
        ...new Set([
          ...(Array.isArray(s.unlockedAchievements) ? s.unlockedAchievements : []),
          ...(Array.isArray(l.unlockedAchievements) ? l.unlockedAchievements : [])
        ])
      ],
      monthlyProgress: mergeMonthlyProgressObjects(s, l),
      completedMonthlyAchievements: [
        ...new Set([
          ...(Array.isArray(s.completedMonthlyAchievements) ? s.completedMonthlyAchievements : []),
          ...(Array.isArray(l.completedMonthlyAchievements) ? l.completedMonthlyAchievements : [])
        ])
      ],
      unlockedWeapons: mergeUnlockedWeapons(s, l),
      equippedWeaponId: mergeEquippedWeaponId(s, l),
      weaponLevels: mergeWeaponLevels(s, {})
    };
  }

  const bestWave = Math.max(Number(s?.bestWave || 0), Number(l.bestWave || 0));

  return {
    kills: Math.max(Number(s?.kills || 0), Number(l.kills || 0)),
    skillPoints: Math.max(Number(s?.skillPoints || 0), Number(l.skillPoints || 0)),
    nextSkillPointKill: Math.max(
      Number(s?.nextSkillPointKill || SKILL_POINT_KILL_INTERVAL),
      Number(l.nextSkillPointKill || SKILL_POINT_KILL_INTERVAL)
    ),
    bestWave,
    totalXp: Math.max(Number(s?.totalXp || 0), Number(l.totalXp || 0)),
    upgrades: {
      hp: Math.max(Number(s?.upgrades?.hp || 0), Number(l.upgrades?.hp || 0)),
      damage: Math.max(
        Number(s?.upgrades?.damage || 0),
        Number(l.upgrades?.damage || 0)
      ),
      bulletSpeed: Math.max(
        Number(s?.upgrades?.bulletSpeed || 0),
        Number(l.upgrades?.bulletSpeed || 0)
      )
    },
    hp: s?.hp !== undefined && s?.hp !== null ? Number(s.hp) : l.hp,
    unlockedAchievements: [
      ...new Set([
        ...(Array.isArray(s?.unlockedAchievements) ? s.unlockedAchievements : []),
        ...(Array.isArray(l.unlockedAchievements) ? l.unlockedAchievements : []),
        ...(Array.isArray(s?.claimedGoals) ? s.claimedGoals : []),
        ...(Array.isArray(l.claimedGoals) ? l.claimedGoals : [])
      ])
    ],
    monthlyProgress: mergeMonthlyProgressObjects(s || {}, l),
    completedMonthlyAchievements: [
      ...new Set([
        ...(Array.isArray(s?.completedMonthlyAchievements) ? s.completedMonthlyAchievements : []),
        ...(Array.isArray(l.completedMonthlyAchievements) ? l.completedMonthlyAchievements : [])
      ])
    ],
    unlockedWeapons: mergeUnlockedWeapons(s || {}, l),
    equippedWeaponId: mergeEquippedWeaponId(s || {}, l),
    weaponLevels: mergeWeaponLevels(s || {}, l)
  };
}

function mergeUnlockedWeapons(serverData, localData) {
  return [
    ...new Set([
      "pistol",
      ...(Array.isArray(serverData.unlockedWeapons) ? serverData.unlockedWeapons : []),
      ...(Array.isArray(localData.unlockedWeapons) ? localData.unlockedWeapons : [])
    ])
  ];
}

function mergeEquippedWeaponId(serverData, localData) {
  const unlocked = new Set(mergeUnlockedWeapons(serverData, localData));
  const preferred = localData.equippedWeaponId || serverData.equippedWeaponId || "pistol";
  return unlocked.has(preferred) ? preferred : "pistol";
}

function mergeWeaponLevels(serverData, localData) {
  const s = serverData && typeof serverData === "object" ? serverData : {};
  const l = localData && typeof localData === "object" ? localData : {};
  const result = { pistol: 0, smg: 0, shotgun: 0, rifle: 0 };

  for (const weapon of WEAPONS) {
    result[weapon.id] = Math.max(
      Number(s.weaponLevels?.[weapon.id] || 0),
      Number(l.weaponLevels?.[weapon.id] || 0)
    );
  }

  const legacyDamage = Math.max(
    Number(s.upgrades?.damage || 0),
    Number(l.upgrades?.damage || 0)
  );
  if (legacyDamage > 0) {
    result.pistol = Math.max(result.pistol, legacyDamage);
  }

  return result;
}

function applyWeaponProgressFromSave(data) {
  const payload = data && typeof data === "object" ? data : {};
  unlockedWeapons = new Set(
    Array.isArray(payload.unlockedWeapons) ? payload.unlockedWeapons : ["pistol"]
  );
  unlockedWeapons.add("pistol");

  weaponLevels = mergeWeaponLevels(payload, payload);

  const preferred = payload.equippedWeaponId || "pistol";
  equippedWeaponId = unlockedWeapons.has(preferred) ? preferred : "pistol";
  syncPlayerDamageFromWeapon();
}

async function loadSave() {
  let serverData = null;
  let localData = null;

  if (playerName && authToken) {
    try {
      const response = await authFetch("/save");
      if (response.ok) {
        serverData = await response.json();
      } else if (response.status === 401) {
        handleSessionExpired();
        return { ok: false, sessionExpired: true };
      }
    } catch (error) {
      console.warn("Failed to load server save", error);
    }
  }

  try {
    localData = JSON.parse(localStorage.getItem(getSaveKey()) || "null");
  } catch (error) {
    console.warn("Failed to load local save", error);
  }

  const data = mergeSaveData(serverData, localData);
  applyMonthlyProgressFromSave(data);
  applyWeaponProgressFromSave(data);

  const isFreshSave =
    Number(data.kills || 0) === 0 &&
    Number(data.bestWave || 0) === 0 &&
    Number(data.totalXp || 0) === 0 &&
    Number(data.skillPoints || 0) === 0 &&
    Number(data.upgrades?.hp || 0) === 0 &&
    Number(data.upgrades?.bulletSpeed || 0) === 0 &&
    !hasMeaningfulSaveData(localData);

  if (isFreshSave) {
    resetSessionState();
    applyMonthlyProgressFromSave(data);
    applyWeaponProgressFromSave(data);
    checkAndUnlockMonthlyAchievement();
    localStorage.setItem(getSaveKey(), JSON.stringify(data));
    saveHydrated = true;
    return;
  }

  if (
    data &&
    typeof data === "object" &&
    (data.kills > 0 || data.bestWave > 0 || data.totalXp > 0 || data.skillPoints > 0)
  ) {

    player.kills = Number(data.kills || 0);
    player.totalXp = Math.max(
      Number(data.totalXp || 0),
      Number(data.kills || 0) * 3
    );

    player.skillPoints = Number(data.skillPoints || 0);

    player.nextSkillPointKill = Number(data.nextSkillPointKill || SKILL_POINT_KILL_INTERVAL);

    player.upgrades = Object.assign({}, player.upgrades, data.upgrades || {});

    player.maxHp = 500 + 50 * Number(player.upgrades.hp || 0);
    player.bulletSpeed = 10 + Number(player.upgrades.bulletSpeed || 0);
    playerBaseSpeed = 4;
    player.speed = 4;
    syncPlayerDamageFromWeapon();

    player.score = player.kills * 10;

    player.hp =

      data.hp !== undefined && data.hp !== null

        ? Number(data.hp)

        : player.maxHp;

    if (player.hp > player.maxHp) {

      player.hp = player.maxHp;

    }



    bestWave = Number(data.bestWave || 0);
    unlockedAchievements = new Set(
      Array.isArray(data.unlockedAchievements) ? data.unlockedAchievements : []
    );
    checkAndUnlockAchievements();
  }

  checkAndUnlockMonthlyAchievement();
  saveHydrated = true;
}



function saveProgress(options = {}) {
  const data = {

    kills: player.kills,

    totalXp: player.totalXp,

    score: player.score,

    hp: player.hp,

    skillPoints: player.skillPoints,

    nextSkillPointKill: player.nextSkillPointKill,

    upgrades: player.upgrades,

    bestWave,

    unlockedAchievements: [...unlockedAchievements],

    monthlyProgress,

    completedMonthlyAchievements: [...completedMonthlyKeys],

    unlockedWeapons: [...unlockedWeapons],

    equippedWeaponId,

    weaponLevels: { ...weaponLevels }

  };

  localStorage.setItem(getSaveKey(), JSON.stringify(data));

  if (!playerName || !authToken) return;
  if (!saveHydrated && options.forceServer !== true) return;

  queueServerSave(options);
}

const SERVER_SAVE_INTERVAL_MS = 3000;
let serverSaveTimer = null;
let serverSaveQueued = false;
let serverSaveLastAt = 0;

function queueServerSave(options = {}) {
  const forceServer = options.forceServer === true;
  const quiet = options.quiet !== false;

  if (forceServer) {
    clearTimeout(serverSaveTimer);
    serverSaveTimer = null;
    serverSaveQueued = false;
    serverSaveLastAt = Date.now();
    syncSaveToServer({ quiet });
    return;
  }

  serverSaveQueued = true;
  clearTimeout(serverSaveTimer);
  const elapsed = Date.now() - serverSaveLastAt;
  const delay = Math.max(250, SERVER_SAVE_INTERVAL_MS - elapsed);

  serverSaveTimer = setTimeout(() => {
    if (!serverSaveQueued) return;
    serverSaveQueued = false;
    serverSaveLastAt = Date.now();
    syncSaveToServer({ quiet: true });
  }, delay);
}

function syncSaveToServer({ quiet = true } = {}) {
  if (!playerName || !authToken) return Promise.resolve(false);

  let payload;
  try {
    payload = JSON.parse(localStorage.getItem(getSaveKey()) || "{}");
  } catch (error) {
    payload = {};
  }

  return authFetch("/save", {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then(async (response) => {
      if (response.status === 401) {
        try {
          const me = await authFetch("/api/me");
          if (!me.ok) handleSessionExpired();
        } catch (error) {
          handleSessionExpired();
        }
        return false;
      }
      if (response.status === 403 || response.status === 429) {
        if (!quiet) {
          const body = await response.json().catch(() => ({}));
          showMilestone(body.error || "Save rejected — invalid progression");
        }
        return false;
      }
      scheduleLeaderboardRefresh();
      return true;
    })
    .catch(() => false);
}



function zombieTouchesPlayer(z) {
  return (
    player.x < z.x + z.size &&
    player.x + PLAYER_SIZE > z.x &&
    player.y < z.y + z.size &&
    player.y + PLAYER_SIZE > z.y
  );
}



function countZombiesTouchingPlayer() {
  let count = 0;
  for (const z of zombies) {
    if (zombieTouchesPlayer(z)) count += 1;
  }
  return count;
}

function getZombiePlayerDamage(z) {
  const profile = getPlayerPowerProfile();
  const phase = getDifficultyPhase();
  const phaseMult = phase === "easy" ? 0.9 : phase === "medium" ? 1.05 : 1.25;
  const waveMult = 1 + Math.max(0, wave - 1) * 0.018;
  const eventMult = getCurrentEvent().damageMult || 1;
  const tierMult =
    z.tier === "waveBoss" || z.isWaveBoss
      ? 2.35
      : z.tier === "boss"
        ? 1.85
        : z.tier === "tank"
          ? 1.3
          : z.tier === "medium"
            ? 1.12
            : 1;
  const archetypeMult =
    z.archetype === "exploder" ? 1.12 : z.archetype === "spitter" ? 0.92 : z.archetype === "runner" ? 0.88 : 1;
  const percentByTier =
    z.tier === "waveBoss" || z.isWaveBoss
      ? 0.0022
      : z.tier === "boss"
        ? 0.0018
        : z.tier === "tank"
          ? 0.0011
          : z.tier === "medium"
            ? 0.00082
            : 0.0005;

  const base = (z.damage || 7) * tierMult * phaseMult * waveMult * eventMult;
  const scaled = base * Math.pow(profile.powerMult, 0.82);
  const threatScale = 0.82 + Math.min(0.95, profile.powerMult * 0.055);
  const percentFloor = player.maxHp * percentByTier * threatScale;
  const raw = Math.max(scaled, percentFloor) * archetypeMult;

  return Math.max(2, Math.round(raw * ZOMBIE_DAMAGE_TUNE));
}

function applyZombieSwarmDamage(contactCount) {
  if (contactCount <= 0 || player.hurtCooldown > 0) return false;

  let totalDamage = 0;
  let hitCount = 0;

  for (let i = 0; i < zombies.length; i++) {
    const z = zombies[i];
    if (!zombieTouchesPlayer(z) || z.hitCooldown > 0) continue;

    let damage = getZombiePlayerDamage(z);
    if (hitCount >= ZOMBIE_FULL_DAMAGE_CONTACTS) {
      damage *= ZOMBIE_EXTRA_CONTACT_DAMAGE_FACTOR;
    }

    totalDamage += damage;
    z.hitCooldown = 24;
    hitCount += 1;
  }

  if (hitCount <= 0) return false;

  const effectiveContacts = Math.min(contactCount, 8);
  const swarmMult = 1 + (effectiveContacts - 1) * ZOMBIE_SWARM_EXTRA_PER_CONTACT;
  totalDamage = Math.max(1, Math.round(totalDamage * swarmMult));

  const maxTickDamage = Math.max(
    40,
    Math.round(player.maxHp * ZOMBIE_MAX_DAMAGE_PER_TICK_RATIO)
  );
  totalDamage = Math.min(totalDamage, maxTickDamage);

  applyDamageToPlayer(totalDamage);
  player.hurtCooldown = Math.max(6, 16 - Math.min(8, contactCount));

  if (player.hp <= 0) {
    player.hp = 0;
    if (wave > runBestWave) runBestWave = wave;
    gameOver();
    return true;
  }

  if (getPlayerHpRatio() <= HP_PICKUP_LOW_HP_RATIO) {
    maybeSpawnHpPickups(true);
  }

  return true;
}



function isWaveBossWave(waveNumber = wave) {
  return waveNumber > 0 && waveNumber % WAVE_BOSS_INTERVAL === 0;
}

function getPlayerPowerProfile() {
  const level = getXpProgress(player.totalXp).level;
  const upgrades = getTotalPowerUpgrades();
  const weaponLevels = getTotalWeaponLevels();
  const damage = getEffectivePlayerDamage();
  const maxHp = player.maxHp;
  const hpUpgrades = Number(player.upgrades.hp || 0);

  const offenseScore =
    Math.log10(Math.max(10, damage)) * 14 + Math.log10(Math.max(1, weaponLevels + 1)) * 6;
  const defenseScore =
    Math.log10(Math.max(1, maxHp / 500)) * 12 + Math.log10(Math.max(1, hpUpgrades + 1)) * 5;
  const progressScore = level * 0.85 + Math.log10(Math.max(1, upgrades + 1)) * 4;
  const rating = offenseScore + defenseScore + progressScore;
  const powerMult = clamp(0.75 + rating * 0.055, 0.75, 22);

  return {
    level,
    upgrades,
    weaponLevels,
    damage,
    maxHp,
    hpUpgrades,
    offenseScore,
    defenseScore,
    progressScore,
    rating,
    powerMult
  };
}

function getPlayerThreatMultiplier() {
  const profile = getPlayerPowerProfile();
  const ease = getWaveDifficultyEase();
  const threat = 0.9 + Math.log10(Math.max(10, profile.rating)) * 0.085;
  return clamp(threat * (0.84 + ease * 0.16), 0.9, 1.42);
}

function getWaveBossHitCount() {
  const { level, upgrades } = getPlayerPowerProfile();
  const waveTier = wave / WAVE_BOSS_INTERVAL;

  let hits =
    12 +
    wave * 0.62 +
    level * 0.75 +
    Math.pow(Math.max(upgrades, 1), 0.42) * 1.05 +
    (waveTier - 1) * 4.8;
  return Math.max(10, Math.round(hits));
}

function getWaveBossSize() {
  const { level, upgrades } = getPlayerPowerProfile();
  return Math.min(
    WAVE_BOSS_MAX_SIZE,
    Math.round(WAVE_BOSS_BASE_SIZE + level * 1.4 + upgrades * 0.42)
  );
}

function getWaveBossStats() {
  const profile = getPlayerPowerProfile();
  const waveScale = getWaveScale();
  const difficultyMultiplier = getUpgradeDifficultyMultiplier();
  const hits = getWaveBossHitCount();
  const playerDamage = getEffectivePlayerDamage();

  let hp = Math.round(playerDamage * hits * (0.42 + waveScale * 0.72) * 0.34);
  hp = Math.max(
    hp,
    Math.round(
      playerDamage * (8 + profile.level * 0.58 + Math.pow(Math.max(profile.upgrades, 1), 0.45) * 0.95)
    )
  );

  const size = getWaveBossSize();
  const boost = getDifficultyBoost();
  const ease = getWaveDifficultyEase();
  const speedBonus = getWaveSpeedBonus();
  const event = getCurrentEvent();
  const zombieSpeedMult = event.zombieSpeedMult || 1;

  const waveTier = wave / WAVE_BOSS_INTERVAL;
  const speed = tuneZombieSpeed(
    (1.58 + speedBonus * 0.38 + boost * 0.08 + waveTier * 0.12) *
      (0.92 + ease * 0.12) *
      zombieSpeedMult
  );

  const damage = Math.round(
    (14 + wave * 0.92 + profile.level * 0.48 + Math.pow(Math.max(profile.upgrades, 1), 0.45) * 0.85) *
      (0.84 + (difficultyMultiplier - 1) * 0.38)
  );

  return { hp, size, speed, damage, hits };
}

function isSafeBossSpawn(x, y, size, padding = 56) {
  return (
    player.x - padding >= x + size ||
    player.x + PLAYER_SIZE + padding <= x ||
    player.y - padding >= y + size ||
    player.y + PLAYER_SIZE + padding <= y
  );
}

function getBossSpawnMinCenterDist(size) {
  return Math.max(500, (PLAYER_SIZE + size) * 0.62 + 180);
}

function getWaveBossSpeedCap(phase = 1) {
  const playerCap = (player?.speed || 4) * (typeof getRunMoveSpeedMult === "function" ? getRunMoveSpeedMult() : 1);
  const idx = clamp((phase || 1) - 1, 0, WAVE_BOSS_SPEED_CAP_VS_PLAYER.length - 1);
  return playerCap * WAVE_BOSS_SPEED_CAP_VS_PLAYER[idx];
}

function clampWaveBossSpeed(speed, phase = 1) {
  return Math.min(speed, getWaveBossSpeedCap(phase));
}

function getWaveBossChaseSpeed(speed, phase, dist, size) {
  const capped = clampWaveBossSpeed(speed, phase);
  const closeRadius = size * 0.48 + 72;
  const lingerRadius = size * 0.72 + 118;
  if (dist >= lingerRadius) return capped;
  if (dist <= closeRadius) return capped * WAVE_BOSS_CLOSE_CHASE_MULT;
  const t = (dist - closeRadius) / Math.max(1, lingerRadius - closeRadius);
  return capped * (WAVE_BOSS_CLOSE_CHASE_MULT + t * (1 - WAVE_BOSS_CLOSE_CHASE_MULT));
}

function isValidBossSpawnPoint(x, y, size, existingSpawns = [], padding = 56) {
  if (!isSafeBossSpawn(x, y, size, padding)) return false;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const minSep = size * 0.72 + 96;
  for (const spawn of existingSpawns) {
    const otherSize = spawn.size || size;
    const dist = Math.hypot(cx - (spawn.x + otherSize / 2), cy - (spawn.y + otherSize / 2));
    if (dist < minSep) return false;
  }
  return true;
}

function getBossSpawnPoint(size, existingSpawns = []) {
  const margin = 40;
  const pcx = player.x + PLAYER_SIZE / 2;
  const pcy = player.y + PLAYER_SIZE / 2;
  const minDist = getBossSpawnMinCenterDist(size);

  for (let attempt = 0; attempt < 18; attempt++) {
    const edge = Math.floor(Math.random() * 4);
    let x;
    let y;

    if (edge === 0) {
      x = Math.random() * (WORLD_WIDTH - size);
      y = margin;
    } else if (edge === 1) {
      x = WORLD_WIDTH - size - margin;
      y = Math.random() * (WORLD_HEIGHT - size);
    } else if (edge === 2) {
      x = Math.random() * (WORLD_WIDTH - size);
      y = WORLD_HEIGHT - size - margin;
    } else {
      x = margin;
      y = Math.random() * (WORLD_HEIGHT - size);
    }

    x = clamp(x, margin, WORLD_WIDTH - size - margin);
    y = clamp(y, margin, WORLD_HEIGHT - size - margin);

    const dist = Math.hypot(pcx - (x + size / 2), pcy - (y + size / 2));
    if (dist >= minDist && isValidBossSpawnPoint(x, y, size, existingSpawns)) return { x, y };
  }

  const baseAngle = Math.random() * Math.PI * 2;
  for (let i = 0; i < Math.max(3, existingSpawns.length + 3); i++) {
    const angle = baseAngle + ((Math.PI * 2) / Math.max(3, WAVE_BOSS_COUNT)) * i;
    let x = pcx - size / 2 + Math.cos(angle) * minDist;
    let y = pcy - size / 2 + Math.sin(angle) * minDist;
    x = clamp(x, margin, WORLD_WIDTH - size - margin);
    y = clamp(y, margin, WORLD_HEIGHT - size - margin);

    if (!isSafeBossSpawn(x, y, size)) {
      let dx = x + size / 2 - pcx;
      let dy = y + size / 2 - pcy;
      const d = Math.hypot(dx, dy);
      if (d < 1) {
        dx = Math.cos(angle);
        dy = Math.sin(angle);
      } else {
        dx /= d;
        dy /= d;
      }
      x = clamp(pcx - size / 2 + dx * minDist, margin, WORLD_WIDTH - size - margin);
      y = clamp(pcy - size / 2 + dy * minDist, margin, WORLD_HEIGHT - size - margin);
    }

    if (isValidBossSpawnPoint(x, y, size, existingSpawns)) return { x, y };
  }

  const angle = Math.random() * Math.PI * 2;
  let x = pcx - size / 2 + Math.cos(angle) * minDist;
  let y = pcy - size / 2 + Math.sin(angle) * minDist;
  x = clamp(x, margin, WORLD_WIDTH - size - margin);
  y = clamp(y, margin, WORLD_HEIGHT - size - margin);
  return { x, y };
}

function createWaveBossZombie(stats, spawnX, spawnY) {
  const size = stats.size;
  const playerCenterX = player.x + PLAYER_SIZE / 2;
  const playerCenterY = player.y + PLAYER_SIZE / 2;
  const toPlayerX = playerCenterX - (spawnX + size / 2);
  const toPlayerY = playerCenterY - (spawnY + size / 2);

  zombies.push({
    x: spawnX,
    y: spawnY,
    hp: stats.hp,
    maxHp: stats.hp,
    tier: "waveBoss",
    strength: "strong",
    isWaveBoss: true,
    bossPhase: 1,
    size: stats.size,
    speed: clampWaveBossSpeed(stats.speed, 1),
    damage: stats.damage,
    hitCooldown: 44,
    facingAngle: Math.atan2(toPlayerY, toPlayerX),
    jitter: 1,
    skinStyle: pickZombieSkinStyle()
  });
  initWaveBossAbilityTracking(zombies[zombies.length - 1]);
}

function spawnWaveBoss(count = WAVE_BOSS_COUNT) {
  const stats = getWaveBossStats();
  const size = stats.size;
  const placed = [];

  for (let i = 0; i < count; i++) {
    const { x: spawnX, y: spawnY } = getBossSpawnPoint(size, placed);
    placed.push({ x: spawnX, y: spawnY, size });
    createWaveBossZombie(stats, spawnX, spawnY);
  }
}

const FREEPLAY_BASE_SPAWN_INTERVAL = 78;
const FREEPLAY_SECONDS_TICK = 60;
const FREEPLAY_COMBO_TIMEOUT = 52;

const FREEPLAY_PHASE_DEFS = {
  calm: {
    label: "Calm",
    emoji: "🌙",
    msg: "Catch your breath",
    spawnMult: 0.32,
    batch: 0,
    maxMult: 0.65,
    fastChance: 0.08,
    arenaTint: "rgba(80,120,255,0.06)"
  },
  steady: {
    label: "Steady",
    emoji: "🌿",
    msg: "Keep moving",
    spawnMult: 1,
    batch: 1,
    maxMult: 1,
    fastChance: 0.18,
    arenaTint: null
  },
  surge: {
    label: "Surge!",
    emoji: "🔥",
    msg: "Horde incoming!",
    spawnMult: 2.6,
    batch: 5,
    maxMult: 1.45,
    fastChance: 0.34,
    arenaTint: "rgba(255,70,50,0.12)"
  },
  golden: {
    label: "Gold Rush",
    emoji: "✨",
    msg: "Golden targets — combo heals!",
    spawnMult: 1.35,
    batch: 2,
    maxMult: 1.05,
    fastChance: 0.1,
    goldenChance: 0.72,
    arenaTint: "rgba(255,210,80,0.1)"
  },
  boss: {
    label: "Boss!",
    emoji: "👹",
    msg: "Big boss — scaled to your power",
    spawnMult: 0.5,
    batch: 1,
    maxMult: 0.8,
    fastChance: 0.1,
    arenaTint: "rgba(180,80,255,0.14)",
    spawnBoss: true
  }
};

function getFreeplayPhaseDef() {
  return FREEPLAY_PHASE_DEFS[freeplayPhase] || FREEPLAY_PHASE_DEFS.steady;
}

function pickNextFreeplayPhase() {
  if (freeplayPhase === "surge") return "calm";
  if (freeplayPhase === "golden") return "steady";
  if (freeplayPhase === "boss") return "steady";

  const roll = Math.random();
  const sinceBoss = freeplayRunSeconds - freeplayLastBossAt;
  const bossReady =
    freeplayRunSeconds >= 45 &&
    sinceBoss >= 75 &&
    !zombies.some((z) => z.freeplayBoss);

  if (bossReady && roll < 0.16) return "boss";
  if (roll < 0.1) return "golden";
  if (roll < 0.38) return "surge";
  if (roll < 0.62) return "calm";
  return "steady";
}

function getFreeplayBossStats() {
  const profile = getPlayerPowerProfile();
  const playerDamage = getEffectivePlayerDamage();
  const hits = Math.max(10, Math.round(getWaveBossHitCount() * 0.7));
  let hp = Math.round(playerDamage * hits * 0.3);
  hp = Math.max(
    hp,
    Math.round(
      playerDamage * (7 + profile.level * 0.52 + Math.pow(Math.max(profile.upgrades, 1), 0.45) * 0.82)
    )
  );

  const size = Math.min(
    WAVE_BOSS_MAX_SIZE - 8,
    Math.round(getWaveBossSize() * 0.9)
  );
  const powerEase = clamp(0.82 + Math.log10(Math.max(10, profile.rating)) * 0.08, 0.82, 1.22);
  const speed = clamp(
    tuneZombieSpeed((1.18 + profile.level * 0.008 + freeplayRunSeconds * 0.0009) * powerEase),
    1.05,
    getWaveBossSpeedCap(1)
  );
  const damage = Math.round(
    (9 + freeplayRunSeconds * 0.048 + profile.level * 0.38 + Math.pow(Math.max(profile.upgrades, 1), 0.45) * 0.72) *
      clamp(0.86 + Math.log10(Math.max(10, profile.rating)) * 0.05, 0.86, 1.38)
  );

  return { hp, size, speed, damage, hits };
}

function spawnFreeplayBoss() {
  if (zombies.some((z) => z.freeplayBoss)) return false;

  const stats = getFreeplayBossStats();
  const playerCenterX = player.x + PLAYER_SIZE / 2;
  const playerCenterY = player.y + PLAYER_SIZE / 2;
  const { x: spawnX, y: spawnY } = getBossSpawnPoint(stats.size);
  const toPlayerX = playerCenterX - (spawnX + stats.size / 2);
  const toPlayerY = playerCenterY - (spawnY + stats.size / 2);

  zombies.push({
    x: spawnX,
    y: spawnY,
    hp: stats.hp,
    maxHp: stats.hp,
    tier: "waveBoss",
    strength: "strong",
    isWaveBoss: true,
    freeplayBoss: true,
    freeplay: true,
    bossPhase: 1,
    size: stats.size,
    speed: clampWaveBossSpeed(stats.speed, 1),
    damage: stats.damage,
    hitCooldown: 44,
    facingAngle: Math.atan2(toPlayerY, toPlayerX),
    jitter: 1,
    skinStyle: pickZombieSkinStyle()
  });
  initWaveBossAbilityTracking(zombies[zombies.length - 1]);

  freeplayLastBossAt = freeplayRunSeconds;
  showMilestone(`👹 Freeplay boss! ~${stats.hits} hits · scaled to your build`);
  if (typeof playBossRoar === "function") playBossRoar();
  addScreenShake(7);
  return true;
}

function setFreeplayPhase(phase) {
  freeplayPhase = FREEPLAY_PHASE_DEFS[phase] ? phase : "steady";
  freeplayPhaseTimer = 0;
  const def = getFreeplayPhaseDef();
  const baseDuration = {
    calm: 210,
    steady: 270,
    surge: 105,
    golden: 165,
    boss: 240
  }[freeplayPhase];
  freeplayPhaseDuration = baseDuration + Math.floor(Math.random() * 90);
  freeplayArenaTint = def.arenaTint || null;

  showMilestone(`${def.emoji} ${def.label}${def.msg ? ` — ${def.msg}` : ""}`);
  if (def.spawnBoss) {
    spawnFreeplayBoss();
  }
  if (freeplayPhase === "surge") {
    addScreenShake(5);
    for (let i = 0; i < 7; i++) spawnFreeplayZombie();
  }
}

function getFreeplayMaxZombies() {
  const def = getFreeplayPhaseDef();
  const base = 18 + Math.floor(freeplayRunSeconds / 20);
  return clamp(Math.round(base * def.maxMult), 12, 42);
}

function getFreeplaySpawnInterval() {
  const def = getFreeplayPhaseDef();
  return Math.max(22, Math.round(FREEPLAY_BASE_SPAWN_INTERVAL / Math.max(0.25, def.spawnMult)));
}

function getFreeplaySpawnPoint(size) {
  const margin = 36;
  const pcx = player.x + PLAYER_SIZE / 2;
  const pcy = player.y + PLAYER_SIZE / 2;

  for (let attempt = 0; attempt < 10; attempt++) {
    const edge = Math.floor(Math.random() * 4);
    let x;
    let y;

    if (edge === 0) {
      x = Math.random() * (WORLD_WIDTH - size);
      y = margin;
    } else if (edge === 1) {
      x = WORLD_WIDTH - size - margin;
      y = Math.random() * (WORLD_HEIGHT - size);
    } else if (edge === 2) {
      x = Math.random() * (WORLD_WIDTH - size);
      y = WORLD_HEIGHT - size - margin;
    } else {
      x = margin;
      y = Math.random() * (WORLD_HEIGHT - size);
    }

    x = clamp(x, margin, WORLD_WIDTH - size - margin);
    y = clamp(y, margin, WORLD_HEIGHT - size - margin);

    const dist = Math.hypot(pcx - (x + size / 2), pcy - (y + size / 2));
    if (dist >= 260) return { x, y };
  }

  return {
    x: Math.random() * (WORLD_WIDTH - size),
    y: Math.random() * (WORLD_HEIGHT - size)
  };
}

function spawnFreeplayZombie(options = {}) {
  const maxOnScreen = getFreeplayMaxZombies();
  if (zombies.length >= maxOnScreen) return;

  const def = getFreeplayPhaseDef();
  const fast = Math.random() < (options.fastChance ?? def.fastChance);
  const golden = Boolean(options.golden) || (def.goldenChance && Math.random() < def.goldenChance);
  const size = Math.round(ZOMBIE_DRAW_SIZE * (fast ? 0.76 : golden ? 0.9 : 0.94));
  const speed = fast
    ? 1.12 + Math.random() * 0.42
    : golden
      ? 0.48 + Math.random() * 0.18
      : 0.38 + Math.random() * 0.28;
  const playerDamage = getEffectivePlayerDamage();
  const hp = Math.max(
    1,
    Math.round(playerDamage * (fast ? 0.42 : golden ? 0.22 : 0.28) * (0.85 + Math.random() * 0.2))
  );
  const { x, y } = getFreeplaySpawnPoint(size);
  const pcx = player.x + PLAYER_SIZE / 2;
  const pcy = player.y + PLAYER_SIZE / 2;
  const toPlayerX = pcx - (x + size / 2);
  const toPlayerY = pcy - (y + size / 2);

  zombies.push({
    x,
    y,
    hp,
    maxHp: hp,
    tier: "normal",
    strength: "weak",
    archetype: fast ? "runner" : null,
    golden,
    size,
    speed,
    damage: Math.round(4 + freeplayRunSeconds * 0.04),
    hitCooldown: 0,
    facingAngle: Math.atan2(toPlayerY, toPlayerX),
    jitter: fast ? Math.random() * 0.35 + 0.75 : Math.random() * 0.25 + 0.55,
    freeplay: true,
    skinStyle: pickZombieSkinStyle()
  });
}

function spawnFreeplayBatch() {
  const def = getFreeplayPhaseDef();
  let batch = def.batch;
  if (freeplayPhase === "calm") {
    batch = Math.random() < 0.42 ? 1 : 0;
  }
  for (let i = 0; i < batch; i++) {
    spawnFreeplayZombie();
  }
}

function updateFreeplayMode() {
  if (!isFreeplayMode() || paused) return;

  freeplaySpawnTick += 1;
  if (freeplayComboTimer > 0) {
    freeplayComboTimer -= 1;
    if (freeplayComboTimer <= 0) {
      freeplayCombo = 0;
    }
  }

  if (freeplaySpawnTick % FREEPLAY_SECONDS_TICK === 0) {
    freeplayRunSeconds += 1;
  }

  freeplayPhaseTimer += 1;
  if (freeplayPhaseTimer >= freeplayPhaseDuration) {
    setFreeplayPhase(pickNextFreeplayPhase());
  }

  if (freeplaySpawnTick % getFreeplaySpawnInterval() === 0) {
    spawnFreeplayBatch();
  }
}

function startFreeplayMode() {
  wave = 1;
  waveInProgress = true;
  freeplaySpawnTick = 0;
  freeplayRunSeconds = 0;
  freeplayCombo = 0;
  freeplayComboTimer = 0;
  freeplayBestCombo = 0;
  freeplayLastBossAt = -999;
  setFreeplayPhase("steady");
  spawnFreeplayBatch();
  showCenterHudBriefly();
}

function spawnWave() {

  const waveBossActive = isWaveBossWave();
  let count = getWaveZombieCount();
  if (waveBossActive) {
    count = Math.max(3, Math.floor(count * 0.42));
  }

  const event = getCurrentEvent();
  const zombieSpeedMult = event.zombieSpeedMult || 1;

  const difficultyMultiplier = getUpgradeDifficultyMultiplier();

  const elites = getEliteRollThresholds();

  const waveScale = getWaveScale();

  const speedBonus = getWaveSpeedBonus();

  const boost = getDifficultyBoost();
  const ease = getWaveDifficultyEase();
  const specs = [];

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let tier = "normal";
    let size = ZOMBIE_DRAW_SIZE;
    const threatBlend = 0.8 + (difficultyMultiplier - 1) * 0.34;
    let speed = tuneZombieSpeed(
      (0.84 + speedBonus + boost * 0.06 + (difficultyMultiplier - 1) * 0.06) *
        (0.9 + ease * 0.22) *
        zombieSpeedMult
    );
    let damage = Math.round((6 + wave * 0.68) * threatBlend);

    if (waveBossActive && i === 0) {
      tier = "tank";
      size = 88;
      speed += tuneZombieSpeed(wave <= 25 ? 0.04 : 0.08);
      damage = Math.round(damage * 1.15);
    } else if (event.bossWave && i === 0 && !waveBossActive) {
      tier = "boss";
      size = 110;
      speed += tuneZombieSpeed(wave <= 25 ? 0.16 : 0.26);
      damage = Math.round(damage * 2.1);
    } else if (roll < elites.boss && !waveBossActive) {
      tier = "boss";
      size = 110;
      speed += tuneZombieSpeed(wave <= 25 ? 0.14 : 0.22);
      damage = Math.round(damage * 2.1);
    } else if (roll < elites.medium) {
      tier = "medium";
      size = 96;
      speed += tuneZombieSpeed(wave <= 25 ? 0.08 : 0.14);
      damage = Math.round(damage * 1.45);
    } else if (roll < elites.tank) {
      tier = "tank";
      size = 88;
      speed += tuneZombieSpeed(wave <= 25 ? 0.04 : 0.08);
      damage = Math.round(damage * 1.15);
    }

    specs.push({ tier, size, speed, damage });
  }

  const strongIndices = pickStrongZombieIndices(specs);
  assignWaveArchetypes(specs);

  specs.forEach((spec, i) => {
    const strength = strongIndices.has(i) ? "strong" : "weak";
    let hp = getZombieHpForTier(spec.tier, waveScale, strength);
    hp = applyArchetypeHpMult(spec, hp);



    const spawnX = Math.random() * (WORLD_WIDTH - spec.size);
    const spawnY = Math.random() * (WORLD_HEIGHT - spec.size);
    const toPlayerX = player.x + PLAYER_SIZE / 2 - (spawnX + spec.size / 2);
    const toPlayerY = player.y + PLAYER_SIZE / 2 - (spawnY + spec.size / 2);

    zombies.push({

      x: spawnX,

      y: spawnY,

      hp,
      maxHp: hp,
      tier: spec.tier,
      strength,
      archetype: spec.archetype || null,

      size: spec.size,

      speed: spec.speed,

      damage: spec.damage,

      hitCooldown: 0,

      facingAngle: Math.atan2(toPlayerY, toPlayerX),

      jitter: Math.random() * 0.5 + 0.5,

      skinStyle: pickZombieSkinStyle()

    });
  });

  if (waveBossActive) {
    spawnWaveBoss();
  }

  if (typeof playZombieGroan === "function" && specs.length > 0) {
    const groans = Math.min(3, 1 + Math.floor(specs.length / 10));
    for (let g = 0; g < groans; g += 1) {
      setTimeout(() => {
        if (gameRunning && !paused) {
          playZombieGroan({ tier: g === 0 && elites.boss > 0 ? "boss" : "normal" });
        }
      }, 140 + g * 210);
    }
  }

}



function startWave() {
  if (isFreeplayMode()) {
    startFreeplayMode();
    updateUI();
  } else {
    syncWaveEvent(true);
    waveInProgress = true;
    checkWaveMilestonesOnStart();
    spawnWave();
    if (typeof refreshKillStreakTimer === "function") refreshKillStreakTimer();
    updateUI();
    showCenterHudBriefly();
  }
}



function scheduleNextWave(delayMs = NEXT_WAVE_DELAY_MS) {
  if (nextWaveTimer) {
    clearTimeout(nextWaveTimer);
  }

  waveInProgress = false;
  pendingClearedWave = wave;
  nextWaveResumeDelay = null;
  nextWaveTimerEndsAt = Date.now() + delayMs;

  nextWaveTimer = setTimeout(() => {
    nextWaveTimer = null;
    nextWaveTimerEndsAt = 0;
    finishWaveTransition();
  }, delayMs);
}

function freezeNextWaveTimer() {
  if (!nextWaveTimer || nextWaveTimerEndsAt <= 0) return;

  nextWaveResumeDelay = Math.max(0, nextWaveTimerEndsAt - Date.now());
  clearTimeout(nextWaveTimer);
  nextWaveTimer = null;
  nextWaveTimerEndsAt = 0;
}

function clearNextWaveTimer() {
  if (nextWaveTimer) {
    clearTimeout(nextWaveTimer);
    nextWaveTimer = null;
  }
  nextWaveTimerEndsAt = 0;
  nextWaveResumeDelay = null;
}

function resumeWaveAfterUnpause() {
  if (waveInProgress || nextWaveTimer) return;

  if (nextWaveResumeDelay !== null && pendingClearedWave !== null) {
    const delay = nextWaveResumeDelay;
    nextWaveResumeDelay = null;
    scheduleNextWave(delay);
    return;
  }

  if (pendingClearedWave !== null && zombies.length === 0) {
    scheduleNextWave(NEXT_WAVE_DELAY_MS);
  }
}

function hideShopModal() {
  const modal = document.getElementById("shop-main-modal");
  if (modal) modal.classList.remove("open");
}

function closeAllRunModals() {
  hideShopModal();
  closeShopUpgradeMenu();
  closeSettingsMenu();
  closeAchievementsMenu();
}

function pauseForRunModal(reason) {
  if (gameRunning && !isGameOverVisible() && !paused) {
    setGamePaused(true, reason);
    showMilestone("Game paused");
  }
}

function resumeFromRunModal(reason) {
  if (gameRunning && !isGameOverVisible() && paused && pauseReason === reason) {
    setGamePaused(false);
    showMilestone("▶ Resuming");
  }
}



function clamp(value, min, max) {

  return Math.min(Math.max(value, min), max);

}



function isGameOverVisible() {
  return isOverlayVisible(gameOverOverlay);
}

function isNicknameScreenVisible() {
  return isOverlayVisible(startOverlay);
}

function canUseSkillShop() {
  if (isNicknameScreenVisible()) return false;
  if (isStartMenuVisible()) return true;
  if (!gameRunning || paused || isGameOverVisible()) return true;
  return false;
}

function updateShopControls() {
  const pauseBtn = document.getElementById("shop-pause-btn");
  const menuBtn = document.getElementById("shop-menu-btn");
  const runControls = document.querySelector("#shop-main-modal .shop-run-controls");
  const returnMenuBtn = document.getElementById("return-menu-btn");
  const openBtn = document.getElementById("open-shop-btn");
  const shopOpen = canUseSkillShop();
  const showRunControls =
    gameRunning && !isGameOverVisible() && !isNicknameScreenVisible();
  const mainModal = document.getElementById("shop-main-modal");

  if (pauseBtn) {
    pauseBtn.style.display = showRunControls ? "flex" : "none";
    pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
  }

  if (menuBtn) {
    menuBtn.style.display = showRunControls ? "flex" : "none";
  }

  if (runControls) {
    runControls.style.display = showRunControls ? "grid" : "none";
  }

  if (returnMenuBtn) {
    returnMenuBtn.style.display = showRunControls ? "flex" : "none";
  }

  if (openBtn) {
    openBtn.disabled = isNicknameScreenVisible();
  }

  document.querySelectorAll("#shop-main-modal .shop-buy-btn").forEach((button) => {
    button.disabled = !shopOpen || player.skillPoints <= 0;
  });

  if (mainModal && !shopOpen && mainModal.classList.contains("open")) {
    closeShopMenu();
  }

  if (!shopOpen) {
    closeShopUpgradeMenu();
  }
}

function ensureShopAccessible() {
  if (isNicknameScreenVisible()) return false;

  if (gameRunning && !isGameOverVisible() && !paused) {
    setGamePaused(true, "shop");
    showMilestone("Shop open — game paused");
  }

  return canUseSkillShop();
}

function openShopMenu() {
  if (!ensureShopAccessible()) return;
  if (isStartMenuVisible()) hideStartMenu();

  const modal = document.getElementById("shop-main-modal");
  if (modal) modal.classList.add("open");
  renderWeaponShopList(true);
  updateUI();
}

function closeShopMenu() {
  const modal = document.getElementById("shop-main-modal");
  const wasOpen = modal?.classList.contains("open");
  hideShopModal();
  if (wasOpen) {
    resumeFromRunModal("shop");
    restoreStartMenuAfterModal();
  }
}

const SHOP_UPGRADE_INFO = {
  hp: {
    title: "❤️ HP",
    desc: "+50 max HP per skill point",
    preview(count) {
      return `+${count * 50} max HP (current level +${count})`;
    }
  },
  bulletSpeed: {
    title: "💥 Bullet Speed",
    desc: "+1 bullet speed per skill point",
    preview(count) {
      return `+${count} bullet speed (current level +${count})`;
    }
  }
};

let shopUpgradeType = null;
let shopUpgradeWeaponId = null;

function getWeaponUpgradePreview(weaponId, count) {
  const weapon = getWeaponById(weaponId);
  const current = getWeaponPower(weaponId);
  const nextLevel = getWeaponLevel(weaponId) + count;
  const next = Math.max(
    1,
    Math.round((1 + nextLevel * (1.08 + nextLevel * 0.035)) * weapon.damageMult)
  );
  return `+${count} level · damage ${current} → ${next} · zombies scale tougher · R helps clear`;
}

function applyUpgrades(type, count) {
  if (!count || count <= 0) return 0;
  if (!player.upgrades.hasOwnProperty(type)) return 0;

  const spend = Math.min(count, player.skillPoints);
  if (spend <= 0) return 0;

  player.skillPoints -= spend;
  player.upgrades[type] += spend;
  playShopUpgradeFeedback();

  if (type === "hp") {
    player.maxHp += 50 * spend;
    player.hp += 50 * spend;
    if (player.hp > player.maxHp) {
      player.hp = player.maxHp;
    }
  } else if (type === "bulletSpeed") {
    player.bulletSpeed += spend;
  }

  return spend;
}

function openWeaponUpgradeMenu(weaponId) {
  if (!canUseSkillShop() || !isWeaponUnlocked(weaponId)) return;

  shopUpgradeWeaponId = weaponId;
  shopUpgradeType = null;

  const modal = document.getElementById("shop-upgrade-modal");
  const weapon = getWeaponById(weaponId);
  const titleEl = document.getElementById("shop-upgrade-title");
  const descEl = document.getElementById("shop-upgrade-desc");
  const slider = document.getElementById("shop-upgrade-slider");

  if (titleEl) titleEl.textContent = `${weapon.emoji} ${weapon.name}`;
  if (descEl) {
    descEl.textContent = `More damage, but zombies get tankier as you upgrade — use R bomb to burst them down (now: level ${getWeaponLevel(weaponId)}, ${getWeaponPower(weaponId)} dmg)`;
  }
  if (slider) {
    slider.min = "1";
    slider.max = String(Math.max(1, player.skillPoints));
    slider.value = "1";
  }

  if (modal) modal.classList.add("open");
  updateShopUpgradeMenuUI();
}

function closeShopUpgradeMenu() {
  shopUpgradeType = null;
  shopUpgradeWeaponId = null;
  const modal = document.getElementById("shop-upgrade-modal");
  if (modal) modal.classList.remove("open");
}

function getShopUpgradeAmount() {
  const slider = document.getElementById("shop-upgrade-slider");
  return slider ? Number(slider.value || 1) : 1;
}

function updateShopUpgradeMenuUI() {
  const info = shopUpgradeType ? SHOP_UPGRADE_INFO[shopUpgradeType] : null;
  const amount = getShopUpgradeAmount();
  const countEl = document.getElementById("shop-upgrade-count");
  const previewEl = document.getElementById("shop-upgrade-preview");
  const availableEl = document.getElementById("shop-upgrade-available");
  const confirmBtn = document.querySelector("#shop-upgrade-modal .shop-upgrade-confirm");

  if (countEl) countEl.textContent = String(amount);
  if (previewEl) {
    if (shopUpgradeWeaponId) {
      previewEl.textContent = getWeaponUpgradePreview(shopUpgradeWeaponId, amount);
    } else if (info) {
      previewEl.textContent = info.preview(amount);
    }
  }
  if (availableEl) availableEl.textContent = String(player.skillPoints);
  if (confirmBtn) confirmBtn.disabled = amount <= 0 || player.skillPoints <= 0;
}

function openShopUpgradeMenu(type) {
  if (!canUseSkillShop()) return;
  if (player.skillPoints <= 0) return;
  if (!SHOP_UPGRADE_INFO[type]) return;

  shopUpgradeType = type;
  shopUpgradeWeaponId = null;
  const info = SHOP_UPGRADE_INFO[type];
  const modal = document.getElementById("shop-upgrade-modal");
  const title = document.getElementById("shop-upgrade-title");
  const desc = document.getElementById("shop-upgrade-desc");
  const slider = document.getElementById("shop-upgrade-slider");

  if (title) title.textContent = info.title;
  if (desc) desc.textContent = info.desc;
  if (slider) {
    slider.min = "1";
    slider.max = String(Math.max(1, player.skillPoints));
    slider.value = "1";
  }

  if (modal) modal.classList.add("open");
  updateShopUpgradeMenuUI();
}

function setShopUpgradeAmount(value) {
  const slider = document.getElementById("shop-upgrade-slider");
  if (!slider) return;

  const max = Math.max(1, player.skillPoints);
  let next = value === "max" ? max : Math.min(max, Math.max(1, Number(value || 1)));
  slider.value = String(next);
  updateShopUpgradeMenuUI();
}

function confirmShopUpgrade() {
  if (!canUseSkillShop()) return;

  const amount = getShopUpgradeAmount();

  if (shopUpgradeWeaponId) {
    const spent = upgradeWeaponLevel(shopUpgradeWeaponId, amount);
    if (spent <= 0) return;

    const weapon = getWeaponById(shopUpgradeWeaponId);
    showMilestone(`${weapon.emoji} ${weapon.name} — +${spent} level`);
    saveProgress();
    closeShopUpgradeMenu();
    updateUI();
    return;
  }

  if (!shopUpgradeType) return;

  const spent = applyUpgrades(shopUpgradeType, amount);
  if (spent <= 0) return;

  const info = SHOP_UPGRADE_INFO[shopUpgradeType];
  showMilestone(`🛠 ${info.title} — ${spent} SP spent`);
  saveProgress();
  closeShopUpgradeMenu();
  updateUI();
}

function buyUpgrade(type) {
  if (!canUseSkillShop()) return;
  openShopUpgradeMenu(type);
}



function renderAbilityChargeDots(container, filled, max) {
  if (!container) return;
  const count = Math.max(0, Math.min(max, filled));
  if (container.childElementCount === max) {
    [...container.children].forEach((dot, index) => {
      dot.classList.toggle("filled", index < count);
    });
    return;
  }
  container.innerHTML = "";
  for (let i = 0; i < max; i++) {
    const dot = document.createElement("span");
    dot.className = `ability-dot${i < count ? " filled" : ""}`;
    container.appendChild(dot);
  }
}

function updateUI() {

  const hp = document.getElementById("hp");

  const kills = document.getElementById("kills");

  const score = document.getElementById("score");

  if (hp) hp.innerText = formatHudNumber(player.hp);

  if (kills) kills.innerText = formatHudNumber(player.kills);

  const playerLevel = document.getElementById("player-level");
  const playerXp = document.getElementById("player-xp");
  const playerXpNeeded = document.getElementById("player-xp-needed");
  const xpFill = document.getElementById("hud-xp-fill");
  const hudWaveLine = document.getElementById("hud-wave-line");
  const xpProgress = getXpProgress(player.totalXp);
  if (playerLevel) playerLevel.innerText = xpProgress.level;
  if (playerXp) playerXp.innerText = formatHudNumber(xpProgress.current);
  if (playerXpNeeded) playerXpNeeded.innerText = formatHudNumber(xpProgress.needed);
  if (xpFill) {
    const pct = xpProgress.needed > 0 ? (xpProgress.current / xpProgress.needed) * 100 : 0;
    xpFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  }
  if (hudWaveLine) {
    if (!gameRunning) {
      hudWaveLine.textContent = "In menu";
    } else if (isFreeplayMode()) {
      const phase = getFreeplayPhaseDef();
      const comboText = freeplayCombo >= 3 ? ` · x${freeplayCombo} combo` : "";
      hudWaveLine.textContent = `Freeplay · ${phase.emoji} ${phase.label}${comboText} · ${formatHudNumber(runKills)} kills · ${formatHudNumber(freeplayRunSeconds)}s`;
    } else {
      hudWaveLine.textContent = `Wave ${wave}`;
    }
  }

  if (score) score.innerText = player.score;

  const centerWave = document.getElementById("center-wave");
  if (centerWave) centerWave.innerText = isFreeplayMode() ? "∞" : wave;

  const centerEventName = document.getElementById("center-event-name");
  const currentEventEl = document.getElementById("current-event");
  const bestWaveHud = document.getElementById("best-wave-hud");
  const event = getCurrentEvent();
  if (centerEventName) {
    centerEventName.innerText = isFreeplayMode()
      ? `${getFreeplayPhaseDef().emoji} ${getFreeplayPhaseDef().label}`
      : event.name;
  }
  if (currentEventEl) {
    currentEventEl.innerText = isFreeplayMode()
      ? `${getFreeplayPhaseDef().emoji} ${getFreeplayPhaseDef().label}`
      : `${event.emoji} ${event.name}`;
  }
  if (bestWaveHud) bestWaveHud.innerText = formatHudNumber(bestWave);

  const weaponHud = document.getElementById("weapon-hud");
  if (weaponHud) {
    const weapon = getEquippedWeapon();
    weaponHud.textContent = `${weapon.name} · Lv ${getWeaponLevel(weapon.id)} · ${getWeaponPower(weapon.id)} dmg`;
  }

  const bombAttackHud = document.getElementById("ability-hud");
  const bombAttackStatus = document.getElementById("bomb-attack-status");
  const bombAttackTimer = document.getElementById("bomb-attack-timer");
  const bombAttackDots = document.getElementById("bomb-attack-dots");
  const pulseAttackStatus = document.getElementById("molotov-attack-status");
  const pulseAttackTimer = document.getElementById("molotov-attack-timer");
  const pulseAttackDots = document.getElementById("molotov-attack-dots");
  const pulseAbilityChip = document.getElementById("molotov-ability-chip");
  if (bombAttackHud) {
    bombAttackHud.hidden = !gameRunning || isGameOverVisible();
  }
  syncBombCharges();
  syncMolotovCharges();
  const cooldownMs = getBombCooldownRemainingMs();
  const onCooldown = bombCharges <= 0 && cooldownMs > 0;
  const molotovCooldownMs = getMolotovCooldownRemainingMs();
  const molotovOnCooldown = molotovCharges <= 0 && molotovCooldownMs > 0;
  const bombFilled =
    !gameRunning || isGameOverVisible() ? BOMB_MAX_CHARGES : onCooldown ? 0 : bombCharges;
  const molotovFilled =
    !gameRunning || isGameOverVisible()
      ? MOLOTOV_MAX_CHARGES
      : molotovOnCooldown
        ? 0
        : molotovCharges;

  renderAbilityChargeDots(bombAttackDots, bombFilled, BOMB_MAX_CHARGES);
  renderAbilityChargeDots(pulseAttackDots, molotovFilled, MOLOTOV_MAX_CHARGES);

  if (bombAttackStatus) {
    if (!gameRunning || isGameOverVisible() || onCooldown) {
      bombAttackStatus.hidden = true;
    } else if (bombCharges > 0) {
      bombAttackStatus.hidden = false;
      bombAttackStatus.textContent = `×${bombCharges}`;
    } else {
      bombAttackStatus.hidden = true;
    }
  }

  if (bombAttackTimer) {
    if (!gameRunning || isGameOverVisible()) {
      bombAttackTimer.textContent = "";
      bombAttackTimer.hidden = true;
    } else if (onCooldown) {
      bombAttackTimer.hidden = false;
      bombAttackTimer.textContent = `⏳ ${Math.ceil(cooldownMs / 1000)}s`;
    } else {
      bombAttackTimer.textContent = "";
      bombAttackTimer.hidden = true;
    }
  }

  if (bombAttackHud) {
    bombAttackHud.classList.remove("cooldown");
  }

  const bombAbilityChip = document.getElementById("bomb-ability-chip");
  if (bombAbilityChip) {
    bombAbilityChip.classList.toggle("cooldown", onCooldown);
    bombAbilityChip.classList.toggle("ready", !onCooldown && bombFilled > 0 && gameRunning && !isGameOverVisible());
  }

  if (pulseAttackStatus) {
    if (!gameRunning || isGameOverVisible() || molotovOnCooldown) {
      pulseAttackStatus.hidden = true;
    } else if (molotovCharges > 0) {
      pulseAttackStatus.hidden = false;
      pulseAttackStatus.textContent = `×${molotovCharges}`;
    } else {
      pulseAttackStatus.hidden = true;
    }
  }

  if (pulseAttackTimer) {
    if (!gameRunning || isGameOverVisible()) {
      pulseAttackTimer.textContent = "";
      pulseAttackTimer.hidden = true;
    } else if (molotovOnCooldown) {
      pulseAttackTimer.hidden = false;
      pulseAttackTimer.textContent = `⏳ ${Math.ceil(molotovCooldownMs / 1000)}s`;
    } else {
      pulseAttackTimer.textContent = "";
      pulseAttackTimer.hidden = true;
    }
  }

  if (pulseAbilityChip) {
    pulseAbilityChip.classList.toggle("cooldown", molotovOnCooldown);
    pulseAbilityChip.classList.toggle(
      "ready",
      !molotovOnCooldown && molotovFilled > 0 && gameRunning && !isGameOverVisible()
    );
  }

  if (skillPointsDisplay) skillPointsDisplay.innerText = player.skillPoints;

  const skillPointsHud = document.getElementById("skill-points-hud");
  if (skillPointsHud) skillPointsHud.innerText = formatHudNumber(player.skillPoints);

  if (hpLevelDisplay) hpLevelDisplay.innerText = player.upgrades.hp;

  if (bulletSpeedLevelDisplay)

    bulletSpeedLevelDisplay.innerText = player.upgrades.bulletSpeed;



  const difficultyLevelDisplay = document.getElementById("difficulty-level");

  if (difficultyLevelDisplay)

    difficultyLevelDisplay.innerText = getDifficultyTier();



  const hpModal = document.querySelectorAll(".hp-level-modal");

  hpModal.forEach((el) => (el.innerText = player.upgrades.hp));

  const bspdModal = document.querySelectorAll(".bullet-speed-level-modal");

  bspdModal.forEach((el) => (el.innerText = player.upgrades.bulletSpeed));



  const buttons = document.querySelectorAll("#shop-main-modal .shop-buy-btn");

  buttons.forEach((button) => {
    button.disabled = !canUseSkillShop() || player.skillPoints <= 0;
  });

  updateShopControls();

  updateMonthlyAchievementHUD();
  updateAchievementsUI();
  renderWeaponShopList();

  if (shopUpgradeType || shopUpgradeWeaponId) {
    const slider = document.getElementById("shop-upgrade-slider");
    if (slider) {
      slider.max = String(Math.max(1, player.skillPoints));
      if (Number(slider.value) > player.skillPoints) {
        slider.value = String(Math.max(1, player.skillPoints));
      }
    }
    updateShopUpgradeMenuUI();
  }

  if (isStartMenuVisible()) {
    updateStartMenuUI();
  }
}



async function beginRun(mode = "campaign") {
  gameMode = mode === "freeplay" ? "freeplay" : "campaign";
  if (gameMode === "freeplay" && runtimeLiveConfig.freeplayEnabled === false) {
    showMilestone("Freeplay is temporarily disabled.");
    return;
  }
  lastGameMode = gameMode;
  runKills = 0;
  if (typeof resetRunDailyStats === "function") resetRunDailyStats();
  freeplaySpawnTick = 0;
  freeplayRunSeconds = 0;
  freeplayPhase = "steady";
  freeplayPhaseTimer = 0;
  freeplayPhaseDuration = 0;
  freeplayArenaTint = null;
  freeplayCombo = 0;
  freeplayComboTimer = 0;
  freeplayBestCombo = 0;
  freeplayLastBossAt = -999;

  if (!c || !ctx) {
    console.error("Canvas or context is not available.");
    return;
  }

  hideStartMenu();
  hideTutorialOverlay();
  resumeAudio();
  gameRunning = true;

  groundCache = { ready: false, canvas: null };

  player.hp = player.maxHp;

  player.shootCooldown = 0;

  player.hurtCooldown = 0;

  player.x = WORLD_WIDTH / 2 - PLAYER_SIZE / 2;

  player.y = WORLD_HEIGHT / 2 - PLAYER_SIZE / 2;

  player.facingAngle = 0;
  playerAnimFrame = 0;
  playerAnimTick = 0;

  player.score = player.kills * 10;

  bullets = [];
  playerBombs = [];
  playerMolotovs = [];
  molotovFireZones = [];
  explosionEffects = [];
  bombCharges = BOMB_MAX_CHARGES;
  bombReadyAt = 0;
  molotovCharges = MOLOTOV_MAX_CHARGES;
  molotovReadyAt = 0;

  muzzleTracers = [];
  bulletAfterglows = [];

  bloodEffects = [];
  floatingTexts = [];
  playerRewardEffects = [];
  playerXpFeed = null;
  hpPickups = [];
  lastHpPickupSpawnAt = 0;
  player.rewardGlow = 0;
  player.rewardGlowColor = "#8ef5c8";

  zombies = [];

  wave = 1;

  runBestWave = 0;

  waveInProgress = false;

  camera = { x: 0, y: 0 };



  if (nextWaveTimer) {

    clearTimeout(nextWaveTimer);

    nextWaveTimer = null;

  }

  pendingClearedWave = null;
  lastAnnouncedEventId = null;
  paused = false;
  pauseReason = null;
  playerBaseSpeed = 4;
  if (typeof resetProRunState === "function") resetProRunState();
  hideBonusOffer();
  hideShopModal();
  closeShopUpgradeMenu();
  groundCache = { ready: false, canvas: null };
  applyArenaTheme();

  achievementPopupQueue = [];
  achievementPopupShowing = false;
  clearTimeout(showNextAchievementPopup._timer);
  const achievementPopup = document.getElementById("achievement-popup");
  if (achievementPopup) achievementPopup.classList.remove("visible", "hide");

  startBackgroundMusic();

  updateUI();

  if (gameOverOverlay) gameOverOverlay.style.display = "none";



  if (zombieSpawner) {

    clearInterval(zombieSpawner);

    zombieSpawner = null;

  }



  showMilestone(
    isFreeplayMode()
      ? "Freeplay — calm, steady, surges & gold rush!"
      : "Wave 1 — good luck!"
  );
  saveProgress();
  refreshLeaderboard();
  startWave();



  if (!animationFrameId) {
    ensureRenderLoop();
  }

}



function restart() {

  gameOverOverlay.style.display = "none";

  beginRun(lastGameMode);

}



function returnToMainMenu() {
  if (!gameRunning || isGameOverVisible()) return;

  if (isCampaignMode() && runBestWave > bestWave) {
    bestWave = runBestWave;
  }

  gameMode = "campaign";

  gameRunning = false;
  paused = false;
  pauseReason = null;
  stopBackgroundMusic();
  hideCenterHud();
  hideBonusOffer();
  closeShopMenu();
  closeShopUpgradeMenu();
  closeSettingsMenu();
  closeAchievementsMenu();
  if (typeof closeDailyChallengesMenu === "function") closeDailyChallengesMenu();

  if (zombieSpawner) {
    clearInterval(zombieSpawner);
    zombieSpawner = null;
  }

  if (nextWaveTimer) {
    clearTimeout(nextWaveTimer);
    nextWaveTimer = null;
  }

  waveInProgress = false;
  pendingClearedWave = null;
  lastAnnouncedEventId = null;
  zombies = [];
  bullets = [];
  playerBombs = [];
  playerMolotovs = [];
  molotovFireZones = [];
  explosionEffects = [];
  bombCharges = BOMB_MAX_CHARGES;
  bombReadyAt = 0;
  molotovCharges = MOLOTOV_MAX_CHARGES;
  molotovReadyAt = 0;
  muzzleTracers = [];
  bulletAfterglows = [];
  bloodEffects = [];
  floatingTexts = [];
  playerRewardEffects = [];
  playerXpFeed = null;
  hpPickups = [];
  lastHpPickupSpawnAt = 0;
  player.rewardGlow = 0;
  player.rewardGlowColor = "#8ef5c8";
  isMouseDown = false;

  saveProgress({ forceServer: true, quiet: true });
  if (typeof submitDailyRunProgress === "function") submitDailyRunProgress();
  updateUI();
  showStartMenu();
}



function goToMainMenuFromGameOver() {
  if (!isGameOverVisible()) return;

  if (gameOverOverlay) gameOverOverlay.style.display = "none";

  closeShopMenu();
  closeShopUpgradeMenu();
  closeSettingsMenu();
  closeAchievementsMenu();
  if (typeof closeDailyChallengesMenu === "function") closeDailyChallengesMenu();

  saveProgress({ forceServer: true, quiet: true });
  if (typeof submitDailyRunProgress === "function") submitDailyRunProgress();
  updateUI();
  showStartMenu();
}

function gameOver() {
  if (deathSequence?.active) return;
  gameRunning = false;
  paused = false;
  pauseReason = null;
  stopBackgroundMusic();
  hideCenterHud();
  hideBonusOffer();
  closeRunModifierPick();

  if (zombieSpawner) {
    clearInterval(zombieSpawner);
    zombieSpawner = null;
  }

  if (nextWaveTimer) {
    clearTimeout(nextWaveTimer);
    nextWaveTimer = null;
  }

  waveInProgress = false;

  if (isCampaignMode() && runBestWave > bestWave) {
    bestWave = runBestWave;
  }

  saveProgress({ forceServer: true, quiet: true });
  startDeathSequence();
}

function finalizeGameOver() {
  const goMsg = document.getElementById("gameover-msg");
  const progress = getXpProgress(player.totalXp);
  if (goMsg) {
    if (isFreeplayMode()) {
      goMsg.innerHTML = `
        <p class="gameover-summary">Freeplay run: <strong>${formatHudNumber(runKills)}</strong> kills in <strong>${formatHudNumber(freeplayRunSeconds)}s</strong>.</p>
        <div class="menu-stat-grid">
          <div class="stat-card accent"><span class="stat-label">Run Kills</span><strong class="stat-value">${formatHudNumber(runKills)}</strong></div>
          <div class="stat-card"><span class="stat-label">Best Combo</span><strong class="stat-value">x${formatHudNumber(freeplayBestCombo)}</strong></div>
          <div class="stat-card"><span class="stat-label">Time</span><strong class="stat-value">${formatHudNumber(freeplayRunSeconds)}s</strong></div>
          <div class="stat-card"><span class="stat-label">Mode</span><strong class="stat-value">Practice</strong></div>
        </div>
        <p class="gameover-summary" style="margin-top:10px;font-size:12px;opacity:0.75">No XP or skill points in Freeplay — use Waves Game to progress.</p>
      `;
    } else {
      goMsg.innerHTML = `
        <p class="gameover-summary">You reached wave <strong>${formatHudNumber(runBestWave)}</strong> this run.</p>
        <div class="menu-stat-grid">
          <div class="stat-card accent"><span class="stat-label">Best Wave</span><strong class="stat-value">${formatHudNumber(bestWave)}</strong></div>
          <div class="stat-card"><span class="stat-label">Level</span><strong class="stat-value">${formatHudNumber(progress.level)}</strong></div>
          <div class="stat-card"><span class="stat-label">Total Kills</span><strong class="stat-value">${formatHudNumber(player.kills)}</strong></div>
          <div class="stat-card"><span class="stat-label">Skill Points</span><strong class="stat-value">${formatHudNumber(player.skillPoints)}</strong></div>
        </div>
      `;
    }
  }

  updateUI();

  if (typeof submitDailyRunProgress === "function") submitDailyRunProgress();

  if (gameOverOverlay) {
    gameOverOverlay.style.display = "flex";
  }

}



function syncBombCharges() {
  if (bombCharges > 0) return;
  if (bombReadyAt <= 0) return;
  if (Date.now() >= bombReadyAt) {
    bombCharges = BOMB_MAX_CHARGES;
    bombReadyAt = 0;
  }
}

function syncMolotovCharges() {
  if (molotovCharges > 0) return;
  if (molotovReadyAt <= 0) return;
  if (Date.now() >= molotovReadyAt) {
    molotovCharges = MOLOTOV_MAX_CHARGES;
    molotovReadyAt = 0;
  }
}

function canThrowMolotov() {
  if (!canPlayerShoot()) return false;
  syncMolotovCharges();
  return molotovCharges > 0;
}

function getMolotovCooldownRemainingMs() {
  syncMolotovCharges();
  if (molotovCharges > 0) return 0;
  return Math.max(0, molotovReadyAt - Date.now());
}

function spawnMolotovFireZone(x, y) {
  molotovFireZones.push({
    x,
    y,
    radius: MOLOTOV_FIRE_RADIUS,
    life: MOLOTOV_FIRE_LIFE,
    maxLife: MOLOTOV_FIRE_LIFE,
    tickTimer: 0,
    flicker: Math.random() * Math.PI * 2
  });
  while (molotovFireZones.length > 8) molotovFireZones.shift();

  const radius = MOLOTOV_FIRE_RADIUS;
  pushExplosionEffect(x, y, radius * 0.22, "#fff4bf", { kind: "flash", life: 8, maxLife: 8 });
  pushExplosionEffect(x, y, radius * 0.48, "#ff9844", { kind: "fire", life: 16, maxLife: 16 });
  pushExplosionEffect(x, y, radius * 0.82, "#ff5522", { kind: "fire", life: 24, maxLife: 24 });
  pushExplosionEffect(x, y, radius * 0.95, "#ffd166", {
    kind: "ring",
    life: 18,
    maxLife: 18,
    ringWidth: 8,
    startRadius: radius * 0.14
  });

  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    const sparkLife = 16 + Math.floor(Math.random() * 14);
    pushExplosionEffect(x, y, 2 + Math.random() * 4, Math.random() > 0.4 ? "#ffd166" : "#ff6622", {
      kind: "spark",
      life: sparkLife,
      maxLife: sparkLife,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.8,
      drag: 0.9,
      gravity: 0.06
    });
  }

  addScreenShake(3.2);
  if (typeof playExplosionSound === "function") playExplosionSound();
  spawnFloatingText(x, y - 22, "FIRE!", "#ffb04a", 1.12);
}

function throwMolotov() {
  if (!canThrowMolotov()) return false;

  const cx = player.x + PLAYER_SIZE / 2;
  const cy = player.y + PLAYER_SIZE / 2;
  let targetX = mouseTarget.x;
  let targetY = mouseTarget.y;
  let dx = targetX - cx;
  let dy = targetY - cy;
  let dist = Math.hypot(dx, dy);

  if (dist < 48) {
    const angle = player.facingAngle || 0;
    targetX = cx + Math.cos(angle) * 160;
    targetY = cy + Math.sin(angle) * 160;
    dx = targetX - cx;
    dy = targetY - cy;
    dist = Math.hypot(dx, dy);
  }

  if (dist < 1) return false;

  const travelDist = Math.min(dist, MOLOTOV_MAX_RANGE);
  const ndx = dx / dist;
  const ndy = dy / dist;

  playerMolotovs.push({
    x: cx,
    y: cy,
    dx: ndx,
    dy: ndy,
    speed: MOLOTOV_THROW_SPEED,
    targetX: cx + ndx * travelDist,
    targetY: cy + ndy * travelDist,
    spawnedAt: Date.now(),
    spin: Math.random() * Math.PI * 2
  });

  molotovCharges -= 1;
  if (molotovCharges <= 0) {
    molotovReadyAt = Date.now() + MOLOTOV_COOLDOWN_MS;
  }

  player.muzzleFlash = Math.max(player.muzzleFlash || 0, 3);
  player.weaponRecoil = Math.min(0.16, (player.weaponRecoil || 0) + 0.08);
  updateUI();
  return true;
}

function updatePlayerMolotovs() {
  for (let i = playerMolotovs.length - 1; i >= 0; i--) {
    const bottle = playerMolotovs[i];
    bottle.x += bottle.dx * bottle.speed;
    bottle.y += bottle.dy * bottle.speed;
    bottle.spin += 0.28;

    const reachedTarget = Math.hypot(bottle.x - bottle.targetX, bottle.y - bottle.targetY) <= bottle.speed + 6;
    const timedOut = Date.now() - bottle.spawnedAt >= MOLOTOV_MAX_FLIGHT_MS;

    if (reachedTarget || timedOut) {
      spawnMolotovFireZone(bottle.targetX, bottle.targetY);
      playerMolotovs.splice(i, 1);
    }
  }
}

function updateMolotovFireZones() {
  for (let i = molotovFireZones.length - 1; i >= 0; i--) {
    const fire = molotovFireZones[i];
    fire.life -= 1;
    if (fire.life <= 0) {
      molotovFireZones.splice(i, 1);
      continue;
    }

    fire.tickTimer += 1;
    if (fire.tickTimer < MOLOTOV_TICK_INTERVAL) continue;
    fire.tickTimer = 0;

    for (let j = zombies.length - 1; j >= 0; j--) {
      const z = zombies[j];
      const zcx = z.x + z.size / 2;
      const zcy = z.y + z.size / 2;
      const hitRadius = fire.radius + z.size * 0.24;
      const dist = Math.hypot(fire.x - zcx, fire.y - zcy);
      if (dist > hitRadius) continue;

      const falloff = 1 - Math.min(1, dist / hitRadius) * 0.32;
      const tickDamage = getMolotovTickDamageForZombie(z, falloff);
      if (tickDamage <= 0) continue;
      damageZombie(
        z,
        j,
        { angle: Math.atan2(zcy - fire.y, zcx - fire.x), isMolotov: true },
        tickDamage
      );
    }
  }
}

function drawMolotovFireZones() {
  for (const fire of molotovFireZones) {
    const alpha = fire.life / fire.maxLife;
    const flicker = 0.84 + Math.sin(fire.flicker + performance.now() * 0.011) * 0.16;
    const radius = fire.radius * (0.94 + (1 - alpha) * 0.06);
    const groundY = fire.y + radius * 0.1;

    ctx.save();
    ctx.globalAlpha = alpha * 0.46 * flicker;
    const grad = ctx.createRadialGradient(fire.x, groundY, radius * 0.08, fire.x, groundY, radius);
    grad.addColorStop(0, "rgba(255,236,150,0.62)");
    grad.addColorStop(0.34, "rgba(255,120,36,0.5)");
    grad.addColorStop(0.72, "rgba(190,48,8,0.34)");
    grad.addColorStop(1, "rgba(70,8,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(fire.x, groundY, radius, radius * 0.76, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.24;
    ctx.strokeStyle = "rgba(255,170,70,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(fire.x, groundY, radius * 0.9, radius * 0.68, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPlayerMolotovs() {
  playerMolotovs.forEach((bottle) => {
    ctx.save();
    ctx.translate(bottle.x, bottle.y);
    ctx.rotate(bottle.spin || 0);

    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255,120,40,0.5)";
    ctx.fillStyle = "#4a2818";
    ctx.beginPath();
    ctx.roundRect(-5, -10, 10, 18, 3);
    ctx.fill();

    ctx.fillStyle = "rgba(255,220,120,0.85)";
    ctx.beginPath();
    ctx.moveTo(6, -12);
    ctx.lineTo(10, -16);
    ctx.lineTo(8, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ff6622";
    ctx.beginPath();
    ctx.arc(9, -14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function canThrowBomb() {
  if (!canPlayerShoot()) return false;
  syncBombCharges();
  return bombCharges > 0;
}

function getBombCooldownRemainingMs() {
  syncBombCharges();
  if (bombCharges > 0) return 0;
  return Math.max(0, bombReadyAt - Date.now());
}

function throwBomb() {
  if (!canThrowBomb()) return false;

  const cx = player.x + PLAYER_SIZE / 2;
  const cy = player.y + PLAYER_SIZE / 2;
  let targetX = mouseTarget.x;
  let targetY = mouseTarget.y;
  let dx = targetX - cx;
  let dy = targetY - cy;
  let dist = Math.hypot(dx, dy);

  if (dist < 48) {
    const angle = player.facingAngle || 0;
    targetX = cx + Math.cos(angle) * 180;
    targetY = cy + Math.sin(angle) * 180;
    dx = targetX - cx;
    dy = targetY - cy;
    dist = Math.hypot(dx, dy);
  }

  if (dist < 1) return false;

  const travelDist = Math.min(dist, BOMB_MAX_RANGE);
  const ndx = dx / dist;
  const ndy = dy / dist;

  playerBombs.push({
    x: cx,
    y: cy,
    dx: ndx,
    dy: ndy,
    speed: BOMB_THROW_SPEED,
    targetX: cx + ndx * travelDist,
    targetY: cy + ndy * travelDist,
    spawnedAt: Date.now()
  });

  bombCharges -= 1;
  if (bombCharges <= 0) {
    bombReadyAt = Date.now() + BOMB_COOLDOWN_MS;
  }

  player.muzzleFlash = Math.max(player.muzzleFlash || 0, 5);
  player.weaponRecoil = Math.min(0.2, (player.weaponRecoil || 0) + 0.12);
  updateUI();
  return true;
}

function pushExplosionEffect(x, y, radius, color = "#ff8844", options = {}) {
  const life = options.life ?? 22;
  explosionEffects.push({
    x,
    y,
    radius,
    color,
    life,
    maxLife: options.maxLife ?? life,
    kind: options.kind || "fire",
    vx: options.vx || 0,
    vy: options.vy || 0,
    drag: options.drag ?? 0.9,
    gravity: options.gravity ?? 0,
    ringWidth: options.ringWidth || 7,
    startRadius: options.startRadius ?? radius * 0.12
  });
  if (explosionEffects.length > 80) {
    explosionEffects.splice(0, explosionEffects.length - 80);
  }
}

function spawnBombExplosionVisuals(x, y, radius) {
  pushExplosionEffect(x, y, radius * 0.35, "#ffffff", { kind: "flash", life: 10, maxLife: 10 });
  pushExplosionEffect(x, y, radius * 0.62, "#fff6bf", { kind: "fire", life: 16, maxLife: 16 });
  pushExplosionEffect(x, y, radius * 1.05, "#ff9844", { kind: "fire", life: 28, maxLife: 28 });
  pushExplosionEffect(x, y, radius * 1.45, "#ff5522", { kind: "fire", life: 36, maxLife: 36 });
  pushExplosionEffect(x, y, radius * 1.15, "#ffd166", {
    kind: "ring",
    life: 22,
    maxLife: 22,
    ringWidth: 10,
    startRadius: radius * 0.18
  });
  pushExplosionEffect(x, y, radius * 1.55, "#ff8844", {
    kind: "ring",
    life: 30,
    maxLife: 30,
    ringWidth: 6,
    startRadius: radius * 0.28
  });
  pushExplosionEffect(x, y, radius * 1.75, "#ffb04a", {
    kind: "ring",
    life: 38,
    maxLife: 38,
    ringWidth: 4,
    startRadius: radius * 0.42
  });

  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 11;
    const sparkLife = 18 + Math.floor(Math.random() * 20);
    pushExplosionEffect(x, y, 3 + Math.random() * 7, Math.random() > 0.45 ? "#ffd166" : "#ff6622", {
      kind: "spark",
      life: sparkLife,
      maxLife: sparkLife,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      drag: 0.86,
      gravity: 0.08
    });
  }

  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    const smokeLife = 34 + Math.floor(Math.random() * 18);
    pushExplosionEffect(x, y, 16 + Math.random() * 24, "#5a4030", {
      kind: "smoke",
      life: smokeLife,
      maxLife: smokeLife,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.6,
      drag: 0.94,
      gravity: -0.03
    });
  }
}

function detonatePlayerBomb(bomb) {
  const cx = bomb.x;
  const cy = bomb.y;
  const radius = BOMB_BLAST_RADIUS;

  addScreenShake(8.5);
  if (typeof playExplosionSound === "function") playExplosionSound();
  spawnBombExplosionVisuals(cx, cy, radius);
  spawnFloatingText(cx, cy - 24, "BOOM!", "#ffb04a", 1.35);
  if (typeof hurtFlash !== "undefined") {
    hurtFlash = Math.min(1, (hurtFlash || 0) + 0.18);
  }

  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    const zcx = z.x + z.size / 2;
    const zcy = z.y + z.size / 2;
    const hitRadius = radius + z.size * 0.35;
    const dist = Math.hypot(cx - zcx, cy - zcy);
    if (dist > hitRadius) continue;

    const falloff = 1 - Math.min(1, dist / hitRadius) * 0.26;
    const bombDamage = getBombDamageForZombie(z, falloff);
    if (bombDamage <= 0) continue;
    damageZombie(
      z,
      i,
      { angle: Math.atan2(zcy - cy, zcx - cx), isBomb: true },
      bombDamage
    );
  }
}

function updatePlayerBombs() {
  for (let i = playerBombs.length - 1; i >= 0; i--) {
    const bomb = playerBombs[i];
    bomb.x += bomb.dx * bomb.speed;
    bomb.y += bomb.dy * bomb.speed;

    const reachedTarget = Math.hypot(bomb.x - bomb.targetX, bomb.y - bomb.targetY) <= bomb.speed + 6;
    const timedOut = Date.now() - bomb.spawnedAt >= BOMB_MAX_FLIGHT_MS;

    if (reachedTarget || timedOut) {
      detonatePlayerBomb(bomb);
      playerBombs.splice(i, 1);
    }
  }
}

function updateExplosionEffects() {
  for (let i = explosionEffects.length - 1; i >= 0; i--) {
    const fx = explosionEffects[i];
    fx.life -= 1;

    if (fx.kind === "spark" || fx.kind === "smoke") {
      fx.x += fx.vx;
      fx.y += fx.vy;
      fx.vx *= fx.drag;
      fx.vy *= fx.drag;
      fx.vy += fx.gravity || 0;
    }

    if (fx.life <= 0) {
      explosionEffects.splice(i, 1);
    }
  }
}

function drawPlayerBombs() {
  playerBombs.forEach((bomb) => {
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(255,136,68,0.55)";
    ctx.fillStyle = "#2f2418";
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff8844";
    ctx.beginPath();
    ctx.arc(bomb.x - 2, bomb.y - 1, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(bomb.x + 5, bomb.y - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawExplosionEffects() {
  explosionEffects.forEach((fx) => {
    const alpha = fx.life / fx.maxLife;
    const progress = 1 - alpha;

    ctx.save();

    if (fx.kind === "ring") {
      const ringRadius = fx.startRadius + (fx.radius - fx.startRadius) * progress;
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = colorWithAlpha(fx.color, 0.85);
      ctx.lineWidth = fx.ringWidth * (0.65 + alpha * 0.55);
      ctx.shadowBlur = 16;
      ctx.shadowColor = colorWithAlpha(fx.color, 0.55);
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (fx.kind === "spark") {
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 10;
      ctx.shadowColor = colorWithAlpha(fx.color, 0.8);
      ctx.fillStyle = colorWithAlpha("#ffffff", 0.85);
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colorWithAlpha(fx.color, 0.95);
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (fx.kind === "smoke") {
      ctx.globalAlpha = alpha * 0.42;
      const grad = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, fx.radius);
      grad.addColorStop(0, colorWithAlpha("#8a7060", 0.55));
      grad.addColorStop(1, colorWithAlpha(fx.color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (0.8 + progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const pulse = fx.kind === "flash" ? 1 + progress * 0.8 : 1 + progress * 0.45;
    const drawRadius = fx.radius * pulse;
    const coreAlpha = fx.kind === "flash" ? alpha * 0.95 : alpha * 0.82;

    ctx.globalAlpha = coreAlpha;
    ctx.shadowBlur = fx.kind === "flash" ? 28 : 18;
    ctx.shadowColor = colorWithAlpha(fx.color, 0.65);
    const grad = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, drawRadius);
    grad.addColorStop(0, colorWithAlpha("#ffffff", fx.kind === "flash" ? 1 : 0.95));
    grad.addColorStop(0.22, colorWithAlpha("#fff2aa", 0.9));
    grad.addColorStop(0.55, colorWithAlpha(fx.color, 0.72));
    grad.addColorStop(1, colorWithAlpha(fx.color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, drawRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function fireWeapon(targetX, targetY) {
  if (!canPlayerShoot()) return;

  const weapon = getEquippedWeapon();
  const cx = player.x + PLAYER_SIZE / 2;
  const cy = player.y + PLAYER_SIZE / 2;
  const angle = Math.atan2(targetY - cy, targetX - cx);
  const speed = player.bulletSpeed * weapon.speedMult;
  const damage = getBulletDamage(weapon);
  const sprite = getEquippedWeaponSprite();
  const muzzle = sprite?.ready
    ? getWeaponDrawTransform(cx, cy, player.facingAngle || 0, sprite)
    : null;
  const spawnX = muzzle?.muzzleX ?? cx;
  const spawnY = muzzle?.muzzleY ?? cy;

  player.weaponRecoil = Math.min(0.16, (player.weaponRecoil || 0) + 0.09);
  player.muzzleFlash = Math.max(player.muzzleFlash || 0, weapon.id === "shotgun" ? 4 : 3);
  playGunshot();

  for (let i = 0; i < weapon.pellets; i++) {
    const spread = weapon.spread ? (Math.random() - 0.5) * weapon.spread * 2 : 0;
    const shotAngle = angle + spread;
    pushBullet(
      spawnX,
      spawnY,
      Math.cos(shotAngle),
      Math.sin(shotAngle),
      speed,
      { damage, color: weapon.color }
    );
  }
}

function shoot(e) {
  if (!canPlayerShoot()) return;

  const view = clientToView(e.clientX, e.clientY);

  if (view.x < 0 || view.y < 0 || view.x > VIEW_WIDTH || view.y > VIEW_HEIGHT) return;

  const world = screenToWorld(view.x, view.y);
  fireWeapon(world.x, world.y);
}

function shootAt(targetX, targetY) {
  fireWeapon(targetX, targetY);
}



function updatePlayerFacing() {
  if (isMouseDown) {
    player.facingAngle = Math.atan2(
      mouseTarget.y - (player.y + PLAYER_SIZE / 2),
      mouseTarget.x - (player.x + PLAYER_SIZE / 2)
    );
    return;
  }

  let dx = 0;
  let dy = 0;

  if (keys["w"]) dy -= 1;
  if (keys["s"]) dy += 1;
  if (keys["a"]) dx -= 1;
  if (keys["d"]) dx += 1;

  if (dx !== 0 || dy !== 0) {
    player.facingAngle = Math.atan2(dy, dx);
  }
}

function isPlayerMoving() {
  return !!(keys["w"] || keys["a"] || keys["s"] || keys["d"]);
}

function updatePlayerAnimation() {
  playerAnimTick += 1;
  const sheet = isPlayerMoving() ? playerSprites.move : playerSprites.idle;
  const step = isPlayerMoving() ? 5 : 9;

  if (playerAnimTick % step === 0) {
    playerAnimFrame = (playerAnimFrame + 1) % sheet.frameCount;
  }
}

function drawSpriteSheet(sheet, frame, cx, cy, size, angle, options = {}) {
  if (!sheet.ready || sheet.frameWidth <= 0 || sheet.frameHeight <= 0) return false;

  const frameIndex = frame % sheet.frameCount;
  const scale = size / Math.max(sheet.frameWidth, sheet.frameHeight);
  const squashX = options.squashX ?? 1;
  const drawW = sheet.frameWidth * scale * squashX;
  const drawH = sheet.frameHeight * scale;
  const anchor = options.anchor || "center";
  const destY = -drawH / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle || 0);
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high";
  }
  ctx.drawImage(
    sheet.img,
    frameIndex * sheet.frameWidth,
    0,
    sheet.frameWidth,
    sheet.frameHeight,
    -drawW / 2,
    destY,
    drawW,
    drawH
  );
  ctx.restore();
  return true;
}

function getEquippedWeaponSprite() {
  return weaponSprites[equippedWeaponId] || weaponSprites.pistol;
}

function getWeaponDrawTransform(cx, cy, facing, sprite) {
  const visual = WEAPON_SPRITE_META[sprite.id] || WEAPON_SPRITE_META.pistol;
  const angle = facing + WEAPON_HAND_TILT + (player.weaponRecoil || 0);
  const scale = visual.scale;
  const localX = WEAPON_GRIP_OFFSET_X + (visual.gripFineX || 0);
  const localY = WEAPON_GRIP_OFFSET_Y + (visual.gripFineY || 0);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const gripX = cx + localX * Math.cos(facing) - localY * Math.sin(facing);
  const gripY = cy + localX * Math.sin(facing) + localY * Math.cos(facing);
  const muzzleLocalX = (sprite.muzzleX - sprite.gripX) * scale;
  const muzzleLocalY = (sprite.muzzleY - sprite.gripY) * scale;
  const muzzleX = gripX + muzzleLocalX * cos - muzzleLocalY * sin;
  const muzzleY = gripY + muzzleLocalX * sin + muzzleLocalY * cos;

  return { gripX, gripY, muzzleX, muzzleY, angle, scale, visual };
}

function drawEquippedWeapon(cx, cy, facing) {
  const sprite = getEquippedWeaponSprite();
  if (!sprite?.ready) return null;

  const { gripX, gripY, muzzleX, muzzleY, angle, scale, visual } = getWeaponDrawTransform(
    cx,
    cy,
    facing,
    sprite
  );
  const drawW = sprite.width * scale;
  const drawH = sprite.height * scale;
  const gripPx = sprite.gripX * scale;
  const gripPy = sprite.gripY * scale;

  ctx.save();
  ctx.translate(gripX, gripY);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(sprite.img, -gripPx, -gripPy, drawW, drawH);

  if (player.muzzleFlash > 0) {
    const weapon = getEquippedWeapon();
    const flashR = 4 + player.muzzleFlash * 1.2;
    const flashX = (sprite.muzzleX - sprite.gripX) * scale;
    const flashY = (sprite.muzzleY - sprite.gripY) * scale;
    const grad = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashR);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.5, colorWithAlpha(weapon.color, 0.45));
    grad.addColorStop(1, colorWithAlpha(weapon.color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(flashX, flashY, flashR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  return { muzzleX, muzzleY };
}

function drawPlayer(theme) {
  const cx = player.x + PLAYER_SIZE / 2;
  const cy = player.y + PLAYER_SIZE / 2;
  const sheet = isPlayerMoving() ? playerSprites.move : playerSprites.idle;
  const facing = player.facingAngle || 0;
  const rewardGlowActive = player.rewardGlow > 0;
  const glowStrength = rewardGlowActive ? player.rewardGlow / 78 : 0;
  const glowOptions = rewardGlowActive
    ? {
        blur: 10 + glowStrength * 18,
        alpha: 0.28 + glowStrength * 0.38,
        squashX: PLAYER_SQUASH_X
      }
    : { blur: 7, alpha: 0.24, squashX: PLAYER_SQUASH_X };

  if (
    !drawSpriteWithGlow(
      sheet,
      playerAnimFrame,
      cx,
      cy,
      PLAYER_VISUAL_SIZE,
      facing,
      rewardGlowActive ? player.rewardGlowColor || "#8ef5c8" : theme.zombieGlow,
      glowOptions
    )
  ) {
    drawEntityShadow(cx, cy, PLAYER_VISUAL_SIZE);
    ctx.fillStyle = theme.accent;
    ctx.shadowBlur = 16;
    ctx.shadowColor = theme.entityGlow;
    ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    ctx.shadowBlur = 0;
  }

  const hpLabel = `${Math.max(0, Math.ceil(player.hp))} HP`;
  drawHealthBar(cx, player.y - 2, player.hp, player.maxHp, {
    width: 54,
    height: 6,
    color: theme.accent,
    showText: player.hp <= player.maxHp * 0.35,
    label: hpLabel,
    fontSize: 10
  });
}



function update() {
  if (!gameRunning) return;

  updateBloodEffects();
  updateFloatingTexts();
  updatePlayerRewardEffects();
  updateMuzzleTracers();
  updateBulletAfterglows();
  updateExplosionEffects();
  updateHpPickups();
  updateZombieProjectiles();

  if (bonusOffer) {
    updateBonusOfferUI();
  }

  if (paused) {
    return;
  }

  maybeSpawnHpPickups();



  const moveSpeed = player.speed * getRunMoveSpeedMult();
  let moveDx = 0;
  let moveDy = 0;

  if (keys["w"]) moveDy -= moveSpeed;
  if (keys["s"]) moveDy += moveSpeed;
  if (keys["a"]) moveDx -= moveSpeed;
  if (keys["d"]) moveDx += moveSpeed;

  updatePlayerFacing();
  updatePlayerAnimation();

  player.x += moveDx;
  player.y += moveDy;
  player.x = clamp(player.x, 0, WORLD_WIDTH - PLAYER_SIZE);
  player.y = clamp(player.y, 0, WORLD_HEIGHT - PLAYER_SIZE);

  updateCamera();
  checkHpPickupCollisions();



  player.score = player.kills * 10;



  if (player.shootCooldown > 0) {

    player.shootCooldown -= 1;

  }

  if (player.weaponRecoil > 0) {
    player.weaponRecoil = Math.max(0, player.weaponRecoil - 0.045);
  }

  if (player.muzzleFlash > 0) {
    player.muzzleFlash -= 1;
  }



  if (isMouseDown && player.shootCooldown <= 0) {

    shootAt(mouseTarget.x, mouseTarget.y);

    player.shootCooldown = getShootCooldown();

  }

  updatePlayerBombs();
  updatePlayerMolotovs();
  updateMolotovFireZones();
  updateBullets();

  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];

    if (z.hitCooldown > 0) {
      z.hitCooldown -= 1;
    }

    const playerCenterX = player.x + PLAYER_SIZE / 2;
    const playerCenterY = player.y + PLAYER_SIZE / 2;
    const zombieCenterX = z.x + z.size / 2;
    const zombieCenterY = z.y + z.size / 2;

    const dx = playerCenterX - zombieCenterX;
    const dy = playerCenterY - zombieCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let speed = z.speed || 1.2;
    if (isWaveBossZombie(z)) {
      speed = getWaveBossChaseSpeed(speed, z.bossPhase || 1, dist, z.size || WAVE_BOSS_BASE_SIZE);
    }

    let movedByArchetype = false;
    if (dist > 0.001) {
      z.facingAngle = Math.atan2(dy, dx);
    }

    if (dist > 0) {
      movedByArchetype = updateZombieArchetype(
        z,
        dist,
        playerCenterX,
        playerCenterY,
        zombieCenterX,
        zombieCenterY
      );
      if (!movedByArchetype) {
        z.x += (dx / dist) * speed * (z.jitter || 1);
        z.y += (dy / dist) * speed * (z.jitter || 1);
      }
      z.animTick = (z.animTick || 0) + 1;
      if (z.animTick % 8 === 0) {
        const animFrames = usesZombieVariantArt(z) ? ZOMBIE_VARIANT_FRAME_COUNT : zombieSprites.move.frameCount;
        z.animFrame = ((z.animFrame || 0) + 1) % animFrames;
      }
    } else {
      z.animTick = 0;
      z.animFrame = 0;
    }
  }

  if (player.hurtCooldown > 0) {
    player.hurtCooldown -= 1;
  }

  const contactCount = countZombiesTouchingPlayer();
  applyZombieSwarmDamage(contactCount);

  updateFreeplayMode();

  if (isCampaignMode() && zombies.length === 0 && waveInProgress && !nextWaveTimer) {
    scheduleNextWave();
  }

  updateUI();
}



function formatHudNumber(value) {
  return Math.max(0, Math.ceil(Number(value) || 0)).toLocaleString("sv-SE");
}

function drawHealthBar(cx, top, hp, maxHp, options = {}) {
  const max = Math.max(1, maxHp || 1);
  const ratio = Math.max(0, Math.min(1, hp / max));
  const width = options.width ?? 46;
  const height = options.height ?? 5;
  const x = cx - width / 2;
  const y = top - height;
  const low = ratio <= 0.25;
  const fill = low ? "#ff5c6c" : options.color || "#5dffb0";

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, width + 2, height + 2, 3);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 2);
  ctx.fill();

  if (ratio > 0) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(height, width * ratio), height, 2);
    ctx.fill();
  }

  if (options.showText) {
    const label = options.label ?? `${Math.max(0, Math.ceil(hp))}`;
    ctx.font = `600 ${options.fontSize || 10}px Poppins, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = 3;
    ctx.fillStyle = low ? "#ffb4bc" : "#eefef5";
    ctx.strokeText(label, cx, y - 2);
    ctx.fillText(label, cx, y - 2);
  }

  ctx.restore();
}

function drawEntityShadow(cx, cy, size, anchor = "center") {
  const shadowY = anchor === "feet" ? cy + size * 0.015 : cy + size * 0.14;
  const shadowW = size * (anchor === "feet" ? 0.42 : 0.36);
  const shadowH = size * (anchor === "feet" ? 0.15 : 0.13);
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(cx, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpriteWithGlow(sheet, frame, cx, cy, size, angle, glowColor, glow = {}) {
  if (!glow.skipShadow) {
    drawEntityShadow(cx, cy, size, glow.anchor);
  }
  if (!sheet.ready || sheet.frameWidth <= 0) return false;

  const glowBlur = glow.blur ?? 14;
  const glowAlpha = glow.alpha ?? 0.55;

  if (glowColor && glowAlpha > 0) {
    ctx.save();
    ctx.shadowBlur = glowBlur;
    ctx.shadowColor = glowColor;
    ctx.globalAlpha = glowAlpha;
    drawSpriteSheet(sheet, frame, cx, cy, size, angle, glow);
    ctx.restore();
  }

  return drawSpriteSheet(sheet, frame, cx, cy, size, angle, glow);
}

function drawArenaAtmosphere(theme) {
  const px = player.x + PLAYER_SIZE / 2;
  const py = player.y + PLAYER_SIZE / 2;
  const wx = WORLD_WIDTH / 2;
  const wy = WORLD_HEIGHT / 2;
  const t = performance.now() * 0.001;
  const pulse = 0.9 + Math.sin(t * 1.35) * 0.1;

  const spot = ctx.createRadialGradient(px, py, 50, px, py, 400 * pulse);
  spot.addColorStop(0, theme.spotlight);
  spot.addColorStop(0.5, theme.spotlightMid);
  spot.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  const edge = ctx.createRadialGradient(wx, wy, Math.min(WORLD_WIDTH, WORLD_HEIGHT) * 0.18, wx, wy, Math.max(WORLD_WIDTH, WORLD_HEIGHT) * 0.55);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = theme.fog;
  ctx.globalAlpha = 0.16 + Math.sin(t * 0.7) * 0.035;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.globalAlpha = 1;
}

function drawGrassField(theme) {
  if (!groundCache.ready || !groundCache.canvas) {
    groundCache = { ready: true, canvas: buildGroundCanvas(theme) };
  }
  ctx.drawImage(groundCache.canvas, 0, 0);
}

function drawArenaEnvironmentDecor(theme) {
  const parallaxShift = 0.07;
  ctx.save();
  ctx.translate(camera.x * parallaxShift, camera.y * parallaxShift);

  for (const bush of ARENA_FOREST_BUSHES) {
    ctx.globalAlpha = bush.alpha;
    drawTopDownBush(ctx, bush.x, bush.y, bush.radius, theme, bush.rot);
  }

  for (const stone of ARENA_SCATTER_STONES) {
    ctx.globalAlpha = stone.alpha;
    drawGroundStone(ctx, stone.x, stone.y, theme, Math.floor(stone.x + stone.y));
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawAmbientParticles(theme) {
  const t = performance.now() * 0.001;
  ctx.save();

  for (let i = 0; i < 42; i += 1) {
    const seed = i + 1;
    const baseX = hash2D(seed, 1, 601) * WORLD_WIDTH;
    const baseY = hash2D(seed, 2, 602) * WORLD_HEIGHT;
    const drift = 12 + hash2D(seed, 3, 603) * 18;
    const speed = 0.25 + hash2D(seed, 4, 604) * 0.35;
    const phase = hash2D(seed, 5, 605) * Math.PI * 2;
    const x = baseX + Math.sin(t * speed + phase) * drift;
    const y = (baseY - ((t * (14 + hash2D(seed, 6, 606) * 10)) % (WORLD_HEIGHT + 30))) + 15;
    const size = 1 + hash2D(seed, 7, 607) * 2;

    ctx.fillStyle = theme.speckle;
    ctx.globalAlpha = 0.08 + hash2D(seed, 8, 608) * 0.14;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawWorldBackground(theme) {
  drawGrassField(theme);
  drawArenaEnvironmentDecor(theme);
  drawArenaAtmosphere(theme);
  drawAmbientParticles(theme);

  const event = getCurrentEvent();
  if (event.tint) {
    ctx.fillStyle = event.tint;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  if (isFreeplayMode() && freeplayArenaTint) {
    ctx.fillStyle = freeplayArenaTint;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
}



function drawViewportVignette() {
  const w = VIEW_WIDTH;
  const h = VIEW_HEIGHT;
  const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.22, w / 2, h / 2, h * 0.78);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function draw() {

  if (!ctx || !c) return;

  const theme = getArenaTheme();



  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  ctx.save();

  const shake = typeof getShakeOffset === "function" ? getShakeOffset() : { x: 0, y: 0 };
  ctx.translate(-camera.x + shake.x, -camera.y + shake.y);



  drawWorldBackground(theme);

  drawBloodEffects();

  drawMolotovFireZones();

  drawExplosionEffects();

  drawHpPickups();

  drawPlayer(theme);

  drawPlayerBombs();
  drawPlayerMolotovs();

  drawFloatingTexts();
  if (typeof drawKillJuice === "function") drawKillJuice();
  drawZombieProjectiles();

  zombies.forEach((z) => {
    const cx = z.x + z.size / 2;
    const cy = z.y + z.size / 2;
    const isWaveBoss = z.tier === "waveBoss" || z.isWaveBoss;
    const archetypeDef = z.archetype ? ARCHETYPE_DEFS[z.archetype] : null;
    const variantArt = usesZombieVariantArt(z);
    const chibiSkin = usesChibiZombieSkin(z);
    const sheet = getZombieDrawSheet(z);
    const motion = getZombieDrawMotion(z);

    if (!variantArt && !chibiSkin) {
      drawArchetypeTint(z, cx, cy);
    }
    drawArchetypeTelegraph(z, cx, cy);
    if (z.golden && !variantArt && !chibiSkin) {
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = "#ffd54a";
      ctx.beginPath();
      ctx.arc(cx, cy, z.size * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const drawX = cx;
    const drawY = cy + motion.cyOffset;
    const glowOptions = {
      squashX: motion.squashX,
      anchor: motion.anchor,
      skipShadow: variantArt
    };

    if (variantArt) {
      drawEntityShadow(cx, motion.shadowY, motion.shadowSize, "feet");
    }

    if (
      !drawSpriteWithGlow(
        sheet,
        motion.frame,
        drawX,
        drawY,
        motion.drawSize,
        motion.angle,
        isWaveBoss ? "#d050ff" : z.golden ? "#ffd54a" : archetypeDef?.glow || theme.zombieGlow,
        isWaveBoss
          ? { blur: 26, alpha: 0.52, ...glowOptions }
          : z.golden
            ? { blur: 18, alpha: 0.45, ...glowOptions }
            : archetypeDef
              ? { blur: 16, alpha: 0.38, ...glowOptions }
              : glowOptions
      )
    ) {
      drawEntityShadow(cx, cy, z.size);
      ctx.fillStyle = isWaveBoss
        ? "#7a0f7a"
        : z.tier === "boss"
          ? "#6a0dad"
          : z.tier === "medium"
            ? "purple"
            : z.tier === "tank"
              ? "#c45c00"
              : "red";
      ctx.fillRect(z.x, z.y, z.size, z.size);
    }

    const barTop = variantArt ? cy + motion.cyOffset - motion.drawSize * 0.48 : z.y - 2;
    const barWidth = Math.max(34, z.size * 0.62);
    const isElite =
      isWaveBoss || z.tier === "boss" || z.tier === "medium" || z.tier === "tank";
    let barColor = theme.accent;
    if (isWaveBoss) barColor = "#d77bff";
    else if (z.tier === "boss") barColor = "#b86cff";
    else if (z.tier === "tank") barColor = "#ffb054";
    else if (z.tier === "medium") barColor = "#a98cff";

    drawHealthBar(cx, barTop, z.hp, z.maxHp || Math.max(z.hp, 1), {
      width: barWidth,
      height: isWaveBoss ? 6 : 4,
      color: barColor,
      showText: true,
      label: isWaveBoss
        ? `BOSS P${z.bossPhase || 1} ${Math.max(0, Math.ceil(z.hp))}`
        : z.archetype
          ? `${ARCHETYPE_DEFS[z.archetype]?.label || ""} ${Math.max(0, Math.ceil(z.hp))}`
          : `${Math.max(0, Math.ceil(z.hp))}`,
      fontSize: isWaveBoss ? 10 : isElite ? 9 : 8
    });
  });



  drawBulletAfterglows();
  drawMuzzleTracers();
  bullets.forEach((b) => drawBullet(b));

  const pcx = player.x + PLAYER_SIZE / 2;
  const pcy = player.y + PLAYER_SIZE / 2;
  drawEquippedWeapon(pcx, pcy, player.facingAngle || 0);
  drawPlayerRewardEffects();

  ctx.restore();

  if (typeof drawEnhancedVignette === "function") {
    drawEnhancedVignette();
  } else {
    drawViewportVignette();
  }

}



function setGamePaused(shouldPause, reason = null) {
  if (!gameRunning || isGameOverVisible()) return false;
  if (shouldPause === paused) {
    if (shouldPause && reason) pauseReason = reason;
    return true;
  }

  paused = shouldPause;

  if (paused) {
    pauseReason = reason || "manual";
    freezeNextWaveTimer();
    isMouseDown = false;
  } else {
    pauseReason = null;
    hideShopModal();
    closeShopUpgradeMenu();
    resumeWaveAfterUnpause();
  }

  updateUI();
  return true;
}

function toggleGamePause() {
  if (
    !gameRunning ||
    isGameOverVisible() ||
    isNicknameScreenVisible() ||
    isStartMenuVisible() ||
    isTutorialVisible()
  ) {
    return false;
  }

  const willPause = !paused;
  if (!setGamePaused(willPause, willPause ? "manual" : null)) return false;

  showMilestone(willPause ? "⏸ Game paused" : "▶ Resuming");
  return true;
}

function toggleShop() {
  toggleGamePause();
}



window.openAchievementsMenu = openAchievementsMenu;
window.closeAchievementsMenu = closeAchievementsMenu;
window.openSettingsMenu = openSettingsMenu;
window.closeSettingsMenu = closeSettingsMenu;
window.openFeedbackMenu = openFeedbackMenu;
window.closeFeedbackMenu = closeFeedbackMenu;
window.setFeedbackCategory = setFeedbackCategory;
window.submitFeedback = submitFeedback;
window.openFeedbackInboxMenu = openFeedbackInboxMenu;
window.closeFeedbackInboxMenu = closeFeedbackInboxMenu;
window.refreshFeedbackInbox = refreshFeedbackInbox;
window.setMusicVolumeSetting = setMusicVolumeSetting;
window.setSfxVolumeSetting = setSfxVolumeSetting;
window.toggleShop = toggleShop;
window.openShopMenu = openShopMenu;
window.closeShopMenu = closeShopMenu;
window.openShopUpgradeMenu = openShopUpgradeMenu;
window.closeShopUpgradeMenu = closeShopUpgradeMenu;
window.confirmShopUpgrade = confirmShopUpgrade;
window.setShopUpgradeAmount = setShopUpgradeAmount;
window.buyUpgrade = buyUpgrade;
window.refreshAuthTokenFromStorage = refreshAuthTokenFromStorage;
window.authFetch = authFetch;
window.showAuthScreen = showAuthScreen;
window.repairUiState = repairUiState;
window.getGameAuthToken = () => authToken;
window.hideStartMenu = hideStartMenu;



function loop() {
  if (typeof tickProFrame === "function") tickProFrame();

  if (gameRunning && !paused && !(typeof shouldSkipGameplayUpdate === "function" && shouldSkipGameplayUpdate())) {
    update();
  }

  if (
    gameRunning ||
    deathSequence?.active ||
    isStartMenuVisible() ||
    isGameOverVisible() ||
    isTutorialVisible() ||
    (authToken && !isNicknameScreenVisible())
  ) {
    draw();
  }

  animationFrameId = requestAnimationFrame(loop);
}

function ensureRenderLoop() {
  if (!c || !ctx || animationFrameId) return;
  animationFrameId = requestAnimationFrame(loop);
}



if (c) {

  c.addEventListener("contextmenu", (e) => e.preventDefault());

  function aimFromClient(clientX, clientY) {
    const view = clientToView(clientX, clientY);
    const world = screenToWorld(view.x, view.y);
    mouseTarget.x = world.x;
    mouseTarget.y = world.y;
    return world;
  }

  function tryShootAtTarget() {
    if (!canPlayerShoot()) return false;
    if (player.shootCooldown > 0) return false;
    shootAt(mouseTarget.x, mouseTarget.y);
    player.shootCooldown = getShootCooldown();
    return true;
  }

  c.addEventListener("click", shoot);

  c.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    resumeAudio();
    if (!canPlayerShoot()) return;

    if (typeof c.setPointerCapture === "function") {
      try {
        c.setPointerCapture(e.pointerId);
      } catch (error) {
        // Ignore capture failures on unsupported browsers.
      }
    }

    aimFromClient(e.clientX, e.clientY);
    isMouseDown = true;
    tryShootAtTarget();
  });

  c.addEventListener("pointermove", (e) => {
    if (!isMouseDown && e.buttons !== 1) return;
    aimFromClient(e.clientX, e.clientY);
  });

  c.addEventListener("pointerup", (e) => {
    if (typeof c.hasPointerCapture === "function" && c.hasPointerCapture(e.pointerId)) {
      c.releasePointerCapture(e.pointerId);
    }
    isMouseDown = false;
  });

  c.addEventListener("pointercancel", () => {
    isMouseDown = false;
  });

  c.addEventListener("mousemove", (e) => {
    aimFromClient(e.clientX, e.clientY);
  });

}



window.addEventListener("keydown", (e) => {

  keys[e.key.toLowerCase()] = true;

  if (["1", "2", "3", "4"].includes(e.key)) {
    handleWeaponHotkey(e.key);
  }

  if (e.key.toLowerCase() === "r" && !e.repeat) {
    throwBomb();
  }

  if (e.key.toLowerCase() === "t" && !e.repeat) {
    throwMolotov();
  }

});

window.addEventListener("keyup", (e) => {

  keys[e.key.toLowerCase()] = false;

});



if (playerNameInput) {
  playerNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAuth();
  });
}

if (playerPasswordInput) {
  playerPasswordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAuth();
  });
}

window.addEventListener("beforeunload", () => {
  saveProgress({ forceServer: true, quiet: true });
});



window.submitNickname = submitNickname;
window.submitAuth = submitAuth;
window.setAuthMode = setAuthMode;
window.logoutAccount = logoutAccount;
window.beginRun = beginRun;
window.returnToMainMenu = returnToMainMenu;
window.goToMainMenuFromGameOver = goToMainMenuFromGameOver;
window.openTutorial = openTutorial;
window.nextTutorialStep = nextTutorialStep;
window.skipTutorial = skipTutorial;
window.selectWeapon = selectWeapon;
window.unlockWeapon = unlockWeapon;
window.openWeaponUpgradeMenu = openWeaponUpgradeMenu;
window.startGame = beginRun;
window.restart = restart;
window.tryBonusOffer = tryBonusOffer;
window.applyRuntimeConfigFromCommunity = applyRuntimeConfigFromCommunity;
window.refreshCommunityPanel = refreshCommunityPanel;
window.scheduleLeaderboardRefresh = scheduleLeaderboardRefresh;



async function init() {
  loadSettings();
  applyAudioSettings();
  renderCommunityPanel();
  await refreshCommunityPanel();
  refreshLeaderboard();
  setInterval(refreshLeaderboard, 20000);
  setInterval(refreshCommunityPanel, 60000);

  document.querySelectorAll("#shop-main-modal .shop-buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openShopUpgradeMenu(btn.dataset.upgrade);
    });
  });

  const weaponShopList = document.getElementById("weapon-shop-list");
  if (weaponShopList) {
    weaponShopList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-weapon-action]");
      if (!button || button.disabled) return;

      const weaponId = button.dataset.weaponId;
      const action = button.dataset.weaponAction;
      if (!weaponId || !action) return;

      if (action === "equip") selectWeapon(weaponId);
      else if (action === "upgrade") openWeaponUpgradeMenu(weaponId);
      else if (action === "buy") unlockWeapon(weaponId);
    });
  }

  const shopMainModal = document.getElementById("shop-main-modal");
  if (shopMainModal) {
    shopMainModal.addEventListener("click", (event) => {
      if (event.target === shopMainModal) closeShopMenu();
    });
  }

  const shopSlider = document.getElementById("shop-upgrade-slider");
  if (shopSlider) {
    shopSlider.addEventListener("input", updateShopUpgradeMenuUI);
  }

  const shopModal = document.getElementById("shop-upgrade-modal");
  if (shopModal) {
    shopModal.addEventListener("click", (event) => {
      if (event.target === shopModal) closeShopUpgradeMenu();
    });
  }

  const achievementsModal = document.getElementById("achievements-modal");
  if (achievementsModal) {
    achievementsModal.addEventListener("click", (event) => {
      if (event.target === achievementsModal) closeAchievementsMenu();
    });
  }

  const friendsModal = document.getElementById("friends-modal");
  if (friendsModal) {
    friendsModal.addEventListener("click", (event) => {
      if (event.target === friendsModal && typeof closeFriendsMenu === "function") {
        closeFriendsMenu();
      }
    });
  }

  const dailyModal = document.getElementById("daily-challenges-modal");
  if (dailyModal) {
    dailyModal.addEventListener("click", (event) => {
      if (event.target === dailyModal && typeof closeDailyChallengesMenu === "function") {
        closeDailyChallengesMenu();
      }
    });
  }

  const settingsModal = document.getElementById("settings-modal");
  if (settingsModal) {
    settingsModal.addEventListener("click", (event) => {
      if (event.target === settingsModal) closeSettingsMenu();
    });
  }

  const feedbackModal = document.getElementById("feedback-modal");
  if (feedbackModal) {
    feedbackModal.addEventListener("click", (event) => {
      if (event.target === feedbackModal) closeFeedbackMenu();
    });
  }

  const feedbackInboxModal = document.getElementById("feedback-inbox-modal");
  if (feedbackInboxModal) {
    feedbackInboxModal.addEventListener("click", (event) => {
      if (event.target === feedbackInboxModal) closeFeedbackInboxMenu();
    });
  }

  const adminModal = document.getElementById("admin-modal");
  if (adminModal && !adminModal.dataset.backdropBound) {
    adminModal.dataset.backdropBound = "1";
  }

  const musicSlider = document.getElementById("settings-music-volume");
  if (musicSlider) {
    musicSlider.addEventListener("input", (event) => {
      setMusicVolumeSetting(event.target.value);
    });
  }

  const sfxSlider = document.getElementById("settings-sfx-volume");
  if (sfxSlider) {
    sfxSlider.addEventListener("input", (event) => {
      setSfxVolumeSetting(event.target.value);
    });
  }

  updateAchievementsUI();
  updateMonthlyAchievementHUD();

  document.addEventListener("keydown", (event) => {
    if (isTutorialVisible()) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        nextTutorialStep();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        skipTutorial();
        return;
      }
    }

    if (event.key !== "Escape") return;

    const achievementsModal = document.getElementById("achievements-modal");
    if (achievementsModal?.classList.contains("open")) {
      event.preventDefault();
      closeAchievementsMenu();
      return;
    }

    const settingsModalEl = document.getElementById("settings-modal");
    if (settingsModalEl?.classList.contains("open")) {
      event.preventDefault();
      closeSettingsMenu();
      return;
    }

    const feedbackModalEl = document.getElementById("feedback-modal");
    if (feedbackModalEl?.classList.contains("open")) {
      event.preventDefault();
      closeFeedbackMenu();
      return;
    }

    const feedbackInboxModalEl = document.getElementById("feedback-inbox-modal");
    if (feedbackInboxModalEl?.classList.contains("open")) {
      event.preventDefault();
      closeFeedbackInboxMenu();
      return;
    }

    const adminModalEl = document.getElementById("admin-modal");
    if (adminModalEl?.classList.contains("open")) {
      event.preventDefault();
      if (typeof closeAdminPanel === "function") closeAdminPanel();
      return;
    }

    if (shopUpgradeType || shopUpgradeWeaponId) {
      event.preventDefault();
      closeShopUpgradeMenu();
      return;
    }

    const shopMainModal = document.getElementById("shop-main-modal");
    if (shopMainModal?.classList.contains("open")) {
      event.preventDefault();
      closeShopMenu();
      return;
    }

    if (toggleGamePause()) {
      event.preventDefault();
    }
  });

  try {
  if (await tryRestoreSession()) {
    hideNicknameScreen();
    const saveResult = await loadSave();
    if (authToken && !saveResult?.sessionExpired) {
      await refreshAccountAccess();
      applyArenaTheme();
      updateUI();
      updateAchievementsUI();
      updateMonthlyAchievementHUD();
      refreshLeaderboard();
    }
    enterMainMenuFlow();
    repairUiState();
  } else {
    refreshAuthTokenFromStorage();
    if (authToken) {
      hideNicknameScreen();
      const saveResult = await loadSave();
      if (authToken && !saveResult?.sessionExpired) {
        await refreshAccountAccess();
        applyArenaTheme();
        updateUI();
        updateAchievementsUI();
        updateMonthlyAchievementHUD();
        refreshLeaderboard();
      }
      enterMainMenuFlow();
      repairUiState();
    } else {
      hideCenterHud();
      applyArenaTheme();
      updateUI();
      refreshLeaderboard();
      showAuthScreen("login");
    }
  }
  } finally {
    window.gameUiReady = true;
    repairUiState();
    syncAuthSidePanels();
    if (!window.__repairUiInterval) {
      window.__repairUiInterval = setInterval(repairUiState, 2000);
    }
  }
}



init();


