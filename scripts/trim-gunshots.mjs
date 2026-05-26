import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "sounds-real-temp", "sounds");
const outDir = path.join(root, "public", "sounds");

// Long, dull tails — heavy softening and rolled-off highs.
const GUNSHOT_MAP = [
  { out: "gun-pistol.wav", src: "cz.wav", seconds: 0.58, gain: 0.5, threshold: 0.012, fadeStart: 0.74 },
  { out: "gun-smg.wav", src: "sks.wav", seconds: 0.34, gain: 0.44, threshold: 0.01, fadeStart: 0.7 },
  { out: "gun-rifle.wav", src: "mosin.wav", seconds: 0.78, gain: 0.48, threshold: 0.008, fadeStart: 0.76 },
  { out: "gun-shotgun.wav", src: "shotty.wav", seconds: 1.02, gain: 0.52, threshold: 0.014, fadeStart: 0.8 }
];

function readWav(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`Not a WAV file: ${filePath}`);
  }

  let offset = 12;
  let audioFormat = 1;
  let channels = 1;
  let sampleRate = 44100;
  let bitsPerSample = 16;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === "fmt ") {
      audioFormat = buffer.readUInt16LE(chunkStart);
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14);
    } else if (chunkId === "data") {
      dataOffset = chunkStart;
      dataSize = chunkSize;
      break;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (!dataOffset || audioFormat !== 1 || bitsPerSample !== 16) {
    throw new Error(`Unsupported WAV format in ${filePath}`);
  }

  const sampleCount = dataSize / (bitsPerSample / 8) / channels;
  const samples = new Float32Array(sampleCount * channels);
  for (let i = 0; i < sampleCount * channels; i += 1) {
    samples[i] = buffer.readInt16LE(dataOffset + i * 2) / 32768;
  }

  return { samples, sampleRate, channels };
}

function writeWav(filePath, samples, sampleRate, channels) {
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

function findAttackStart(samples, threshold) {
  for (let frame = 0; frame < samples.length; frame += 1) {
    if (Math.abs(samples[frame]) >= threshold) {
      return frame;
    }
  }
  return 0;
}

function mixToMono(samples, channels) {
  if (channels === 1) return samples;

  const frames = samples.length / channels;
  const mono = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    let sum = 0;
    for (let ch = 0; ch < channels; ch += 1) {
      sum += samples[frame * channels + ch];
    }
    mono[frame] = sum / channels;
  }
  return mono;
}

function softenSample(samples) {
  const out = new Float32Array(samples.length);
  let smooth = 0;
  const smoothCoeff = 0.99945;

  for (let i = 0; i < samples.length; i += 1) {
    smooth = smooth * smoothCoeff + samples[i] * (1 - smoothCoeff);
    out[i] = samples[i] * 0.5 + smooth * 0.5;
  }

  return out;
}

function dullSample(samples) {
  const out = new Float32Array(samples.length);
  let state = 0;
  const alpha = 0.11;

  for (let i = 0; i < samples.length; i += 1) {
    state += alpha * (samples[i] - state);
    out[i] = state;
  }

  return out;
}

function trimGunshot(inputPath, outputPath, entry) {
  const { samples, sampleRate, channels } = readWav(inputPath);
  const mono = mixToMono(samples, channels);
  const startFrame = findAttackStart(mono, entry.threshold);
  const keepFrames = Math.min(mono.length - startFrame, Math.floor(sampleRate * entry.seconds));
  const slice = mono.subarray(startFrame, startFrame + keepFrames);
  const softened = dullSample(softenSample(slice));
  const trimmed = new Float32Array(keepFrames);

  let peak = 0.0001;
  for (let i = 0; i < keepFrames; i += 1) {
    peak = Math.max(peak, Math.abs(softened[i]));
  }

  const normalize = Math.min(1, 0.76 / peak);
  const softAttackFrames = Math.min(keepFrames, Math.floor(sampleRate * 0.024));

  for (let i = 0; i < keepFrames; i += 1) {
    const fadeStart = keepFrames * entry.fadeStart;
    const tail = i <= fadeStart ? 1 : 1 - (i - fadeStart) / (keepFrames - fadeStart);
    const fade = tail * tail;
    const attack = i < softAttackFrames ? i / softAttackFrames : 1;
    trimmed[i] = softened[i] * normalize * entry.gain * fade * attack;
  }

  writeWav(outputPath, trimmed, sampleRate, 1);
}

fs.mkdirSync(outDir, { recursive: true });

for (const entry of GUNSHOT_MAP) {
  const input = path.join(sourceDir, entry.src);
  const output = path.join(outDir, entry.out);
  trimGunshot(input, output, entry);
  console.log(`Wrote ${entry.out} from ${entry.src}`);
}
