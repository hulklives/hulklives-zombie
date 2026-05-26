import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, "assets/zombie-sources");
const outDir = path.join(root, "public/images/zombies");

const FRAME_SIZE = 640;
const FRAME_FOOT_PADDING = 20;
const ZOMBIE_VARIANT_FEET_RATIO = (FRAME_SIZE - FRAME_FOOT_PADDING) / FRAME_SIZE;
const FRAME_COUNT = 8;
const VARIANTS = ["normal", "tank", "boss", "golden"];

const IDLE_FRAMES = [
  { scale: 1.0, dy: 0 },
  { scale: 0.998, dy: 0 },
  { scale: 0.996, dy: 0 },
  { scale: 0.998, dy: 0 },
  { scale: 1.0, dy: 0 },
  { scale: 1.002, dy: 0 },
  { scale: 1.004, dy: 0 },
  { scale: 1.002, dy: 0 }
];

const MOVE_FRAMES = [
  { scale: 1.0, dy: 0 },
  { scale: 0.992, dy: 0 },
  { scale: 1.006, dy: 0 },
  { scale: 0.994, dy: 0 },
  { scale: 1.004, dy: 0 },
  { scale: 0.99, dy: 0 },
  { scale: 1.008, dy: 0 },
  { scale: 0.996, dy: 0 }
];

function removeBackdrop(data, width, height) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const darkNavy = r < 28 && g < 32 && b < 42;
    const greenFloor = g > 70 && g > r + 16 && g > b + 8;
    const darkFloor = r < 45 && g < 75 && b < 45;
    if (darkNavy || greenFloor || darkFloor) {
      data[i + 3] = 0;
    }
  }
}

async function loadPreparedSource(variantId) {
  const candidates = [
    path.join(sourceDir, `zombie-${variantId}.png`),
    path.join(root, "assets", `zombie-source-${variantId}.png`),
    path.join(root, "assets/zombie-variants-concept.png")
  ];

  const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!sourcePath) {
    throw new Error(`Missing source image for ${variantId}`);
  }

  let pipeline = sharp(sourcePath).ensureAlpha();

  if (sourcePath.endsWith("zombie-variants-concept.png")) {
    const leftMap = { normal: 0, tank: 384, boss: 768, golden: 1152 };
    pipeline = pipeline.extract({
      left: leftMap[variantId],
      top: 0,
      width: 384,
      height: 1024
    });
  }

  const trimmed = await pipeline.trim({ threshold: 14 }).toBuffer();
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeBackdrop(data, info.width, info.height);

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();
}

async function renderFrame(sourceBuffer, keyframe) {
  const maxHeight = FRAME_SIZE * 0.72;
  const footY = FRAME_SIZE - FRAME_FOOT_PADDING;
  const targetHeight = Math.round(maxHeight * keyframe.scale);
  const resized = await sharp(sourceBuffer)
    .resize({
      height: targetHeight,
      fit: "inside",
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3
    })
    .toBuffer();

  const placed = await sharp(resized).metadata();
  const left = Math.round((FRAME_SIZE - placed.width) / 2);
  const top = Math.round(footY - placed.height + keyframe.dy);

  return sharp({
    create: {
      width: FRAME_SIZE,
      height: FRAME_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

async function buildSheet(sourceBuffer, frames, outPath) {
  const rendered = [];
  for (const keyframe of frames) {
    rendered.push(await renderFrame(sourceBuffer, keyframe));
  }

  const sheet = sharp({
    create: {
      width: FRAME_SIZE * FRAME_COUNT,
      height: FRAME_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  await sheet
    .composite(
      rendered.map((input, index) => ({
        input,
        left: index * FRAME_SIZE,
        top: 0
      }))
    )
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function main() {
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const variantId of VARIANTS) {
    const generated = path.join(root, "assets", `zombie-source-${variantId}.png`);
    const target = path.join(sourceDir, `zombie-${variantId}.png`);
    if (fs.existsSync(generated)) {
      fs.copyFileSync(generated, target);
    }
  }

  const manifest = {};

  for (const variantId of VARIANTS) {
    const sourceBuffer = await loadPreparedSource(variantId);
    const idlePath = path.join(outDir, `zombie-${variantId}-idle-sheet.png`);
    const movePath = path.join(outDir, `zombie-${variantId}-move-sheet.png`);

    await buildSheet(sourceBuffer, IDLE_FRAMES, idlePath);
    await buildSheet(sourceBuffer, MOVE_FRAMES, movePath);

    manifest[variantId] = {
      idle: {
        path: `images/zombies/zombie-${variantId}-idle-sheet.png`,
        frameCount: FRAME_COUNT,
        frameWidth: FRAME_SIZE,
        frameHeight: FRAME_SIZE
      },
      move: {
        path: `images/zombies/zombie-${variantId}-move-sheet.png`,
        frameCount: FRAME_COUNT,
        frameWidth: FRAME_SIZE,
        frameHeight: FRAME_SIZE
      },
      sizeMult: variantId === "boss" ? 1.28 : variantId === "tank" ? 1.22 : variantId === "golden" ? 1.12 : 1.15
    };

    console.log(`Built animated sheets for ${variantId}`);
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
