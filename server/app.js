import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { readJSON, writeJSON, initStorage } from "./storage.js";
import { rateLimit, trackStats, getUsage } from "./rateLimit.js";
import { sendCsv } from "./csv.js";
import { seedAdminIfNeeded, loginAdmin, changePassword, listAdmins, createAdmin, requireAdmin, requireSuperAdmin, setAdminStatus, removeAdmin } from "./admin.js";
import { runSync } from "./sync.js";
import { createUser, loginUser, verifyAuth, requireUser, linkJohnWeb, changePassword as changeUserPassword, listUsers, signToken, findUserByEmail } from "./user-auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.set("trust proxy", true);

app.use("/api/sd", trackStats);
app.use("/api/sd", rateLimit);

const requireKey = (req, res) => {
  const key = req.headers["x-sd-key"];
  const keys = readJSON("keys.json") || [];
  const found = keys.find((k) => k.key === key && k.active !== false);
  if (!found) {
    res.status(401).json({ error: "valid X-SD-Key required" });
    return null;
  }
  return found;
};

app.get("/api/sd/stats", (req, res) => {
  const stats = readJSON("stats.json");
  if (!stats) return res.status(503).json({ error: "data not synced yet" });
  if (sendCsv(req, res, [stats])) return;
  const keys = readJSON("keys.json") || [];
  res.json({ ...stats, keysIssued: keys.length, docs: "/docs" });
});

app.get("/api/sd/subjects", (req, res) => {
  const subjects = readJSON("subjects.json");
  if (!subjects) return res.status(503).json({ error: "data not synced yet" });
  if (sendCsv(req, res, subjects)) return;
  res.json(subjects);
});

app.get("/api/sd/papers", (req, res) => {
  const papers = readJSON("papers.json");
  if (!papers) return res.status(503).json({ error: "data not synced yet" });
  let out = papers;
  if (req.query.subjectId) out = out.filter((p) => p.subjectId === req.query.subjectId);
  if (req.query.grade) out = out.filter((p) => String(p.grade) === req.query.grade);
  if (req.query.year) out = out.filter((p) => String(p.year) === req.query.year);
  if (sendCsv(req, res, out)) return;
  res.json(out);
});

app.get("/api/sd/papers/:id", (req, res) => {
  const details = readJSON("paper-details.json") || {};
  const paper = details[req.params.id];
  if (!paper) return res.status(404).json({ error: "paper not found" });
  res.json(paper);
});

/* ── admin divisions ──────────────────────────────── */
app.get("/api/sd/provinces", (req, res) => {
  const data = readJSON("provinces.json");
  if (!data) return res.status(503).json({ error: "data not synced yet" });
  if (sendCsv(req, res, data.map((p) => ({ id: p.id, name: p.name?.en, lat: p.geo?.lat, lon: p.geo?.lon, districts: p.children_count?.district, constituencies: p.children_count?.constituency, wards: p.children_count?.ward })))) return;
  res.json(data);
});

app.get("/api/sd/districts", (req, res) => {
  const data = readJSON("districts.json");
  if (!data) return res.status(503).json({ error: "data not synced yet" });
  let out = data;
  if (req.query.provinceId) out = out.filter((d) => d.parent?.id === req.query.provinceId);
  if (req.query.limit) out = out.slice(0, parseInt(req.query.limit));
  if (sendCsv(req, res, out.map((d) => ({ id: d.id, name: d.name?.en, province: d.parent?.name?.en, provinceId: d.parent?.id, lat: d.geo?.lat, lon: d.geo?.lon, constituencies: d.children_count?.constituency, wards: d.children_count?.ward })))) return;
  res.json(out);
});

app.get("/api/sd/constituencies", (req, res) => {
  const data = readJSON("constituencies.json");
  if (!data) return res.status(503).json({ error: "data not synced yet" });
  let out = data;
  if (req.query.districtId) out = out.filter((c) => c.parent?.id === req.query.districtId);
  if (sendCsv(req, res, out.map((c) => ({ id: c.id, name: c.name?.en, district: c.parent?.name?.en, districtId: c.parent?.id, wards: c.children_count?.ward })))) return;
  res.json(out);
});

