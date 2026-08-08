import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const cache = {};

function readFile(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, "utf-8")); }
  catch { return null; }
}

function writeFile(filename, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

export function readJSON(filename) {
  if (cache[filename] !== undefined) return cache[filename];
  return readFile(filename);
}

export function writeJSON(filename, data) {
  cache[filename] = data;
  writeFile(filename, data);
}

export function listData() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
}

export function initStorage() {
  if (fs.existsSync(DATA_DIR)) {
    fs.readdirSync(DATA_DIR).forEach((f) => {
      if (f.endsWith(".json")) cache[f] = readFile(f);
    });
  }
}
