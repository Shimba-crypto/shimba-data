import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
const ADMINS_FILE = path.join(DATA_DIR, "admins.json");

// In-memory token store: token -> { username, expiresAt }
const tokens = new Map();
const TOKEN_TTL = 1000 * 60 * 60 * 8; // 8h

function readAdmins() {
  if (!fs.existsSync(ADMINS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(ADMINS_FILE, "utf-8")); }
  catch { return []; }
}

function writeAdmins(admins) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
}

export function seedAdminIfNeeded() {
  const admins = readAdmins();
  if (admins.length > 0) return null;
  const pass = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  const hash = bcrypt.hashSync(pass, 10);
  const admin = { username: "admin", passwordHash: hash, role: "super_admin", createdAt: new Date().toISOString(), active: true };
  writeAdmins([admin]);
  console.log("========================================================");
  console.log("  FIRST ADMIN CREATED (save this — shown once!)");
  console.log("  username: admin");
  console.log("  password: " + pass);
  console.log("  Login at /admin and change the password ASAP.");
  console.log("========================================================");
  return pass;
}

export function loginAdmin(username, password) {
  const admins = readAdmins();
  const admin = admins.find((a) => a.username === username && a.active !== false);
  if (!admin) return null;
  if (!bcrypt.compareSync(password, admin.passwordHash)) return null;
  const token = "adm_" + Math.random().toString(36).slice(2, 16) + Date.now().toString(36);
  tokens.set(token, { username: admin.username, role: admin.role, expiresAt: Date.now() + TOKEN_TTL });
  return { token, username: admin.username, role: admin.role };
}

export function changePassword(username, oldPass, newPass) {
  const admins = readAdmins();
  const admin = admins.find((a) => a.username === username);
  if (!admin) return false;
  if (!bcrypt.compareSync(oldPass, admin.passwordHash)) return false;
  admin.passwordHash = bcrypt.hashSync(newPass, 10);
  admin.updatedAt = new Date().toISOString();
  writeAdmins(admins);
  return true;
}

export function listAdmins() {
  return readAdmins().map(({ username, role, active, createdAt }) => ({ username, role, active, createdAt }));
}

export function createAdmin(username, password, role = "admin") {
  const admins = readAdmins();
  if (admins.some((a) => a.username === username)) return false;
  admins.push({ username, passwordHash: bcrypt.hashSync(password, 10), role, active: true, createdAt: new Date().toISOString() });
  writeAdmins(admins);
  return true;
}

export function verifyToken(token) {
  if (!token) return null;
  const t = tokens.get(token);
  if (!t) return null;
  if (Date.now() > t.expiresAt) { tokens.delete(token); return null; }
  return { username: t.username, role: t.role };
}

// Express middleware
export function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"] || req.query.token;
  const admin = verifyToken(token);
  if (!admin) return res.status(401).json({ error: "admin login required" });
  req.admin = admin;
  next();
}
