import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "..", "public", "images");

const OUTLINE = "#101010";
const SKIN = "#D4A067";
const SKIN_HI = "#E8B878";
const SKIN_LO = "#A87245";

function svgWrap(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

const HANDS = {
  "hand-grip-top": {
    width: 36,
    height: 24,
    anchorX: 18,
    anchorY: 16,
    draw: () => `
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${SKIN_HI}"/>
          <stop offset="100%" stop-color="${SKIN_LO}"/>
        </linearGradient>
      </defs>
      <path d="M2 10 C10 3 26 3 34 10 L34 17 C26 23 10 23 2 17 Z" fill="url(#skin)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M7 11 H29" stroke="${OUTLINE}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
      <path d="M8 15 H28" stroke="${OUTLINE}" stroke-width="1.3" stroke-linecap="round" opacity="0.35"/>
    `
  },
  "hand-grip-bottom": {
    width: 36,
    height: 24,
    anchorX: 18,
    anchorY: 8,
    draw: () => `
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${SKIN_HI}"/>
          <stop offset="100%" stop-color="${SKIN_LO}"/>
        </linearGradient>
      </defs>
      <path d="M2 7 C10 1 26 1 34 7 L34 14 C26 22 10 22 2 14 Z" fill="url(#skin)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M7 8 H29" stroke="${OUTLINE}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
      <path d="M8 12 H28" stroke="${OUTLINE}" stroke-width="1.3" stroke-linecap="round" opacity="0.35"/>
    `
  },
  "hand-grip-pistol": {
    width: 26,
    height: 28,
    anchorX: 13,
    anchorY: 14,
    draw: () => `
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${SKIN_HI}"/>
          <stop offset="100%" stop-color="${SKIN_LO}"/>
        </linearGradient>
      </defs>
      <path d="M4 5 C12 1 22 5 22 13 L20 23 C13 27 7 24 4 16 Z" fill="url(#skin)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    `
  }
};

const manifest = {};

for (const [name, spec] of Object.entries(HANDS)) {
  const svg = svgWrap(spec.width, spec.height, spec.draw());
  const outPath = path.join(imagesDir, `${name}.png`);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  manifest[name] = {
    path: `images/${name}.png`,
    width: spec.width,
    height: spec.height,
    anchorX: spec.anchorX,
    anchorY: spec.anchorY
  };
  console.log("Built", name);
}

fs.writeFileSync(path.join(imagesDir, "hands-manifest.json"), JSON.stringify(manifest, null, 2));
