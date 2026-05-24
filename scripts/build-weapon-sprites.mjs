import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "..", "public", "images");

const OUTLINE = "#0a0a0a";
const METAL = "#3a3f44";
const METAL_HI = "#5c646c";
const METAL_LO = "#25292d";
const GRIP = "#1e2224";
const WOOD = "#5a4030";
const WOOD_HI = "#7a5840";
const CYAN = "#5ee8ff";
const RED = "#c62828";
const SKIN = "#D4A067";
const SKIN_HI = "#E8B878";
const SKIN_LO = "#A87245";

function bakedHands(primaryX, supportX, y = 36) {
  return `
      <rect x="${primaryX}" y="${y - 2}" width="20" height="7" rx="2" fill="${SKIN_HI}" ${stroke(2)}/>
      <rect x="${supportX}" y="${y + 1}" width="20" height="7" rx="2" fill="${SKIN}" ${stroke(2)}/>
  `;
}

function bakedPistolHand(x, y) {
  return `<rect x="${x}" y="${y}" width="11" height="13" rx="2.5" fill="${SKIN}" ${stroke(2)}/>`;
}

function svgWrap(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${body}
</svg>`;
}

function weaponDefs() {
  return `
  <defs>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${METAL_HI}"/>
      <stop offset="55%" stop-color="${METAL}"/>
      <stop offset="100%" stop-color="${METAL_LO}"/>
    </linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${WOOD_HI}"/>
      <stop offset="100%" stop-color="${WOOD}"/>
    </linearGradient>
  </defs>`;
}

function stroke(width = 3.5, extra = "") {
  return `stroke="${OUTLINE}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${extra ? ` ${extra}` : ""}`;
}

