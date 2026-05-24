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

const picks = {
  "grass-1.png": [368, 112],
  "grass-2.png": [384, 112],
  "grass-3.png": [400, 112],
  "grass-4.png": [416, 112],
  "grass-flower-1.png": [432, 112],
  "grass-flower-2.png": [448, 112],
  "tree-1.png": [520, 96],
  "tree-2.png": [536, 96],
  "tree-3.png": [552, 96],
  "tree-4.png": [568, 96],
  "road-1.png": [464, 0],
  "road-2.png": [480, 0],
  "road-3.png": [496, 0],
  "road-4.png": [512, 0],
  "path-1.png": [432, 32],
  "path-2.png": [448, 32],
  "path-3.png": [464, 32],
  "path-4.png": [480, 32],
  "fence-1.png": [592, 96],
  "fence-2.png": [608, 96]
};

for (const [name, [x, y]] of Object.entries(picks)) {
  await extract(x, y, name);
}

console.log("Manual reference slices written:", Object.keys(picks).length);
