const fs = require("fs");
const path = require("path");

const ROOT_DIR = __dirname;
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT_DIR, "data");

const STORE_KEYS = ["accounts", "sessions", "saves", "feedback", "admin-config"];

const LEGACY_FILES = {
  accounts: path.join(ROOT_DIR, "accounts.json"),
  sessions: path.join(ROOT_DIR, "sessions.json"),
  saves: path.join(ROOT_DIR, "saves.json"),
  feedback: path.join(ROOT_DIR, "feedback.json"),
  "admin-config": path.join(ROOT_DIR, "admin-config.json")
};

let pool = null;
let mode = "file";
let writeQueue = Promise.resolve();

function usesPostgres() {
  return mode === "postgres";
}

function getStorageMode() {
  return mode;
}

function getDataDir() {
  return DATA_DIR;
}

function shouldUseSsl(databaseUrl) {
  const value = String(databaseUrl || "");
  if (/[?&]sslmode=disable/i.test(value)) return false;
  return !/localhost|127\.0\.0\.1/i.test(value);
}

function readLegacyJson(key) {
  const legacyPath = LEGACY_FILES[key];
  if (!legacyPath || !fs.existsSync(legacyPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(legacyPath, "utf8"));
  } catch (error) {
    console.warn(`Unable to read legacy ${key} data`, error);
    return null;
  }
}

function readFileJson(key, fallback) {
  const filePath = path.join(DATA_DIR, `${key}.json`);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (error) {
    console.warn(`Unable to read ${filePath}`, error);
  }

  const legacy = readLegacyJson(key);
  if (legacy !== null && legacy !== undefined) {
    writeFileJson(key, legacy);
    return legacy;
  }

  return fallback;
}

function writeFileJson(key, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, `${key}.json`);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, filePath);
}

async function readPostgresJson(key, fallback) {
  const result = await pool.query("SELECT value FROM app_data WHERE key = $1", [key]);
  if (!result.rows.length) return fallback;
  return result.rows[0].value;
}

function queuePostgresWrite(key, data) {
  writeQueue = writeQueue
    .then(() =>
      pool.query(
        `INSERT INTO app_data (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, data]
      )
    )
    .catch((error) => {
      console.warn(`Unable to write ${key} to PostgreSQL`, error);
    });
}

async function migrateLegacyIntoPostgres() {
  for (const key of STORE_KEYS) {
    const existing = await readPostgresJson(key, null);
    if (existing !== null && existing !== undefined) continue;

    const legacy = readLegacyJson(key);
    if (legacy === null || legacy === undefined) continue;

    await queuePostgresWriteAndWait(key, legacy);
    console.log(`Imported legacy ${key} into PostgreSQL`);
  }
}

async function queuePostgresWriteAndWait(key, data) {
  await pool.query(
    `INSERT INTO app_data (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE
     SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, data]
  );
}

function migrateLegacyFilesToDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  for (const key of STORE_KEYS) {
    const target = path.join(DATA_DIR, `${key}.json`);
    if (fs.existsSync(target)) continue;

    const legacy = readLegacyJson(key);
    if (legacy === null || legacy === undefined) continue;

    writeFileJson(key, legacy);
    console.log(`Imported legacy ${key} into ${DATA_DIR}`);
  }
}

async function initPersistentStorage() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: shouldUseSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_data (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    mode = "postgres";
    console.log("Persistent storage: PostgreSQL");
    await migrateLegacyIntoPostgres();
    return mode;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  mode = "file";
  migrateLegacyFilesToDataDir();
  console.log(`Persistent storage: JSON files in ${DATA_DIR}`);
  return mode;
}

async function readJson(key, fallback) {
  if (mode === "postgres") {
    return readPostgresJson(key, fallback);
  }
  return readFileJson(key, fallback);
}

function writeJson(key, data) {
  if (mode === "postgres") {
    queuePostgresWrite(key, data);
    return;
  }
  writeFileJson(key, data);
}

module.exports = {
  DATA_DIR,
  getDataDir,
  getStorageMode,
  initPersistentStorage,
  readJson,
  usesPostgres,
  writeJson
};