app.get("/api/sd/wards", (req, res) => {
  const data = readJSON("wards.json");
  if (!data) return res.status(503).json({ error: "data not synced yet" });
  const hasFilter = req.query.constituencyId || req.query.districtId || req.query.provinceId;
  if (!hasFilter) {
    return res.status(400).json({
      error: "provide at least one filter: constituencyId, districtId, or provinceId",
      total: data.length,
      example: "/api/sd/wards?districtId=ZM101001",
    });
  }
  let out = data;
  if (req.query.constituencyId) {
    out = out.filter((w) => w.parent?.id === req.query.constituencyId);
  } else if (req.query.districtId) {
    const constituencies = readJSON("constituencies.json") || [];
    const cIds = new Set(constituencies.filter((c) => c.parent?.id === req.query.districtId).map((c) => c.id));
    out = out.filter((w) => cIds.has(w.parent?.id));
  } else if (req.query.provinceId) {
    const districts = readJSON("districts.json") || [];
    const constituencies = readJSON("constituencies.json") || [];
    const dIds = new Set(districts.filter((d) => d.parent?.id === req.query.provinceId).map((d) => d.id));
    const cIds = new Set(constituencies.filter((c) => dIds.has(c.parent?.id)).map((c) => c.id));
    out = out.filter((w) => cIds.has(w.parent?.id));
  }
  if (req.query.limit) out = out.slice(0, parseInt(req.query.limit));
  if (sendCsv(req, res, out.map((w) => ({ id: w.id, name: w.name?.en, constituency: w.parent?.name?.en, constituencyId: w.parent?.id })))) return;
  res.json(out);
});

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

app.get("/api/sd/schools", (req, res) => {
  const data = readJSON("schools.json");
  if (!data) return res.status(503).json({ error: "data not synced yet" });
  if (!req.query.q && !(req.query.lat && req.query.lon)) {
    return res.status(400).json({
      error: "provide q (name search) or lat+lon (proximity) filter",
      total: data.length,
      example: "/api/sd/schools?q=kitwe or /api/sd/schools?lat=-15.477&lon=29.18&radiusKm=30",
    });
  }
  let out = data;
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    out = out.filter((s) => s.name.toLowerCase().includes(q) || (s.amenity || "").toLowerCase().includes(q));
  }
  if (req.query.lat && req.query.lon && req.query.radiusKm) {
    const lat = parseFloat(req.query.lat), lon = parseFloat(req.query.lon), r = parseFloat(req.query.radiusKm);
    out = out
      .filter((s) => haversineKm(lat, lon, s.lat, s.lon) <= r)
      .map((s) => ({ ...s, distanceKm: Math.round(haversineKm(lat, lon, s.lat, s.lon) * 100) / 100 }));
  }
  if (req.query.limit) out = out.slice(0, parseInt(req.query.limit));
  if (sendCsv(req, res, out.map((s) => ({ name: s.name, amenity: s.amenity, level: s.level, lat: s.lat, lon: s.lon, distanceKm: s.distanceKm ?? null })))) return;
  res.json(out);
});

app.get("/api/sd/health-facilities", (req, res) => {
  const data = readJSON("health-facilities.json");
  if (!data) return res.status(503).json({ error: "data not synced yet" });
  const hasFilter = req.query.province || req.query.district || req.query.type || (req.query.lat && req.query.lon) || req.query.ownership;
  if (!hasFilter) {
    return res.status(400).json({
      error: "provide at least one filter: province, district, type, ownership, or lat+lon",
      total: data.length,
      example: "/api/sd/health-facilities?province=Lusaka or /api/sd/health-facilities?type=Hospital&lat=-15.477&lon=29.18&radiusKm=20",
    });
  }
  let out = data;
  if (req.query.province) { const p = req.query.province.toLowerCase(); out = out.filter((f) => f.province.toLowerCase().includes(p)); }
  if (req.query.district) { const d = req.query.district.toLowerCase(); out = out.filter((f) => f.district.toLowerCase().includes(d)); }
  if (req.query.type) { const t = req.query.type.toLowerCase(); out = out.filter((f) => f.type.toLowerCase().includes(t)); }
  if (req.query.ownership) { const o = req.query.ownership.toLowerCase(); out = out.filter((f) => f.ownership.toLowerCase().includes(o)); }
  if (req.query.lat && req.query.lon && req.query.radiusKm) {
    const lat = parseFloat(req.query.lat), lon = parseFloat(req.query.lon), r = parseFloat(req.query.radiusKm);
    out = out
      .filter((f) => haversineKm(lat, lon, f.lat, f.lon) <= r)
      .map((f) => ({ ...f, distanceKm: Math.round(haversineKm(lat, lon, f.lat, f.lon) * 100) / 100 }));
  }
  if (req.query.limit) out = out.slice(0, parseInt(req.query.limit));
  if (sendCsv(req, res, out.map((f) => ({ name: f.name, type: f.type, ownership: f.ownership, location: f.location, province: f.province, district: f.district, lat: f.lat, lon: f.lon, status: f.status, distanceKm: f.distanceKm ?? null })))) return;
  res.json(out);
});

