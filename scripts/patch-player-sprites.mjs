import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "..", "public", "images");

const SHEETS = [
  {
    outName: "player-idle-sheet-noweapon.png",
    source: "player-idle-sheet.original.png",
    frameWidth: 253,
    frameHeight: 216,
    frameCount: 20,
    wristX: 146,
    wristY: 112,
    shoulderX: 118,
    shoulderY: 108
  },
  {
    outName: "player-move-sheet-noweapon.png",
    source: "player-move-sheet.original.png",
    frameWidth: 258,
    frameHeight: 220,
    frameCount: 20,
    wristX: 149,
    wristY: 114,
    shoulderX: 120,
    shoulderY: 110
  }
];

const SKIN = { r: 178, g: 132, b: 92, a: 255 };

function getPixel(buf, width, x, y) {
  const i = (y * width + x) * 4;
  return { r: buf[i], g: buf[i + 1], b: buf[i + 2], a: buf[i + 3] };
}

function setPixel(buf, width, x, y, color) {
  if (x < 0 || y < 0) return;
  const i = (y * width + x) * 4;
  buf[i] = color.r;
  buf[i + 1] = color.g;
  buf[i + 2] = color.b;
  buf[i + 3] = color.a;
}

function mix(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
    a: 255
  };
}

function isBackpack(r, g, b) {
  return r > 125 && g > 95 && b > 55 && r >= g && g >= b;
}

function sampleSleeveColors(buf, sheetWidth, frameX, config) {
  const picks = [
    getPixel(buf, sheetWidth, frameX + config.shoulderX, config.shoulderY),
    getPixel(buf, sheetWidth, frameX + config.shoulderX + 8, config.shoulderY - 2),
    getPixel(buf, sheetWidth, frameX + config.shoulderX + 14, config.shoulderY + 1)
  ].filter((px) => px.a > 20 && !isBackpack(px.r, px.g, px.b));

  const dark = picks[0] || { r: 52, g: 58, b: 56, a: 255 };
  const light = picks[picks.length - 1] || { r: 88, g: 96, b: 94, a: 255 };
  return { dark, light };
}

function patchFrame(buf, sheetWidth, frameX, config) {
  const { frameWidth, wristX, wristY, shoulderX, shoulderY } = config;
  const { dark, light } = sampleSleeveColors(buf, sheetWidth, frameX, config);

  // 1) Ta bort pistol + allt framför handleden.
  for (let y = 88; y <= 134; y += 1) {
    for (let localX = wristX - 10; localX < frameWidth - 1; localX += 1) {
      const x = frameX + localX;
      const px = getPixel(buf, sheetWidth, x, y);
      if (px.a < 8) continue;
      if (isBackpack(px.r, px.g, px.b)) continue;

      const inForward = localX >= wristX;
      const inGrip =
        localX >= wristX - 14 &&
        localX <= wristX + 4 &&
        Math.abs(y - wristY) <= 14;
      const isDark = px.r + px.g + px.b < 155;

      if (inForward || (inGrip && isDark)) {
        setPixel(buf, sheetWidth, x, y, { r: 0, g: 0, b: 0, a: 0 });
      }
    }
  }

  // 2) Rita armen från axel till handled.
  const steps = 22;
  for (let s = 0; s <= steps; s += 1) {
    const t = s / steps;
    const x = shoulderX + (wristX - shoulderX - 2) * t;
    const y = shoulderY + (wristY - shoulderY) * t;
    const radius = 7.5 - t * 2.2;
    const color = mix(dark, light, 0.25 + t * 0.55);

    for (let dy = -Math.ceil(radius); dy <= Math.ceil(radius); dy += 1) {
      for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx += 1) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const px = frameX + Math.round(x + dx * 0.65);
        const py = Math.round(y + dy * 0.65);
        const current = getPixel(buf, sheetWidth, px, py);
        if (current.a > 20 && isBackpack(current.r, current.g, current.b)) continue;
        setPixel(buf, sheetWidth, px, py, color);
      }
    }
  }

  // 3) Liten hand vid handleden (tom, ingen pistol).
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      if (dx * dx + dy * dy > 16) continue;
      setPixel(buf, sheetWidth, frameX + wristX + dx, wristY + dy, SKIN);
    }
  }
}

async function patchSheet(config) {
  const sourcePath = path.join(imagesDir, config.source);
  const outPath = path.join(imagesDir, config.outName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Saknar källfil: ${sourcePath}`);
  }

  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buf = Buffer.from(data);

  for (let frame = 0; frame < config.frameCount; frame += 1) {
    patchFrame(buf, info.width, frame * config.frameWidth, config);
  }

  await sharp(buf, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outPath);

  let dark = 0;
  for (let y = 92; y <= 130; y += 1) {
    for (let lx = config.wristX - 8; lx < config.frameWidth - 4; lx += 1) {
      const i = (y * info.width + lx) * 4;
      if (buf[i + 3] < 20) continue;
      if (buf[i] + buf[i + 1] + buf[i + 2] < 75) dark += 1;
    }
  }
  console.log(`${config.outName}: klart (mörka pixlar kvar = ${dark})`);
}

for (const sheet of SHEETS) {
  await patchSheet(sheet);
}

// Enstaka preview-bild (frame 0) för användaren.
await sharp(path.join(imagesDir, "player-idle-sheet-noweapon.png"))
  .extract({ left: 0, top: 0, width: 253, height: 216 })
  .png()
  .toFile(path.join(imagesDir, "player-no-weapon.png"));

console.log("Nya bilder sparade: player-idle-sheet-noweapon.png, player-move-sheet-noweapon.png, player-no-weapon.png");
