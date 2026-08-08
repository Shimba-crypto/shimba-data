import { writeJSON, readJSON } from "./storage.js";
import AdmZip from "adm-zip";

const JOHNWEB = "https://johnweb-qncu.onrender.com";
const ADMIN_RAW = "https://raw.githubusercontent.com/open-admin-data/zambia-administrative-divisions/master/data";
const SCHOOLS_URL =
  "https://production-raw-data-api.s3.amazonaws.com/ISO3/ZMB/education_facilities/hotosm_zmb_education_facilities_osm_geojson.zip";

async function fetchJson(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function fetchBuffer(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function syncJohnWeb() {
  const stats = await fetchJson(`${JOHNWEB}/api/public/stats`);
  const subjects = await fetchJson(`${JOHNWEB}/api/public/subjects`);
  const papersList = await fetchJson(`${JOHNWEB}/api/public/papers`);
  if (!stats || !subjects || !papersList) return null;

  writeJSON("stats.json", stats);
  writeJSON("subjects.json", subjects);
  writeJSON("papers.json", papersList);

  const existing = readJSON("paper-details.json") || {};
  let fetched = 0;
  const CONC = 8;
  const ids = papersList.map((p) => p.id);
  for (let i = 0; i < ids.length; i += CONC) {
    const batch = ids.slice(i, i + CONC);
    const results = await Promise.all(batch.map((id) => fetchJson(`${JOHNWEB}/api/public/papers/${id}`)));
    for (let j = 0; j < results.length; j++) {
      if (results[j]) { existing[batch[j]] = results[j]; fetched++; }
    }
  }
  writeJSON("paper-details.json", existing);
  return { subjects: subjects.length, papers: papersList.length, paperDetails: fetched };
}

export async function syncAdminDivs() {
  const provinces = await fetchJson(`${ADMIN_RAW}/all-province.json`);
  const districts = await fetchJson(`${ADMIN_RAW}/all-district.json`);
  const constituencies = await fetchJson(`${ADMIN_RAW}/all-constituency.json`);
  if (!provinces || !districts || !constituencies) return null;

  writeJSON("provinces.json", provinces);
  writeJSON("districts.json", districts);
  writeJSON("constituencies.json", constituencies);

  const wards = await fetchJson(`${ADMIN_RAW}/all-ward.json`);
  let wardCount = 0;
  if (wards && Array.isArray(wards)) { writeJSON("wards.json", wards); wardCount = wards.length; }
  writeJSON("wards.json", wards);

  return { provinces: provinces.length, districts: districts.length, constituencies: constituencies.length, wards: wards.length };
}

export async function syncSchools() {
  const buf = await fetchBuffer(SCHOOLS_URL);
  if (!buf) return null;
  let zip;
  try { zip = new AdmZip(buf); } catch { return null; }

  const entries = zip.getEntries();
  const geoEntry = entries.find((e) => e.entryName.endsWith(".geojson"));
  if (!geoEntry) return null;

  let geo;
  try { geo = JSON.parse(geoEntry.getData().toString("utf-8")); } catch { return null; }

  const schools = (geo.features || [])
    .map((f) => {
      const p = f.properties || {};
      const coords = f.geometry && f.geometry.type === "Point" ? f.geometry.coordinates : null;
      const name = p.name || p["name:en"] || p.official_name || "";
      if (!name || !coords) return null;
      return {
        name,
        lat: coords[1],
        lon: coords[0],
        amenity: p.amenity || p.building || "",
        operator: p.operator || "",
        level: p["school:level"] || p.level || "",
        tags: p,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  writeJSON("schools.json", schools);
  return { schools: schools.length };
}

export async function runSync() {
  const t0 = Date.now();
  console.log("[sync] pulling ECZ + admin + schools...");

  const result = { ok: true, at: new Date().toISOString() };
  try {
    result.johnweb = await syncJohnWeb();
    if (!result.johnweb) { result.johnweb_ok = false; console.error("[sync] johnweb failed"); }
    else result.johnweb_ok = true;
  } catch (e) { result.johnweb_ok = false; console.error("[sync] johnweb error:", e.message); }

  try {
    result.admin = await syncAdminDivs();
    if (!result.admin) { result.admin_ok = false; console.error("[sync] admin failed"); }
    else result.admin_ok = true;
  } catch (e) { result.admin_ok = false; console.error("[sync] admin error:", e.message); }

  try {
    result.schools = await syncSchools();
    if (!result.schools) { result.schools_ok = false; console.error("[sync] schools failed"); }
    else result.schools_ok = true;
  } catch (e) { result.schools_ok = false; console.error("[sync] schools error:", e.message); }

  result.ms = Date.now() - t0;
  result.ok = !!(result.johnweb_ok && result.admin_ok);
  writeJSON("sync-state.json", result);

  console.log(
    `[sync] done in ${result.ms}ms — johnweb:${result.johnweb_ok ? "ok" : "FAIL"} admin:${result.admin ? result.admin.provinces + "P/" + (result.admin.wards || 0) + "W" : "FAIL"} schools:${result.schools ? result.schools.schools : "FAIL"}`
  );
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSync().then((r) => process.exit(r && r.ok ? 0 : 1)).catch((e) => { console.error(e); process.exit(1); });
}