app.get("/api/sd/universities", (req, res) => {
  const data = readJSON("universities.json");
  if (!data) return res.status(503).json({ error: "data not synced yet" });
  let out = data;
  if (req.query.type) out = out.filter((u) => u.type === req.query.type);
  if (req.query.province) { const p = req.query.province.toLowerCase(); out = out.filter((u) => (u.province || "").toLowerCase().includes(p)); }
  if (req.query.town) { const t = req.query.town.toLowerCase(); out = out.filter((u) => (u.town || "").toLowerCase().includes(t)); }
  if (req.query.q) { const q = req.query.q.toLowerCase(); out = out.filter((u) => u.name.toLowerCase().includes(q)); }
  if (req.query.limit) out = out.slice(0, parseInt(req.query.limit));
  res.json({ count: out.length, source: "uniRank.org / HEA Zambia", results: out });
});

app.get("/api/sd/laws", (req, res) => {
  const data = readJSON("laws.json");
  if (!data) return res.status(503).json({ error: "data not synced yet" });
  let out = data;
  if (req.query.category) { const c = req.query.category.toLowerCase(); out = out.filter((l) => (l.category || "").toLowerCase() === c); }
  if (req.query.year) out = out.filter((l) => String(l.year) === req.query.year);
  if (req.query.q) { const q = req.query.q.toLowerCase(); out = out.filter((l) => (l.title || "").toLowerCase().includes(q)); }
  if (req.query.limit) out = out.slice(0, parseInt(req.query.limit));
  res.json({ count: out.length, source: "ZambiaLII / National Assembly", results: out });
});

app.get("/api/sd/questions", (req, res) => {
  const details = readJSON("paper-details.json") || {};
  let qs = [];
  for (const id in details) {
    for (const q of details[id].questions || []) {
      qs.push({ paperId: id, paperTitle: details[id].title, grade: details[id].grade, ...q });
    }
  }
  if (req.query.subjectId) {
    const papers = readJSON("papers.json") || [];
    const ids = new Set(papers.filter((p) => p.subjectId === req.query.subjectId).map((p) => p.id));
    qs = qs.filter((q) => ids.has(q.paperId));
  }
  if (req.query.grade) qs = qs.filter((q) => String(q.grade) === req.query.grade);
  if (req.query.limit) qs = qs.slice(0, parseInt(req.query.limit));
  if (sendCsv(req, res, qs)) return;
  res.json(qs);
});

app.get("/api/sd/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  if (!q) return res.status(400).json({ error: "q required" });
  const details = readJSON("paper-details.json") || {};
  const results = [];
  for (const id in details) {
    for (const qu of details[id].questions || []) {
      if ((qu.text || "").toLowerCase().includes(q)) {
        results.push({ paperId: id, paperTitle: details[id].title, ...qu });
      }
    }
  }
  res.json({ query: q, count: results.length, results: results.slice(0, 50) });
});

app.get("/api/sd/sync-state", (req, res) => {
  res.json(readJSON("sync-state.json") || { ok: false, note: "no sync yet" });
});

app.get("/api/sd/stats/aggregate", (req, res) => {
  const k = requireKey(req, res);
  if (!k) return;
  const s = readJSON("api-stats.json") || {};
  res.json({ owner: k.name, ...s });
});

