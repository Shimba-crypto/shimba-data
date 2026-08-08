import { writeJSON, readJSON } from "./storage.js";

const SOURCE = "https://johnweb-qncu.onrender.com";

async function fetchJson(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function runSync() {
  const t0 = Date.now();
  console.log("[sync] pulling from JohnWeb public API...");

  const stats = await fetchJson(`${SOURCE}/api/public/stats`);
  const subjects = await fetchJson(`${SOURCE}/api/public/subjects`);
  const papersList = await fetchJson(`${SOURCE}/api/public/papers`);

  if (!stats || !subjects || !papersList) {
    console.error("[sync] failed to fetch core data, keeping existing cache");
    return false;
  }

  writeJSON("stats.json", stats);
  writeJSON("subjects.json", subjects);
  writeJSON("papers.json", papersList);

  const existing = readJSON("paper-details.json") || {};
  let fetched = 0;
  const ids = papersList.map((p) => p.id);
  const CONC = 8;
  for (let i = 0; i < ids.length; i += CONC) {
    const batch = ids.slice(i, i + CONC);
    const results = await Promise.all(batch.map((id) => fetchJson(`${SOURCE}/api/public/papers/${id}`)));
    for (let j = 0; j < results.length; j++) {
      if (results[j]) { existing[batch[j]] = results[j]; fetched++; }
    }
  }
  writeJSON("paper-details.json", existing);

  const result = {
    ok: true,
    ms: Date.now() - t0,
    at: new Date().toISOString(),
    subjects: subjects.length,
    papers: papersList.length,
    paperDetails: fetched,
  };
  writeJSON("sync-state.json", result);
  console.log(`[sync] done in ${result.ms}ms — ${subjects.length} subjects, ${papersList.length} papers, ${fetched} full details`);
  return result;
}

// Allow running directly: `node server/sync.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  runSync()
    .then((r) => { process.exit(r ? 0 : 1); })
    .catch((e) => { console.error(e); process.exit(1); });
}
