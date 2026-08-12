#!/usr/bin/env node
// ShimbaData Collector CLI — submit user-contributed data.
//   node scripts/collect.js schools.json --dataset=schools
//   node scripts/collect.js --dataset=laws --title "Education Act 2020" --category Education
//   node scripts/collect.js papers.json --dataset=papers --key sd_xxx --dry-run
//   cat entry.json | node scripts/collect.js --dataset=schools
//
// Auth: pass --key (X-SD-Key) or --email; otherwise you need to sign in.
// Submissions are stored "pending" and reviewed before going public.

import fs from "fs";
import path from "path";

const BASE = process.env.SHIMBA_URL || "https://shimbadata.onrender.com";

function parseArgs(argv) {
  const args = { dataset: "", key: "", email: "", base: BASE, dryRun: false, fields: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.startsWith("--") ? a.indexOf("=") : -1;
    const name = eq > -1 ? a.slice(2, eq) : a.slice(2);
    const inlineVal = eq > -1 ? a.slice(eq + 1) : null;
    if (name === "dataset") args.dataset = inlineVal ?? argv[++i] ?? "";
    else if (name === "key") args.key = inlineVal ?? argv[++i] ?? "";
    else if (name === "email") args.email = inlineVal ?? argv[++i] ?? "";
    else if (name === "base") args.base = inlineVal ?? argv[++i] ?? BASE;
    else if (name === "dry-run") args.dryRun = true;
    else if (a.startsWith("--")) {
      args.fields[name] = inlineVal ?? argv[++i] ?? "";
    } else {
      args.file = a;
    }
  }
  return args;
}

function readEntries(args) {
  if (args.file) {
    const raw = fs.readFileSync(path.resolve(args.file), "utf-8");
    const d = JSON.parse(raw);
    return Array.isArray(d) ? d : [d];
  }
  if (Object.keys(args.fields).length) return [{ ...args.fields }];
  if (!process.stdin.isTTY) {
    const raw = fs.readFileSync(0, "utf-8");
    if (raw.trim()) {
      const d = JSON.parse(raw);
      return Array.isArray(d) ? d : [d];
    }
  }
  return [];
}

function cleanEntry(entry) {
  const out = {};
  for (const [k, v] of Object.entries(entry)) {
    if (v === "" || v === undefined) continue;
    const num = k === "lat" || k === "lon" || k === "grade" || k === "year" || k === "questionsCount" ? parseFloat(v) : v;
    out[k] = Number.isNaN(num) ? v : num;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dataset) {
    console.error("Usage: collect <file.json|--field value...> --dataset=schools|papers|health-facilities|laws [--key sd_xxx] [--email you@x.com] [--dry-run]");
    process.exit(1);
  }

  const entries = readEntries(args).map(cleanEntry);
  if (!entries.length) {
    console.error("No entries found. Pass a JSON file, stdin, or --field values.");
    process.exit(1);
  }

  const headers = { "Content-Type": "application/json" };
  if (args.key) headers["X-SD-Key"] = args.key;
  if (args.email) headers["X-User-Token"] = ""; // (not used server-side for anonymous)

  let ok = 0, failed = 0;
  for (const entry of entries) {
    const body = JSON.stringify({ dataset: args.dataset, entry, email: args.email || undefined });
    if (args.dryRun) {
      console.log(`[dry-run] would submit ${args.dataset}:`, JSON.stringify(entry));
      ok++;
      continue;
    }
    try {
      const r = await fetch(`${args.base}/api/sd/collect`, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        ok++;
        console.log(`✓ [${d.id}] ${entry.name || entry.title} → ${d.status}`);
      } else {
        failed++;
        console.error(`✗ ${entry.name || entry.title}: ${d.error || r.status}`);
      }
    } catch (e) {
      failed++;
      console.error(`✗ ${entry.name || entry.title}: ${e.message}`);
    }
  }
  console.log(`\n${ok} submitted, ${failed} failed.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