app.post("/api/sd/keys", (req, res) => {
  const { name, email, company, project, useCase } = req.body || {};
  if (!name || !project) {
    return res.status(400).json({ error: "name and project required - tell us who you are and what you are building" });
  }
  const keys = readJSON("keys.json") || [];
  const key = "sd_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
  const entry = {
    key, name, email: email || "", company: company || "", project, useCase: useCase || "",
    active: false, status: "pending", createdAt: new Date().toISOString(), requests: 0,
  };
  keys.push(entry);
  writeJSON("keys.json", keys);
  res.status(201).json({
    key, project, status: "pending",
    message: "submission received. Save this key - an admin will review it. Your key activates once approved.",
  });
});

app.get("/api/sd/keys/status/:key", (req, res) => {
  const keys = readJSON("keys.json") || [];
  const found = keys.find((k) => k.key === req.params.key);
  if (!found) return res.status(404).json({ error: "key not found" });
  res.json({ key: found.key.slice(0, 8) + "...", project: found.project, status: found.status, createdAt: found.createdAt });
});

app.post("/api/user/key-request", requireUser, (req, res) => {
  const { name, project, useCase, company } = req.body || {};
  if (!name || !project) return res.status(400).json({ error: "name and project required" });
  const keys = readJSON("keys.json") || [];
  const key = "sd_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
  const entry = {
    key, name, email: req.user.email, company: company || "", project, useCase: useCase || "",
    active: false, status: "pending", createdAt: new Date().toISOString(), requests: 0, userId: req.user.id,
  };
  keys.push(entry);
  writeJSON("keys.json", keys);
  res.status(201).json({ key, project, status: "pending", message: "submission received. Save this key - an admin will review it." });
});

app.get("/api/sd/usage", (req, res) => {
  const k = requireKey(req, res);
  if (!k) return;
  const all = getUsage();
  res.json({ key: k.key, name: k.name, project: k.project || "", requestsThisSession: all[k.key] || 0 });
});

app.get("/api/sd/keys", (req, res) => {
  const keys = readJSON("keys.json") || [];
  res.json(keys.map(({ key, name, active, createdAt }) => ({ key: key.slice(0, 8) + "…", name, active, createdAt })));
});

/* ── user auth (connect app) ─────────────────────── */
app.post("/api/user/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
  const result = createUser(name, email, password);
  if (result.error) return res.status(409).json(result);
  res.status(201).json(result);
});

app.post("/api/user/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const result = loginUser(email, password);
  if (result.error) return res.status(401).json(result);
  // Set browser cookie for SSO
  res.cookie("nsp_token", result.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.json(result);
});

app.post("/api/user/logout", (req, res) => {
  res.clearCookie("nsp_token");
  res.json({ ok: true });
});

app.get("/api/user/me", requireUser, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, createdAt: req.user.createdAt, linkedJohnWebEmail: req.user.linkedJohnWebEmail });
});

app.get("/api/user/keys", requireUser, (req, res) => {
  const keys = readJSON("keys.json") || [];
  const mine = keys.filter((k) => (k.email || "").toLowerCase() === req.user.email.toLowerCase());
  res.json(mine);
});

app.post("/api/user/link-johnweb", requireUser, (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "JohnWeb email required" });
  const result = linkJohnWeb(req.user.id, email);
  res.json(result);
});

app.post("/api/user/change-password", requireUser, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: "oldPassword and newPassword required" });
  const result = changeUserPassword(req.user.id, oldPassword, newPassword);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

/* ── SSO: Login with Auther ─────────────────────── */
const AUTHER = "https://auther-zblr.onrender.com";

// Verify an Auther token server-side, then create a local session.
function ssoAutherUser(d) {
  let user = findUserByEmail(d.user.email);
  if (!user) {
    const created = createUser(d.user.name || d.user.email, d.user.email, crypto.randomBytes(16).toString("hex"));
    if (created.error) return null;
    user = findUserByEmail(d.user.email);
  }
  return user;
}

// Redirect to Auther's authorize page
app.get("/api/user/sso", (req, res) => {
  res.redirect(`${AUTHER}/sso/authorize?client_id=shimbadata&redirect_uri=${encodeURIComponent("https://shimbadata.onrender.com/api/user/sso/callback")}`);
});

