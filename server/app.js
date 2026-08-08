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
  res.json({ ok: !!stats, time: new Date().toISOString(), dataReady: !!stats });
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
