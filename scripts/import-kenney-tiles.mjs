import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(root, "../kenney_top-down-shooter-temp/PNG/Tiles");
const outDir = path.join(root, "public/images/tileset/active");

const map = {
  "grass-1.png": "tile_01.png",
  "grass-2.png": "tile_02.png",
  "grass-3.png": "tile_03.png",
  "grass-4.png": "tile_04.png",
  "grass-flower-1.png": "tile_03.png",
  "grass-flower-2.png": "tile_04.png",
  "path-1.png": "tile_05.png",
  "path-2.png": "tile_06.png",
  "path-3.png": "tile_05.png",
  "path-4.png": "tile_06.png",
  "road-1.png": "tile_35.png",
  "road-2.png": "tile_36.png",
  "road-3.png": "tile_37.png",
  "road-4.png": "tile_40.png",
  "tree-1.png": "tile_183.png",
  "tree-2.png": "tile_184.png",
  "tree-3.png": "tile_185.png",
  "tree-4.png": "tile_186.png"
};

if (!fs.existsSync(srcDir)) {
  console.error("Kenney tiles not found at:", srcDir);
  console.error("Extract kenney_top-down-shooter.zip to Desktop/kenney_top-down-shooter-temp first.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

for (const [dest, srcName] of Object.entries(map)) {
  fs.copyFileSync(path.join(srcDir, srcName), path.join(outDir, dest));
}

console.log("Kenney tiles copied:", Object.keys(map).length, "->", outDir);
