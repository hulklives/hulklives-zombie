import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const srcBase = path.join(
  root,
  "public/images/tileset/zombie-apocalypse/Zombie Apocalypse Tileset/Organized separated sprites"
);
const outDir = path.join(root, "public/images/tileset/active");
const refPath = path.join(
  root,
  "public/images/tileset/zombie-apocalypse/Zombie Apocalypse Tileset/Zombie Apocalypse Tileset Reference.png"
);

fs.mkdirSync(outDir, { recursive: true });

function isKey(r, g, b) {
  if (r <= 28 && g <= 28 && b <= 28) return true;
  if (r <= 12 && g >= 18 && g <= 48 && b >= 210) return true;
  return false;
}

async function exportKeyed(srcRelative, outName) {
  const src = path.join(srcBase, srcRelative);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({
    resolveWithObject: true
  });

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isKey(r, g, b)) data[i + 3] = 0;
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels }
  })
    .png()
    .toFile(path.join(outDir, outName));
}

async function sliceRef(sx, sy, sw, sh, outName) {
  await sharp(refPath)
    .extract({ left: sx, top: sy, width: sw, height: sh })
    .png()
    .toFile(path.join(outDir, outName));
}

async function buildGrassSheet() {
  const tile = 16;
  const cols = 4;
  const rows = 1;
  const composites = [];

  for (let i = 0; i < cols; i++) {
    composites.push({
      input: path.join(outDir, `grass-${i + 1}.png`),
      left: i * tile,
      top: 0
    });
  }

  await sharp({
    create: {
      width: tile * cols,
      height: tile * rows,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toFile(path.join(outDir, "grass-sheet.png"));
}

const jobs = [
  exportKeyed("Terrain Variations/Zombie-Tileset---_0077_Capa-78.png", "grass-1.png"),
  exportKeyed("Terrain Variations/Zombie-Tileset---_0078_Capa-79.png", "grass-2.png"),
  exportKeyed("Terrain Variations/Zombie-Tileset---_0079_Capa-80.png", "grass-3.png"),
  exportKeyed("Terrain Variations/Zombie-Tileset---_0080_Capa-81.png", "grass-4.png"),
  exportKeyed("Grass with Flowers/Zombie-Tileset---_0117_Capa-118.png", "grass-flower-1.png"),
  exportKeyed("Grass with Flowers/Zombie-Tileset---_0217_Capa-218.png", "grass-flower-2.png"),
  exportKeyed("Modular Terrain Path/Zombie-Tileset---_0068_Capa-69.png", "path-1.png"),
  exportKeyed("Modular Terrain Path/Zombie-Tileset---_0069_Capa-70.png", "path-2.png"),
  exportKeyed("Modular Terrain Path/Zombie-Tileset---_0070_Capa-71.png", "path-3.png"),
  exportKeyed("Modular Terrain Path/Zombie-Tileset---_0071_Capa-72.png", "path-4.png"),
  exportKeyed("Modular Road/Zombie-Tileset---_0045_Capa-46.png", "road-1.png"),
  exportKeyed("Modular Road/Zombie-Tileset---_0046_Capa-47.png", "road-2.png"),
  exportKeyed("Modular Road/Zombie-Tileset---_0047_Capa-48.png", "road-3.png"),
  exportKeyed("Modular Road/Zombie-Tileset---_0048_Capa-49.png", "road-4.png"),
  exportKeyed("Modular Fences/Zombie-Tileset---_0126_Capa-127.png", "fence-1.png"),
  exportKeyed("Modular Fences/Zombie-Tileset---_0127_Capa-128.png", "fence-2.png"),
  sliceRef(520, 72, 16, 16, "tree-1.png"),
  sliceRef(536, 72, 16, 16, "tree-2.png"),
  sliceRef(552, 72, 16, 16, "tree-3.png"),
  sliceRef(568, 72, 16, 16, "tree-4.png"),
  sliceRef(488, 88, 16, 16, "bush-1.png"),
  sliceRef(504, 88, 16, 16, "bush-2.png")
];

for (const job of jobs) await job;
await buildGrassSheet();

console.log("Fixed tileset assets in", outDir);
