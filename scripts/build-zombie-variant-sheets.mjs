import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, "assets/zombie-sources");
const outDir = path.join(root, "public/images/zombies");

const FRAME_SIZE = 640;
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

function removeBackdrop(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const darkNavy = r < 32 && g < 36 && b < 48;
    if (darkNavy) {
      data[i + 3] = 0;
    }
  }
}

async function loadPreparedSource(variantId) {
  const candidates = [
    path.join(root, "assets", `zombie-topdown-${variantId}.png`),
    path.join(sourceDir, `zombie-${variantId}.png`),
    path.join(root, "assets", `zombie-source-${variantId}.png`)
  ];

  const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!sourcePath) {
    throw new Error(`Missing source image for ${variantId}`);
  }

  const trimmed = await sharp(sourcePath).ensureAlpha().trim({ threshold: 14 }).toBuffer();
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeBackdrop(data);

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .png()
    .toBuffer();
}

async function renderFrame(sourceBuffer, keyframe, variantId) {
  const baseMax =
    variantId === "boss" ? 0.5 : variantId === "tank" ? 0.46 : variantId === "golden" ? 0.44 : 0.42;
  const maxBox = FRAME_SIZE - 28;
  let resized = await sharp(sourceBuffer)
    .resize({
      width: maxBox,
      height: Math.round(FRAME_SIZE * baseMax * keyframe.scale),
      fit: "inside",
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3
    })
    .toBuffer();

  let placed = await sharp(resized).metadata();
  if (placed.width > maxBox || placed.height > maxBox) {
    resized = await sharp(resized)
      .resize({
        width: maxBox,
        height: maxBox,
        fit: "inside",
        kernel: sharp.kernel.lanczos3
      })
      .toBuffer();
    placed = await sharp(resized).metadata();
  }

  const left = Math.max(0, Math.round((FRAME_SIZE - placed.width) / 2));
  const top = Math.max(0, Math.round((FRAME_SIZE - placed.height) / 2 + keyframe.dy));

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

async function buildSheet(sourceBuffer, frames, outPath, variantId) {
  const rendered = [];
  for (const keyframe of frames) {
    rendered.push(await renderFrame(sourceBuffer, keyframe, variantId));
  }

  await sharp({
    create: {
      width: FRAME_SIZE * FRAME_COUNT,
      height: FRAME_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
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
    const topdown = path.join(root, "assets", `zombie-topdown-${variantId}.png`);
    const target = path.join(sourceDir, `zombie-${variantId}.png`);
    if (fs.existsSync(topdown)) {
      fs.copyFileSync(topdown, target);
    }
  }

  const manifest = {};

  for (const variantId of VARIANTS) {
    const sourceBuffer = await loadPreparedSource(variantId);
    const idlePath = path.join(outDir, `zombie-${variantId}-idle-sheet.png`);
    const movePath = path.join(outDir, `zombie-${variantId}-move-sheet.png`);

    await buildSheet(sourceBuffer, IDLE_FRAMES, idlePath, variantId);
    await buildSheet(sourceBuffer, MOVE_FRAMES, movePath, variantId);

    const sample = await sharp(idlePath)
      .extract({ left: 0, top: 0, width: FRAME_SIZE, height: FRAME_SIZE })
      .ensureAlpha()
      .raw()
      .toBuffer();
    let opaque = 0;
    for (let i = 3; i < sample.length; i += 4) {
      if (sample[i] > 12) opaque += 1;
    }
    if (opaque < 1200) {
      console.warn(`Warning: ${variantId} idle frame looks mostly empty (${opaque} opaque px)`);
    }

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
      sizeMult: variantId === "boss" ? 1.24 : variantId === "tank" ? 1.18 : variantId === "golden" ? 1.1 : 1.12
    };

    console.log(`Built top-down sheets for ${variantId}`);
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