// Auther redirects back with ?code=
app.get("/api/user/sso/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/login?error=sso_failed");
  try {
    const r = await fetch(`${AUTHER}/sso/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    if (!d.ok || !d.user) return res.redirect("/login?error=sso_failed");
    const user = ssoAutherUser(d);
    if (!user) return res.redirect("/login?error=sso_failed");

    // Issue local token + cookie
    const token = signToken({ userId: user.id, email: user.email });
    const tokens = readJSON("tokens.json") || [];
    tokens.push({ token, userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt: new Date().toISOString() });
    writeJSON("tokens.json", tokens);
    res.cookie("nsp_token", token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.redirect("/dashboard?sso=1");
  } catch {
    res.redirect("/login?error=sso_failed");
  }
});

// Direct token entry (Auther dashboard "Sign in with Auther")
app.get("/api/auth/sso", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect("/login?error=sso_failed");
  try {
    const r = await fetch(`${AUTHER}/api/auth/me`, {
      headers: { "X-Auth-Token": token },
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    if (!r.ok || !d.user) return res.redirect("/login?error=sso_failed");
    const user = ssoAutherUser(d);
    if (!user) return res.redirect("/login?error=sso_failed");
    const local = signToken({ userId: user.id, email: user.email });
    const tokens = readJSON("tokens.json") || [];
    tokens.push({ token: local, userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt: new Date().toISOString() });
    writeJSON("tokens.json", tokens);
    res.cookie("nsp_token", local, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.redirect("/dashboard?sso=1&token=" + local);
  } catch {
    res.redirect("/login?error=sso_failed");
  }
});

app.get("/api/user/credits", requireUser, (req, res) => {
  const credits = readJSON("credits.json") || {};
  const mine = credits[req.user.id] || { balance: 0, history: [] };
  const subs = readJSON("subscriptions.json") || {};
  const mySub = subs[req.user.id] || null;
  res.json({ balance: mine.balance, history: mine.history.slice(-20), subscription: mySub });
});

const CREDIT_PACKS = { starter: { credits: 2000, price: 20 }, growth: { credits: 10000, price: 75 }, power: { credits: 35000, price: 200 } };

app.post("/api/user/buy-credits", requireUser, (req, res) => {
  const { packId } = req.body || {};
  const pack = CREDIT_PACKS[packId];
  if (!pack) return res.status(400).json({ error: "unknown pack" });
  const credits = readJSON("credits.json") || {};
  if (!credits[req.user.id]) credits[req.user.id] = { balance: 0, history: [] };
  credits[req.user.id].history.push({ type: "purchase", packId, credits: pack.credits, price: pack.price, at: new Date().toISOString() });
  writeJSON("credits.json", credits);
  res.json({ ok: true, credits: pack.credits, price: pack.price, message: `Invoice generated for K${pack.price}. Credits will be added once payment is confirmed.` });
});

/* ── admin routes ─────────────────────────────────── */
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  const result = loginAdmin(username, password);
  if (!result) return res.status(401).json({ error: "invalid credentials" });
  res.json(result);
});

app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.json({ username: req.admin.username, role: req.admin.role });
});

app.post("/api/admin/change-password", requireAdmin, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: "oldPassword and newPassword required" });
  if (newPassword.length < 6) return res.status(400).json({ error: "new password must be at least 6 characters" });
  const ok = changePassword(req.admin.username, oldPassword, newPassword);
  res.json(ok ? { ok: true } : { ok: false, error: "old password incorrect" });
});

app.get("/api/admin/admins", requireAdmin, (req, res) => {
  res.json(listAdmins());
});

app.post("/api/admin/admins", requireAdmin, (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password required" });
  if (password.length < 6) return res.status(400).json({ error: "password must be at least 6 characters" });
  if (role === "super_admin" && req.admin.role !== "super_admin") {
    return res.status(403).json({ error: "only super_admin can create other super_admins" });
  }
  const finalRole = role === "super_admin" ? "super_admin" : "admin";
  const ok = createAdmin(username, password, finalRole);
  if (!ok) return res.status(409).json({ error: "username already exists" });
  res.status(201).json({ ok: true, username, role: finalRole });
});

app.patch("/api/admin/admins/:username", requireSuperAdmin, (req, res) => {
  const { active } = req.body || {};
  const target = listAdmins().find((a) => a.username === req.params.username);
  if (!target) return res.status(404).json({ error: "admin not found" });
  if (typeof active === "boolean") {
    if (req.params.username === req.admin.username && active === false) {
      return res.status(400).json({ error: "cannot deactivate yourself" });
    }
    setAdminStatus(req.params.username, active);
  }
  res.json({ ok: true });
});

app.delete("/api/admin/admins/:username", requireSuperAdmin, (req, res) => {
  const result = removeAdmin(req.params.username, req.admin.username);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.get("/api/admin/submissions", requireAdmin, (req, res) => {
  const keys = readJSON("keys.json") || [];
  const pending = keys.filter((k) => k.status === "pending" || (!k.active && !k.status));
  res.json(pending);
});

app.post("/api/admin/keys/:key/approve", requireAdmin, (req, res) => {
  const keys = readJSON("keys.json") || [];
  const found = keys.find((k) => k.key === req.params.key);
  if (!found) return res.status(404).json({ error: "key not found" });
  found.active = true;
  found.status = "approved";
  found.approvedAt = new Date().toISOString();
  found.approvedBy = req.admin.username;
  writeJSON("keys.json", keys);
  res.json({ ok: true, key: found.key.slice(0, 8) + "…", project: found.project, status: "approved" });
});

app.post("/api/admin/keys/:key/reject", requireAdmin, (req, res) => {
  const keys = readJSON("keys.json") || [];
  const found = keys.find((k) => k.key === req.params.key);
  if (!found) return res.status(404).json({ error: "key not found" });
  found.status = "rejected";
  found.active = false;
  found.rejectedAt = new Date().toISOString();
  found.rejectedBy = req.admin.username;
  writeJSON("keys.json", keys);
  res.json({ ok: true, key: found.key.slice(0, 8) + "…", project: found.project, status: "rejected" });
});

app.get("/api/admin/keys", requireAdmin, (req, res) => {
  const keys = readJSON("keys.json") || [];
  res.json(keys.map((k) => ({
    key: k.key.slice(0, 8) + "…",
    name: k.name, project: k.project, company: k.company, email: k.email,
    status: k.status || (k.active ? "approved" : "pending"),
    active: k.active, createdAt: k.createdAt, useCase: k.useCase,
  })));
});

app.get("/api/admin/stats", requireAdmin, (req, res) => {
  const stats = readJSON("api-stats.json") || {};
  const keys = readJSON("keys.json") || [];
  const syncState = readJSON("sync-state.json") || {};
  res.json({
    api: stats,
    keys: { total: keys.length, pending: keys.filter((k) => k.status === "pending").length, approved: keys.filter((k) => k.status === "approved" || (k.active && !k.status)).length, rejected: keys.filter((k) => k.status === "rejected").length },
    sync: syncState,
    admins: listAdmins(),
  });
});

app.post("/api/admin/sync", requireAdmin, async (req, res) => {
  res.json({ ok: true, message: "sync started" });
  runSync().catch((e) => console.error("[admin sync] error:", e.message));
});

app.get("/api/sd/_health", (req, res) => {
  const stats = readJSON("stats.json");
  const provinces = readJSON("provinces.json");
  const schools = readJSON("schools.json");
  const health = readJSON("health-facilities.json");
  const unis = readJSON("universities.json");
  const laws = readJSON("laws.json");
  res.json({
    ok: !!stats && !!provinces,
    time: new Date().toISOString(),
    dataReady: !!stats,
    datasets: {
      ecz: stats ? { subjects: stats.subjects, papers: stats.papers, questions: stats.questions } : null,
      admin: provinces ? { provinces: provinces.length, districts: (readJSON("districts.json") || []).length, constituencies: (readJSON("constituencies.json") || []).length, wards: (readJSON("wards.json") || []).length } : null,
      schools: schools ? schools.length : null,
      healthFacilities: health ? health.length : null,
      universities: unis ? unis.length : null,
      laws: laws ? laws.length : null,
    },
  });
});

// Serve built frontend
app.use(express.static(DIST));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(DIST, "index.html"), (e) => {
    if (e) res.status(200).send("ShimbaData — build the frontend first (npm run build)");
  });
});

export default app;
