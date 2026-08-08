import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { readJSON, writeJSON, initStorage } from "./storage.js";
import { rateLimit, trackStats, getUsage } from "./rateLimit.js";
import { sendCsv } from "./csv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");

const app = express();
app.use(cors());
app.use(express.json());
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
  const { name, email } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const keys = readJSON("keys.json") || [];
  const key = "sd_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
  const entry = { key, name, email: email || "", active: true, createdAt: new Date().toISOString(), requests: 0 };
  keys.push(entry);
  writeJSON("keys.json", keys);
  res.status(201).json({ key, name, message: "save this key — it won't be shown again" });
});

app.get("/api/sd/usage", (req, res) => {
  const k = requireKey(req, res);
  if (!k) return;
  const all = getUsage();
  res.json({ key: k.key, name: k.name, requestsThisSession: all[k.key] || 0 });
});

app.get("/api/sd/keys", (req, res) => {
  const keys = readJSON("keys.json") || [];
  res.json(keys.map(({ key, name, active, createdAt }) => ({ key: key.slice(0, 8) + "…", name, active, createdAt })));
});

app.get("/api/sd/_health", (req, res) => {
  const stats = readJSON("stats.json");
  const provinces = readJSON("provinces.json");
  const schools = readJSON("schools.json");
  res.json({
    ok: !!stats && !!provinces,
    time: new Date().toISOString(),
    dataReady: !!stats,
    datasets: {
      ecz: stats ? { subjects: stats.subjects, papers: stats.papers, questions: stats.questions } : null,
      admin: provinces ? { provinces: provinces.length, districts: (readJSON("districts.json") || []).length, constituencies: (readJSON("constituencies.json") || []).length, wards: (readJSON("wards.json") || []).length } : null,
      schools: schools ? schools.length : null,
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