/** Top-down, barrel points +X. Grip anchor at (0,0) in weapon-local space after export trim. */
const WEAPONS = {
  pistol: {
    width: 120,
    height: 56,
    gripX: 34,
    gripY: 28,
    muzzleX: 108,
    muzzleY: 28,
    draw: () => `
      ${weaponDefs()}
      <rect x="18" y="22" width="34" height="18" rx="4" fill="url(#metal)" ${stroke("")}/>
      <rect x="52" y="24" width="52" height="8" rx="2" fill="url(#metal)" ${stroke("")}/>
      <rect x="96" y="25" width="12" height="6" rx="1" fill="${METAL_LO}" ${stroke("")}/>
      <rect x="24" y="30" width="10" height="14" rx="2" fill="${GRIP}" ${stroke("")}/>
      <rect x="34" y="34" width="8" height="10" rx="1.5" fill="${GRIP}" ${stroke("")}/>
      ${bakedPistolHand(30, 32)}
    `
  },
  smg: {
    width: 176,
    height: 78,
    gripX: 56,
    gripY: 38,
    muzzleX: 164,
    muzzleY: 36,
    draw: () => `
      ${weaponDefs()}
      <rect x="6" y="30" width="24" height="14" rx="3" fill="url(#metal)" ${stroke("")}/>
      <rect x="28" y="27" width="62" height="20" rx="3" fill="url(#metal)" ${stroke("")}/>
      <rect x="90" y="28" width="62" height="16" rx="2" fill="url(#metal)" ${stroke("")}/>
      <rect x="146" y="29" width="24" height="12" rx="2" fill="${METAL_LO}" ${stroke("")}/>
      <rect x="166" y="31" width="8" height="8" rx="1" fill="${METAL_LO}" ${stroke(2)}/>
      <rect x="48" y="47" width="16" height="24" rx="2" fill="${GRIP}" ${stroke("")}/>
      <rect x="66" y="49" width="12" height="20" rx="2" fill="${GRIP}" ${stroke("")}/>
      <path d="M78 50 H108 V58 H78 Z" fill="${METAL_LO}" ${stroke("")}/>
      <rect x="52" y="56" width="12" height="16" rx="1.5" fill="${GRIP}" ${stroke("")}/>
      <rect x="34" y="22" width="48" height="6" rx="1" fill="${METAL_LO}" ${stroke(2.5)}/>
      <rect x="38" y="23" width="9" height="4" rx="0.5" fill="${CYAN}" opacity="0.95"/>
      <rect x="49" y="23" width="9" height="4" rx="0.5" fill="${CYAN}" opacity="0.95"/>
      <rect x="60" y="23" width="9" height="4" rx="0.5" fill="${CYAN}" opacity="0.95"/>
      <rect x="71" y="23" width="9" height="4" rx="0.5" fill="${CYAN}" opacity="0.95"/>
      <rect x="54" y="40" width="7" height="3" rx="0.5" fill="${RED}" opacity="0.85"/>
      <rect x="124" y="25" width="4" height="7" rx="0.5" fill="${METAL_HI}" ${stroke(2)}/>
      <rect x="32" y="25" width="3" height="6" rx="0.5" fill="${METAL_HI}" ${stroke(2)}/>
      <rect x="98" y="31" width="18" height="8" rx="1.5" fill="${METAL_HI}" ${stroke(2.5)}/>
      ${bakedHands(50, 86, 35)}
    `
  },
  shotgun: {
    width: 188,
    height: 76,
    gripX: 58,
    gripY: 38,
    muzzleX: 176,
    muzzleY: 36,
    draw: () => `
      ${weaponDefs()}
      <rect x="6" y="30" width="36" height="12" rx="3" fill="url(#wood)" ${stroke("")}/>
      <rect x="42" y="28" width="48" height="16" rx="3" fill="url(#metal)" ${stroke("")}/>
      <rect x="90" y="29" width="72" height="14" rx="2" fill="url(#metal)" ${stroke("")}/>
      <rect x="158" y="30" width="24" height="12" rx="2" fill="${METAL_LO}" ${stroke("")}/>
      <rect x="50" y="44" width="14" height="22" rx="2" fill="${GRIP}" ${stroke("")}/>
      <rect x="68" y="46" width="10" height="18" rx="2" fill="${GRIP}" ${stroke("")}/>
      <rect x="78" y="48" width="34" height="8" rx="2" fill="${METAL_LO}" ${stroke("")}/>
      <rect x="96" y="31" width="18" height="10" rx="2" fill="${METAL_HI}" ${stroke(2.5)}/>
      <rect x="118" y="24" width="4" height="6" rx="0.5" fill="${METAL_HI}" ${stroke(2)}/>
      ${bakedHands(52, 84, 35)}
    `
  },
  rifle: {
    width: 204,
    height: 76,
    gripX: 62,
    gripY: 38,
    muzzleX: 192,
    muzzleY: 36,
    draw: () => `
      ${weaponDefs()}
      <rect x="10" y="30" width="28" height="12" rx="2" fill="url(#metal)" ${stroke("")}/>
      <rect x="38" y="27" width="62" height="18" rx="3" fill="url(#metal)" ${stroke("")}/>
      <rect x="100" y="28" width="78" height="14" rx="2" fill="url(#metal)" ${stroke("")}/>
      <rect x="174" y="29" width="22" height="12" rx="2" fill="${METAL_LO}" ${stroke("")}/>
      <rect x="54" y="45" width="14" height="22" rx="2" fill="${GRIP}" ${stroke("")}/>
      <rect x="72" y="47" width="10" height="18" rx="2" fill="${GRIP}" ${stroke("")}/>
      <rect x="82" y="49" width="36" height="8" rx="2" fill="${METAL_LO}" ${stroke("")}/>
      <rect x="58" y="44" width="10" height="18" rx="1.5" fill="${GRIP}" ${stroke("")}/>
      <rect x="40" y="22" width="52" height="5" rx="1" fill="${METAL_LO}" ${stroke(2.5)}/>
      <rect x="88" y="20" width="10" height="8" rx="2" fill="${METAL}" ${stroke(2.5)}/>
      <circle cx="93" cy="24" r="2" fill="${RED}" opacity="0.9"/>
      <rect x="130" y="24" width="4" height="6" rx="0.5" fill="${METAL_HI}" ${stroke(2)}/>
      ${bakedHands(54, 88, 35)}
    `
  }
};

async function exportWeapon(id, spec) {
  const svg = svgWrap(spec.width, spec.height, spec.draw());
  const outPath = path.join(imagesDir, `weapon-${id}.png`);

  const { data, info } = await sharp(Buffer.from(svg)).png().toBuffer({ resolveWithObject: true });
  await sharp(data).png().toFile(outPath);

  const meta = {
    id,
    path: `images/weapon-${id}.png`,
    width: info.width,
    height: info.height,
    gripX: spec.gripX,
    gripY: spec.gripY,
    muzzleX: spec.muzzleX,
    muzzleY: spec.muzzleY
  };

  return meta;
}

const manifest = {};
for (const [id, spec] of Object.entries(WEAPONS)) {
  manifest[id] = await exportWeapon(id, spec);
  console.log(`weapon-${id}.png`, manifest[id].width, "x", manifest[id].height);
}

const manifestPath = path.join(imagesDir, "weapons-manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log("Wrote", manifestPath);
