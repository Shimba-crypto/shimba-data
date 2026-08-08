#!/usr/bin/env node
// Import scraped ECZ papers + subjects into JohnWeb data files
// Usage: node scripts/import-ecz.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(process.env.HOME || "/home/shimba", "food", "pro", "data");
const SCRAPE = path.join(__dirname, "ecz-import.json");

const subjects = JSON.parse(fs.readFileSync(path.join(DATA, "subjects.json"), "utf8"));
const papers = JSON.parse(fs.readFileSync(path.join(DATA, "papers.json"), "utf8"));
const scrape = JSON.parse(fs.readFileSync(SCRAPE, "utf8"));

// Build subject name -> id map
const subByName = new Map();
subjects.forEach((s) => subByName.set(s.name.toLowerCase(), s.id));

// Add new subjects
let subIdx = subjects.length;
for (const name of scrape.subjects) {
  const key = name.toLowerCase();
  if (!subByName.has(key)) {
    subIdx++;
    const code = String(1000 + subIdx * 7).slice(0, 4);
    const sub = { id: `sub-${String(subIdx).padStart(2, "0")}`, name, code, description: `ECZ ${name}` };
    subjects.push(sub);
    subByName.set(key, sub.id);
    console.log(`  + subject: ${name} (${sub.id})`);
  }
}

// Add new papers (dedupe by title+grade)
const seen = new Set(papers.map((p) => `${p.title.toLowerCase()}|${p.grade}`));
let added = 0;
for (const sp of scrape.papers) {
  const subId = subByName.get(sp.subjectName.toLowerCase());
  if (!subId) {
    console.log(`  ! no subject for: ${sp.subjectName}`);
    continue;
  }
  const title = sp.title;
  const key = `${title.toLowerCase()}|${sp.grade}`;
  if (seen.has(key)) continue;
  seen.add(key);
  papers.push({
    id: `paper-${String(papers.length + added + 1).padStart(3, "0")}`,
    subjectId: subId,
    title,
    year: sp.year || new Date().getFullYear(),
    grade: sp.grade,
    examType: "external",
    description: "",
    createdAt: new Date().toISOString(),
    source: sp.source || "scraped",
  });
  added++;
}

fs.writeFileSync(path.join(DATA, "subjects.json"), JSON.stringify(subjects, null, 2));
fs.writeFileSync(path.join(DATA, "papers.json"), JSON.stringify(papers, null, 2));

console.log(`\nImport done: +${subIdx - 19} subjects, +${added} papers`);
console.log(`Totals: ${subjects.length} subjects, ${papers.length} papers`);
