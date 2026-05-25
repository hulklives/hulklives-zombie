const crypto = require("crypto");
const { normalizeNickname, validateNickname } = require("./save-validation");
const storage = require("./persistent-storage");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 72;

let accounts = {};
let sessions = {};

function saveAccounts() {
  storage.writeJson("accounts", accounts);
}

function saveSessions() {
  storage.writeJson("sessions", sessions);
}

async function loadAuthStore() {
  accounts = (await storage.readJson("accounts", {})) || {};
  sessions = (await storage.readJson("sessions", {})) || {};
  purgeExpiredSessions();
}

function usernameKey(username) {
  return normalizeNickname(username).toLowerCase();
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
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

function deleteSessionsForUsernameKey(usernameKeyValue) {
  const key = usernameKey(usernameKeyValue);
  if (!key) return 0;

  let removed = 0;
  for (const [token, session] of Object.entries(sessions)) {
    if (session?.usernameKey === key) {
      delete sessions[token];
      removed += 1;
    }
  }
  if (removed > 0) saveSessions();
  return removed;
}

function listAccountSummaries() {
  return Object.values(accounts).map((account) => ({
    username: account.displayName,
    usernameKey: usernameKey(account.displayName),
    createdAt: Number(account.createdAt) || 0
  }));
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
    return { ok: false, error: "This name is already taken. Choose another or log in." };
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
    return { ok: false, error: "Wrong username or password." };
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
    return res.status(401).json({ error: "You must log in." });
  }

  req.auth = session;
  req.authToken = token;
  next();
}

module.exports = {
  SESSION_TTL_MS,
  createSessionToken,
  deleteSession,
  deleteSessionsForUsernameKey,
  findSaveKeyForAccount,
  listAccountSummaries,
  loadAuthStore,
  loginAccount,
  registerAccount,
  requireAuth,
  usernameKey,
  verifySession
};
