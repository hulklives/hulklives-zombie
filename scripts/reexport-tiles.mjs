import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const srcBase = path.join(
  root,
  "public/images/tileset/zombie-apocalypse/Zombie Apocalypse Tileset/Organized separated sprites"
);
const refPath = path.join(
  root,
  "public/images/tileset/zombie-apocalypse/Zombie Apocalypse Tileset/Zombie Apocalypse Tileset Reference.png"
);
const outDir = path.join(root, "public/images/tileset/active");

async function keyBlack(src, outName) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({
    resolveWithObject: true
  });
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 24 && g < 24 && b < 24) data[i + 3] = 0;
  }
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels }
  })
    .png()
    .toFile(path.join(outDir, outName));
}

async function sliceRef(left, top, width, height, outName) {
  await sharp(refPath)
    .extract({ left, top, width, height })
    .png()
    .toFile(path.join(outDir, outName));
}

fs.mkdirSync(outDir, { recursive: true });

// Mark — bruna jord-tiles från paketet (fungerar bra med keyBlack)
await keyBlack(path.join(srcBase, "Terrain Variations/Zombie-Tileset---_0077_Capa-78.png"), "grass-1.png");
await keyBlack(path.join(srcBase, "Terrain Variations/Zombie-Tileset---_0078_Capa-79.png"), "grass-2.png");
await keyBlack(path.join(srcBase, "Terrain Variations/Zombie-Tileset---_0079_Capa-80.png"), "grass-3.png");
await keyBlack(path.join(srcBase, "Terrain Variations/Zombie-Tileset---_0080_Capa-81.png"), "grass-4.png");
await keyBlack(path.join(srcBase, "Terrain Variations/Zombie-Tileset---_0077_Capa-78.png"), "grass-flower-1.png");
await keyBlack(path.join(srcBase, "Terrain Variations/Zombie-Tileset---_0079_Capa-80.png"), "grass-flower-2.png");

// Stigar — färgade tiles från referensbilden
await sliceRef(432, 32, 16, 16, "path-1.png");
await sliceRef(448, 32, 16, 16, "path-2.png");
await sliceRef(464, 32, 16, 16, "path-3.png");
await sliceRef(480, 32, 16, 16, "path-4.png");

// Vägar — asfalt från referensbilden
await sliceRef(416, 240, 16, 16, "road-1.png");
await sliceRef(464, 240, 16, 16, "road-2.png");
await sliceRef(512, 240, 16, 16, "road-3.png");
await sliceRef(480, 240, 16, 16, "road-4.png");

// Träd — små rundade träd från referensbilden
await sliceRef(528, 240, 16, 16, "tree-1.png");
await sliceRef(544, 240, 16, 16, "tree-2.png");
await sliceRef(560, 240, 16, 16, "tree-3.png");
await sliceRef(576, 240, 16, 16, "tree-4.png");

console.log("Tileset assets rebuilt (simple set only)");
