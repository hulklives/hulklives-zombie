import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "images");

const playerMoveDir = path.join(
  root,
  "public/images/sources/survivor/Top_Down_Survivor/handgun/move"
);
const playerIdleDir = path.join(
  root,
  "public/images/sources/survivor/Top_Down_Survivor/handgun/idle"
);
const zombieMoveDir = path.join(root, "public/images/sources/zombie/export");
const zombieIdleDir = zombieMoveDir;

function sortedFrames(dir, prefix) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".png"))
    .sort((a, b) => {
      const ai = Number(a.match(/_(\d+)\.png$/)?.[1] ?? 0);
      const bi = Number(b.match(/_(\d+)\.png$/)?.[1] ?? 0);
      return ai - bi;
    })
    .map((name) => path.join(dir, name));
}

async function buildSheet(files, outName) {
  const meta = await sharp(files[0]).metadata();
  const frameWidth = meta.width;
  const frameHeight = meta.height;
  const composites = files.map((file, index) => ({
    input: file,
    left: index * frameWidth,
    top: 0
  }));

  const outPath = path.join(outDir, outName);
  await sharp({
    create: {
      width: frameWidth * files.length,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  return { outPath, frameWidth, frameHeight, frameCount: files.length };
}

const playerMove = await buildSheet(
  sortedFrames(playerMoveDir, "survivor-move_handgun_"),
  "player-move-sheet.png"
);
const playerIdle = await buildSheet(
  sortedFrames(playerIdleDir, "survivor-idle_handgun_"),
  "player-idle-sheet.png"
);
const zombieMove = await buildSheet(
  sortedFrames(zombieMoveDir, "skeleton-move_"),
  "zombie-move-sheet.png"
);
const zombieIdle = await buildSheet(
  sortedFrames(zombieIdleDir, "skeleton-idle_"),
  "zombie-idle-sheet.png"
);

const manifest = {
  player: {
    move: playerMove,
    idle: playerIdle
  },
  zombie: {
    move: zombieMove,
    idle: zombieIdle
  },
  credit: "Riley Gombart — OpenGameArt.org (CC-BY 3.0)"
};

fs.writeFileSync(
  path.join(outDir, "sprites-manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log(JSON.stringify(manifest, null, 2));
console.log("Run: node scripts/patch-player-sprites.mjs");
