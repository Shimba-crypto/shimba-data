#!/usr/bin/env node
// Scrape ECZ paper metadata from zambiapapers.com sitemaps + eczstudytool.com
// Usage: node scripts/scrape-ecz.js
// Output: scripts/ecz-import.json (papers + subjects ready for JohnWeb import)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "ecz-import.json");

const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ShimbaData/1.0)" },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

// --- Source 1: zambiapapers.com sitemaps ---
const ZAMBI_SITEMAPS = {
  7: "https://www.zambiapapers.com/dynamic-grade-7_p_e121a79b_fec7_4a1f_a9c8_ed3897507d2e_0_5000-sitemap.xml",
  9: "https://www.zambiapapers.com/dynamic-grade-9_p_69d28dad_0396_4b9c_a189_6b9bb221181a_0_5000-sitemap.xml",
  12: "https://www.zambiapapers.com/dynamic-grade-12_p_81836a56_98da_460a_b58c_802c7c7dc733_0_5000-sitemap.xml",
};

const SUBJECT_SLUG_MAP = {
  mathematics: "Mathematics",
  "additional-mathematics": "Additional Mathematics",
  "english-language": "English Language",
  "english-literature": "English Literature",
  science: "Science",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  geography: "Geography",
  history: "History",
  "civic-education": "Civic Education",
  "principles-of-accounts": "Principles of Accounts",
  "religious-education": "Religious Education",
  "social-studies": "Social Studies",
  "computer-studies": "Computer Studies",
  "integrated-science": "Integrated Science",
  "creative-and-technology-studies": "Creative and Technology Studies",
  "agricultural-science": "Agricultural Science",
  commerce: "Commerce",
  "design-and-technology": "Design and Technology",
  "geometrical-and-mechanical-drawing": "Geometrical and Mechanical Drawing",
  "fashion-and-fabrics": "Fashion and Fabrics",
  "metal-work": "Metal Work",
  woodwork: "Woodwork",
  "musical-arts-education": "Musical Arts Education",
  "art-and-design": "Art and Design",
  "home-management": "Home Management",
  "food-and-nutrition": "Food and Nutrition",
  cinyanja: "Cinyanja",
  french: "French",
  chinese: "Chinese",
  chitonga: "Chitonga",
  icibemba: "ICibemba",
  "special-paper-1": "Special Paper 1",
  "special-paper-2": "Special Paper 2",
};

function parseZambiSlug(url) {
  // /grade-12/mathematics-paper-2 or /grade-7/mathematics
  const m = url.match(/grade-(\d+)\/(.+)$/);
  if (!m) return null;
  const grade = parseInt(m[1]);
  const slug = m[2];
  // extract paper number
  let paperNum = 0;
  const paperMatch = slug.match(/-paper-(\d+)$/);
  if (paperMatch) {
    paperMatch[1];
    paperNum = parseInt(paperMatch[1]);
  }
  const subjectSlug = slug.replace(/-paper-\d+$/, "").replace(/-$/, "");
  const subjectName = SUBJECT_SLUG_MAP[subjectSlug] || toTitleCase(subjectSlug);
  const paperSlug = paperMatch ? `-paper-${paperMatch[1]}` : "";
  return {
    grade,
    subjectSlug,
    subjectName,
    paperNum,
    title: `G${grade} ECZ ${subjectName}${paperNum ? ` Paper ${paperNum}` : ""}`,
    source: "zambiapapers.com",
    sourceUrl: url,
  };
}

function toTitleCase(s) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function scrapeZambi() {
  const papers = [];
  for (const [grade, url] of Object.entries(ZAMBI_SITEMAPS)) {
    const xml = await fetchHtml(url);
    if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const loc of locs) {
      const parsed = parseZambiSlug(loc);
      if (parsed) papers.push(parsed);
    }
    await SLEEP(500);
  }
  return papers;
}

// --- Source 2: eczstudytool.com ---
const ECZ_PAGES = [
  { grade: 12, url: "https://eczstudytool.com/grade12-past-papers" },
  { grade: 9, url: "https://eczstudytool.com/grade9-past-papers" },
  { grade: 7, url: "https://eczstudytool.com/grade7-past-papers" },
];

function parseEczStudyText(text, grade) {
  // "G12 ECZ Mathematics 2024 P2 GCE" or "G12 ECZ Mathematics 2023 P1"
  const papers = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/G(\d+)\s+ECZ\s+(.+?)\s+(\d{4})\s+P(\d+)/i);
    if (m) {
      papers.push({
        grade: parseInt(m[1]),
        subjectName: toTitleCase(m[2].trim()),
        year: parseInt(m[3]),
        paperNum: parseInt(m[4]),
        title: `${m[1] === "12" ? "G12" : m[1] === "9" ? "G9" : "G7"} ECZ ${toTitleCase(m[2].trim())} ${m[3]} Paper ${m[4]}`,
        source: "eczstudytool.com",
      });
    }
  }
  return papers;
}

async function scrapeEczStudy() {
  const papers = [];
  for (const { url } of ECZ_PAGES) {
    const html = await fetchHtml(url);
    if (!html) continue;
    // extract link text from Google Drive download links
    const linkTexts = [...html.matchAll(/>(G\d+\s+ECZ\s+[^<]+)</g)].map((m) => m[1]);
    for (const text of linkTexts) {
      const parsed = parseEczStudyText(text, 0);
      papers.push(...parsed);
    }
    await SLEEP(500);
  }
  return papers;
}

// --- Merge + dedupe ---
function mergePapers(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    const key = `${p.grade}|${p.subjectName.toLowerCase()}|${p.paperNum}|${p.year || 0}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

async function main() {
  console.log("[scrape] starting ECZ paper scrape...");
  const zambi = await scrapeZambi();
  console.log(`[scrape] zambiapapers: ${zambi.length} papers`);
  const eczStudy = await scrapeEczStudy();
  console.log(`[scrape] eczstudytool: ${eczStudy.length} papers`);

  const merged = mergePapers([...eczStudy, ...zambi]);
  console.log(`[scrape] merged total: ${merged.length} papers`);

  // collect unique subjects
  const subjectMap = new Map();
  for (const p of merged) {
    const key = p.subjectName.toLowerCase();
    if (!subjectMap.has(key)) subjectMap.set(key, p.subjectName);
  }
  const subjects = [...subjectMap.values()].sort();

  const result = {
    scrapedAt: new Date().toISOString(),
    paperCount: merged.length,
    subjectCount: subjects.length,
    subjects,
    papers: merged,
  };

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(`[scrape] wrote ${OUT}`);
  console.log(`[scrape] subjects: ${subjects.join(", ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
