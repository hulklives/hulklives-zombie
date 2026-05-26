import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "public/images/zombies/chibi");
const files = ["chibi-green.png", "chibi-teal.png", "chibi-pink.png"];

function removeBlackBackdrop(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 28 && g < 28 && b < 28) {
      data[i + 3] = 0;
    }
  }
}

for (const file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing ${filePath}`);
    continue;
  }

  const trimmed = await sharp(filePath).ensureAlpha().trim({ threshold: 18 }).toBuffer();
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeBlackBackdrop(data);
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .png({ compressionLevel: 9 })
    .toFile(filePath);

  console.log(`Processed ${file} (${info.width}x${info.height})`);
}
