import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const imagesDir = path.join(root, "public", "images");

const SOURCE = path.join(imagesDir, "player-custom-noweapon.png");

const FRAME_WIDTH = 280;
const FRAME_HEIGHT = 240;
const FRAME_COUNT = 20;

function dist(c1, c2) {
  return Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b);
}

async function removeBackground(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buf = Buffer.from(data);
  const w = info.width;
  const h = info.height;

  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1]
  ].map(([x, y]) => {
    const i = (y * w + x) * 4;
    return { r: buf[i], g: buf[i + 1], b: buf[i + 2] };
  });

  const bg = {
    r: Math.round(corners.reduce((s, c) => s + c.r, 0) / corners.length),
    g: Math.round(corners.reduce((s, c) => s + c.g, 0) / corners.length),
    b: Math.round(corners.reduce((s, c) => s + c.b, 0) / corners.length)
  };

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const px = { r: buf[i], g: buf[i + 1], b: buf[i + 2] };
      if (dist(px, bg) < 48 || px.r + px.g + px.b < 35) {
        buf[i + 3] = 0;
      }
    }
  }

  return sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

async function buildSheet(outName) {
  const noBg = await removeBackground(inputPath);
  const frame = await sharp(noBg)
    .trim()
    .resize({
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const composites = Array.from({ length: FRAME_COUNT }, (_, index) => ({
    input: frame,
    left: index * FRAME_WIDTH,
    top: 0
  }));

  const outPath = path.join(imagesDir, outName);
  await sharp({
    create: {
      width: FRAME_WIDTH * FRAME_COUNT,
      height: FRAME_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  return outPath;
}

if (!fs.existsSync(SOURCE)) {
  console.error("Saknar källbild:", SOURCE);
  process.exit(1);
}

const inputPath = SOURCE;

const idlePath = await buildSheet("player-idle-sheet-noweapon.png");
const movePath = await buildSheet("player-move-sheet-noweapon.png");

await sharp(inputPath)
  .resize(560, 480, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(path.join(imagesDir, "player-no-weapon.png"));

console.log(
  JSON.stringify(
    {
      idlePath,
      movePath,
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      frameCount: FRAME_COUNT
    },
    null,
    2
  )
);
