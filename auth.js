const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { normalizeNickname, validateNickname } = require("./save-validation");

const accountsFile = path.join(__dirname, "accounts.json");
const sessionsFile = path.join(__dirname, "sessions.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 72;

let accounts = {};
let sessions = {};

function loadJson(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8") || "{}") || {};
    }
  } catch (error) {
    console.warn(`Unable to read ${filePath}`, error);
  }
  return {};
}

function saveJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn(`Unable to write ${filePath}`, error);
  }
}

function loadAuthStore() {
  accounts = loadJson(accountsFile);
  sessions = loadJson(sessionsFile);
  purgeExpiredSessions();
}

function saveAccounts() {
  saveJson(accountsFile, accounts);
}

function saveSessions() {
  saveJson(sessionsFile, sessions);
}

function usernameKey(username) {
  return normalizeNickname(username).toLowerCase();
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Lösenord måste vara minst ${MIN_PASSWORD_LENGTH} tecken.`;
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Lösenord får max vara ${MAX_PASSWORD_LENGTH} tecken.`;
  }
  return "";
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, account) {
  if (!account?.passwordHash || !account?.salt) return false;
  const hash = crypto.scryptSync(password, account.salt, 64).toString("hex");
  if (hash.length !== account.passwordHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(account.passwordHash, "hex"));
}

function createSessionToken(usernameKeyValue) {
  purgeExpiredSessions();
  const token = crypto.randomBytes(32).toString("hex");
  sessions[token] = {
    usernameKey: usernameKeyValue,
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  saveSessions();
  return token;
}

function purgeExpiredSessions() {
  const now = Date.now();
  let changed = false;
  for (const [token, session] of Object.entries(sessions)) {
    if (!session?.expiresAt || session.expiresAt <= now) {
      delete sessions[token];
      changed = true;
    }
  }
  if (changed) saveSessions();
}

function deleteSession(token) {
  if (!token || !sessions[token]) return;
  delete sessions[token];
  saveSessions();
}

function verifySession(token) {
  purgeExpiredSessions();
  const session = sessions[String(token || "")];
  if (!session) return null;

  const account = accounts[session.usernameKey];
  if (!account) {
    delete sessions[token];
    saveSessions();
    return null;
  }

  return {
    usernameKey: session.usernameKey,
    displayName: account.displayName
  };
}

function registerAccount(username, password) {
  const displayName = normalizeNickname(username);
  const nickError = validateNickname(displayName);
  if (nickError) return { ok: false, error: nickError };

  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, error: passwordError };

  const key = usernameKey(displayName);
  if (accounts[key]) {
    return { ok: false, error: "Det här namnet är redan taget. Välj ett annat eller logga in." };
  }

  const { hash, salt } = hashPassword(password);
  accounts[key] = {
    displayName,
    passwordHash: hash,
    salt,
    createdAt: Date.now()
  };
  saveAccounts();

  const token = createSessionToken(key);
  return { ok: true, token, username: displayName };
}

function loginAccount(username, password) {
  const displayName = normalizeNickname(username);
  const nickError = validateNickname(displayName);
  if (nickError) return { ok: false, error: nickError };

  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, error: passwordError };

  const key = usernameKey(displayName);
  const account = accounts[key];
  if (!account || !verifyPassword(password, account)) {
    return { ok: false, error: "Fel användarnamn eller lösenord." };
  }

  const token = createSessionToken(key);
  return { ok: true, token, username: account.displayName };
}

function findSaveKeyForAccount(saves, displayName) {
  const key = usernameKey(displayName);
  return Object.keys(saves).find((name) => usernameKey(name) === key) || null;
}

function requireAuth(req, res, next) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const session = verifySession(token);

  if (!session) {
    return res.status(401).json({ error: "Du måste logga in." });
  }

  req.auth = session;
  req.authToken = token;
  next();
}

module.exports = {
  SESSION_TTL_MS,
  createSessionToken,
  deleteSession,
  findSaveKeyForAccount,
  loadAuthStore,
  loginAccount,
  registerAccount,
  requireAuth,
  usernameKey,
  verifySession
};
