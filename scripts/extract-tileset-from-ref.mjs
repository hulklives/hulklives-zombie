import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const refPath = path.join(
  root,
  "public/images/tileset/zombie-apocalypse/Zombie Apocalypse Tileset/Zombie Apocalypse Tileset Reference.png"
);
const outDir = path.join(root, "public/images/tileset/active");

const TILE = 16;

async function extract(left, top, outName) {
  await sharp(refPath)
    .extract({ left, top, width: TILE, height: TILE })
    .png()
    .toFile(path.join(outDir, outName));
}

async function scanBest(label, count, filterFn) {
  const { data, info } = await sharp(refPath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true
  });
  const hits = [];

  for (let ty = 0; ty <= info.height - TILE; ty += TILE) {
    for (let tx = 0; tx <= info.width - TILE; tx += TILE) {
      let score = 0;
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const px = tx + x;
          const py = ty + y;
          const i = (py * info.width + px) * info.channels;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          score += filterFn(r, g, b, a);
        }
      }
      hits.push({ tx, ty, score });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const picked = [];
  for (const hit of hits) {
    if (picked.some((p) => Math.abs(p.tx - hit.tx) < TILE * 2 && Math.abs(p.ty - hit.ty) < TILE * 2)) {
      continue;
    }
    picked.push(hit);
    if (picked.length >= count) break;
  }

  for (let i = 0; i < picked.length; i++) {
    await extract(picked[i].tx, picked[i].ty, `${label}-${i + 1}.png`);
  }

  console.log(
    label,
    picked.map((p) => `${p.tx},${p.ty}`).join(" | ")
  );
}

fs.mkdirSync(outDir, { recursive: true });

await scanBest(
  "grass",
  4,
  (r, g, b, a) => (a > 20 && g > r + 8 && g > b + 8 ? g : 0)
);
await scanBest(
  "tree",
  4,
  (r, g, b, a) => (a > 20 && g > 55 && g > r + 12 && g > b + 10 ? g : 0)
);
await scanBest(
  "road",
  4,
  (r, g, b, a) =>
    a > 20 && r > 45 && g > 45 && b > 45 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18
      ? r + g + b
      : 0
);
await scanBest(
  "path",
  4,
  (r, g, b, a) =>
    a > 20 && r > 70 && g > 45 && b < 55 && r > b + 20 ? r + g : 0
);
await scanBest(
  "fence",
  2,
  (r, g, b, a) =>
    a > 20 && r > 70 && g > 35 && g < 95 && b < 70 && r > g ? r : 0
);

console.log("Extracted colored tiles from reference sheet");
