import { readJSON, writeJSON } from "./storage.js";

const WINDOW_MS = 60 * 1000;
const FREE_MAX = 30;
const KEY_MAX = 3000;

const hits = new Map();
const usage = new Map();

function clientIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
}

function recordUsage(key) {
  if (!key) return;
  usage.set(key, (usage.get(key) || 0) + 1);
}

export function getUsage() {
  return Object.fromEntries(usage);
}

export function rateLimit(req, res, next) {
  const key = req.headers["x-sd-key"];
  const keys = readJSON("keys.json") || [];
  const isPro = key && keys.some((k) => k.key === key && k.active !== false);

  const ip = clientIp(req);
  const mapKey = isPro ? `key:${key}` : `ip:${ip}`;
  const now = Date.now();
  const max = isPro ? KEY_MAX : FREE_MAX;

  if (!hits.has(mapKey)) hits.set(mapKey, []);
  const arr = hits.get(mapKey).filter((t) => now - t < WINDOW_MS);
  hits.set(mapKey, arr);

  const remaining = Math.max(0, max - arr.length - 1);
  res.set({
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil((now + WINDOW_MS) / 1000)),
  });

  if (arr.length >= max) {
    res.status(429).json({ error: "rate limit exceeded", limit: max, upgrade: "/#keys" });
    return;
  }

  arr.push(now);
  if (isPro) recordUsage(key);
  next();
}

export function trackStats(req, res, next) {
  res.on("finish", () => {
    const s = readJSON("api-stats.json") || { total: 0, byEndpoint: {}, since: new Date().toISOString() };
    s.total = (s.total || 0) + 1;
    s.byEndpoint[req.path] = (s.byEndpoint[req.path] || 0) + 1;
    writeJSON("api-stats.json", s);
  });
  next();
}
