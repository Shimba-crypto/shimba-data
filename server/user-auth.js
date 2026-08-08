import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const TOKEN_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

function read(f, fallback) {
  try { return JSON.parse(fs.readFileSync(f, "utf-8")); }
  catch { return fallback; }
}
function write(f, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data, null, 2));
}

function getJwtSecret() {
  const s = read(SETTINGS_FILE, {});
  if (s.jwtSecret) return s.jwtSecret;
  s.jwtSecret = crypto.randomBytes(48).toString("hex");
  write(SETTINGS_FILE, s);
  return s.jwtSecret;
}

function signToken(payload) {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const secret = getJwtSecret();
  const expected = crypto.createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return payload;
  } catch { return null; }
}

export function listUsers() {
  return read(USERS_FILE, []);
}

export function findUserByEmail(email) {
  const users = read(USERS_FILE, []);
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(name, email, password) {
  const users = read(USERS_FILE, []);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: "email already registered" };
  }
  if (password.length < 6) return { error: "password must be at least 6 characters" };
  const user = {
    id: "usr_" + crypto.randomBytes(8).toString("hex"),
    name,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: "user",
    active: true,
    createdAt: new Date().toISOString(),
    linkedJohnWebEmail: "",
  };
  users.push(user);
  write(USERS_FILE, users);
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } };
}

export function loginUser(email, password) {
  const user = findUserByEmail(email);
  if (!user || !user.active) return { error: "invalid email or password" };
  if (!bcrypt.compareSync(password, user.passwordHash)) return { error: "invalid email or password" };
  const token = signToken({ userId: user.id, email: user.email });
  const tokens = read(TOKENS_FILE, []);
  tokens.push({ token, userId: user.id, expiresAt: Date.now() + TOKEN_TTL, createdAt: new Date().toISOString() });
  write(TOKENS_FILE, tokens);
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, linkedJohnWebEmail: user.linkedJohnWebEmail } };
}

export function verifyAuth(token) {
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = listUsers().find((u) => u.id === payload.userId);
  if (!user || !user.active) return null;
  return user;
}

export function linkJohnWeb(userId, johnWebEmail) {
  const users = read(USERS_FILE, []);
  const user = users.find((u) => u.id === userId);
  if (!user) return { error: "user not found" };
  user.linkedJohnWebEmail = johnWebEmail.toLowerCase();
  write(USERS_FILE, users);
  return { ok: true };
}

export function changePassword(userId, oldPass, newPass) {
  const users = read(USERS_FILE, []);
  const user = users.find((u) => u.id === userId);
  if (!user) return { error: "user not found" };
  if (!bcrypt.compareSync(oldPass, user.passwordHash)) return { error: "old password incorrect" };
  if (newPass.length < 6) return { error: "new password must be at least 6 characters" };
  user.passwordHash = bcrypt.hashSync(newPass, 10);
  write(USERS_FILE, users);
  return { ok: true };
}

export function requireUser(req, res, next) {
  const token = req.headers["x-user-token"] || req.query.token;
  const user = verifyAuth(token);
  if (!user) return res.status(401).json({ error: "login required" });
  req.user = user;
  next();
}
