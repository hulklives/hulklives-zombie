import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(
  root,
  "assets/zombie-variants-concept.png"
);
const outDir = path.join(root, "public/images/zombies");

const variants = [
  { id: "normal", left: 0, width: 384 },
  { id: "tank", left: 384, width: 384 },
  { id: "boss", left: 768, width: 384 },
  { id: "golden", left: 1152, width: 384 }
];

async function makeTransparentPng(inputBuffer) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = data;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const greenish = g > 70 && g > r + 18 && g > b + 8;
    const darkFloor = r < 40 && g < 70 && b < 40;
    if (greenish || darkFloor) {
      pixels[i + 3] = 0;
    }
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png();
}

async function main() {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing source image: ${source}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const meta = await sharp(source).metadata();
  const manifest = {};

  for (const variant of variants) {
    const cropped = await sharp(source)
      .extract({
        left: variant.left,
        top: 0,
        width: variant.width,
        height: meta.height
      })
      .toBuffer();

    const trimmed = await sharp(cropped).trim({ threshold: 12 }).toBuffer();
    const transparent = await makeTransparentPng(trimmed);
    const outPath = path.join(outDir, `zombie-${variant.id}.png`);
    await transparent.toFile(outPath);

    const info = await sharp(outPath).metadata();
    manifest[variant.id] = {
      path: `images/zombies/zombie-${variant.id}.png`,
      width: info.width,
      height: info.height
    };
    console.log(`Wrote ${outPath} (${info.width}x${info.height})`);
  }

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
