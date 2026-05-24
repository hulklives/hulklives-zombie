import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "..", "public", "images");

const SHEETS = [
  { source: "player-idle-sheet-noweapon.withhands.png", out: "player-idle-sheet-noweapon.png" },
  { source: "player-move-sheet-noweapon.withhands.png", out: "player-move-sheet-noweapon.png" }
];

const FRAME_WIDTH = 280;
const FRAME_HEIGHT = 240;
const FRAME_COUNT = 20;

function isSkin(r, g, b, a) {
  return a > 80 && r > 120 && r < 210 && g > 80 && g < 170 && b > 60 && b < 140 && r > g && g > b;
}

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

function patchFrame(buf, width, frameX) {
  for (let y = 94; y < 170; y += 1) {
    for (let x = 198; x < 272; x += 1) {
      const px = frameX + x;
      const p = getPixel(buf, width, px, y);
      if (p.a === 0) continue;
      if (isSkin(p.r, p.g, p.b, p.a) || x >= 204) {
        setPixel(buf, width, px, y, { r: 0, g: 0, b: 0, a: 0 });
      }
    }
  }
}

for (const sheet of SHEETS) {
  const sourcePath = path.join(imagesDir, sheet.source);
  if (!fs.existsSync(sourcePath)) {
    console.error("Missing", sourcePath);
    process.exit(1);
  }

  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buf = Buffer.from(data);

  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    patchFrame(buf, info.width, frame * FRAME_WIDTH);
  }

  const outPath = path.join(imagesDir, sheet.out);
  await sharp(buf, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(outPath);
  console.log("Built", outPath);
}

await sharp(path.join(imagesDir, "player-idle-sheet-noweapon.png"))
  .extract({ left: 0, top: 0, width: FRAME_WIDTH, height: FRAME_HEIGHT })
  .resize(560, 480, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(path.join(imagesDir, "player-no-weapon.png"));

console.log("Updated player-no-weapon.png preview");
