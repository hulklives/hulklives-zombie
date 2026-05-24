import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "..", "public", "images");

const SHEETS = [
  { inName: "player-idle-sheet-noweapon.png", outName: "player-idle-sheet-noweapon.png" },
  { inName: "player-move-sheet-noweapon.png", outName: "player-move-sheet-noweapon.png" }
];

const FRAME_WIDTH = 280;
const FRAME_HEIGHT = 240;
const FRAME_COUNT = 20;

function isSkin(r, g, b, a) {
  return a > 80 && r > 120 && r < 210 && g > 80 && g < 170 && b > 60 && b < 140 && r > g && g > b;
}

function sampleSleeve(buf, width, x, y) {
  const picks = [];
  for (let dy = -18; dy <= -6; dy += 1) {
    for (let dx = -6; dx <= 6; dx += 2) {
      const px = x + dx;
      const py = y + dy;
      if (px < 0 || py < 0) continue;
      const i = (py * width + px) * 4;
      const r = buf[i];
      const g = buf[i + 1];
      const b = buf[i + 2];
      const a = buf[i + 3];
      if (a > 80 && !isSkin(r, g, b, a) && g > 45 && g >= b) {
        picks.push({ r, g, b, a: 255 });
      }
    }
  }
  if (!picks.length) return { r: 52, g: 72, b: 64, a: 255 };
  return {
    r: Math.round(picks.reduce((s, p) => s + p.r, 0) / picks.length),
    g: Math.round(picks.reduce((s, p) => s + p.g, 0) / picks.length),
    b: Math.round(picks.reduce((s, p) => s + p.b, 0) / picks.length),
    a: 255
  };
}

function patchFrame(buf, width, frameX) {
  for (let y = 88; y < 176; y += 1) {
    for (let x = 198; x < 272; x += 1) {
      const px = frameX + x;
      const i = (y * width + px) * 4;
      const r = buf[i];
      const g = buf[i + 1];
      const b = buf[i + 2];
      const a = buf[i + 3];
      if (!isSkin(r, g, b, a)) continue;
      const sleeve = sampleSleeve(buf, width, px, y);
      buf[i] = sleeve.r;
      buf[i + 1] = sleeve.g;
      buf[i + 2] = sleeve.b;
      buf[i + 3] = sleeve.a;
    }
  }
}

for (const sheet of SHEETS) {
  const inPath = path.join(imagesDir, sheet.inName);
  const backupPath = path.join(imagesDir, sheet.inName.replace(".png", ".withhands.png"));
  const sourcePath = fs.existsSync(backupPath) ? backupPath : inPath;
  if (!fs.existsSync(backupPath) && fs.existsSync(inPath)) {
    fs.copyFileSync(inPath, backupPath);
    console.log("Backup:", backupPath);
  }

  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buf = Buffer.from(data);

  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    patchFrame(buf, info.width, frame * FRAME_WIDTH);
  }

  const outPath = path.join(imagesDir, sheet.outName);
  await sharp(buf, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(outPath);
  console.log("Patched:", outPath);
}
