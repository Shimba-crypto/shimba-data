import crypto from "crypto";
import { readJSON, writeJSON } from "./storage.js";
import { addFeedItem } from "./feed.js";

export const DATASETS = ["schools", "papers", "health-facilities", "laws"];

const SCHEMAS = {
  schools: { required: ["name"], fields: ["name", "lat", "lon", "amenity", "level", "operator"] },
  papers: { required: ["title"], fields: ["title", "subject", "grade", "year", "questionsCount"] },
  "health-facilities": { required: ["name"], fields: ["name", "province", "district", "type", "ownership", "location", "status", "lat", "lon"] },
  laws: { required: ["title"], fields: ["title", "year", "category", "chapter"] },
};

function norm(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function validateContribution(dataset, entry) {
  const schema = SCHEMAS[dataset];
  if (!schema) return { error: `dataset must be one of: ${DATASETS.join(", ")}` };
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return { error: "entry must be an object" };
  for (const f of schema.required) {
    if (!entry[f] || typeof entry[f] !== "string" || !entry[f].trim()) return { error: `missing required field: ${f}` };
  }
  const clean = {};
  for (const f of schema.fields) {
    if (entry[f] !== undefined) {
      clean[f] = typeof entry[f] === "string" ? entry[f].trim().slice(0, 200) : entry[f];
    }
  }
  return { clean };
}

export function isDuplicate(dataset, entry, excludeId) {
  const list = readJSON(`${dataset}.json`) || [];
  const contribs = readJSON("contributions.json") || [];
  const key = dataset === "laws" || dataset === "papers" ? "title" : "name";
  const target = norm(entry[key]);
  const dup = (x) => x && norm(x[key]) === target;
  if (list.some(dup)) return "already exists in the dataset";
  if (contribs.some((c) => c.id !== excludeId && c.status !== "rejected" && dup(c.entry))) return "already submitted (pending review)";
  return null;
}

export function submitContribution({ dataset, entry, email, source, ip }) {
  const v = validateContribution(dataset, entry);
  if (v.error) return { error: v.error };
  const dup = isDuplicate(dataset, v.clean);
  if (dup) return { error: dup };
  const contribs = readJSON("contributions.json") || [];
  const c = {
    id: "ctr_" + crypto.randomBytes(6).toString("hex"),
    dataset,
    entry: v.clean,
    email: (email || "").toLowerCase().slice(0, 200),
    source: source || "extension",
    ip,
    status: "pending",
    at: new Date().toISOString(),
  };
  contribs.push(c);
  writeJSON("contributions.json", contribs);
  addFeedItem({
    type: "contribution_submitted",
    title: "New contribution submitted",
    body: `${nameOf(c.entry)} — ${c.dataset}`,
    dataset: c.dataset,
    meta: { id: c.id, email: c.email, source: c.source },
    public: false,
  });
  return { id: c.id, status: c.status, message: "submission received — pending review" };
}

function nameOf(entry) {
  return entry.name || entry.title || "Untitled entry";
}

export function listContributions(filter) {
  const contribs = readJSON("contributions.json") || [];
  return filter ? contribs.filter((c) => c.status === filter) : contribs;
}

export function approveContribution(id, by) {
  const contribs = readJSON("contributions.json") || [];
  const c = contribs.find((x) => x.id === id);
  if (!c) return { error: "not found" };
  if (c.status !== "pending") return { error: `already ${c.status}` };
  const dup = isDuplicate(c.dataset, c.entry, c.id);
  if (dup) return { error: dup };
  const list = readJSON(`${c.dataset}.json`) || [];
  list.push({ ...c.entry, id: `sd-${crypto.randomBytes(4).toString("hex")}` });
  writeJSON(`${c.dataset}.json`, list);
  c.status = "approved";
  c.approvedAt = new Date().toISOString();
  c.approvedBy = by;
  writeJSON("contributions.json", contribs);
  addFeedItem({
    type: "contribution_approved",
    title: `New ${c.dataset} entry published`,
    body: `${nameOf(c.entry)} (${c.dataset}) — approved by ${by}`,
    dataset: c.dataset,
    meta: { id: c.id, by, entryId: c.entry.id },
  });
  return { ok: true, id: c.id, dataset: c.dataset };
}

export function rejectContribution(id, by, reason) {
  const contribs = readJSON("contributions.json") || [];
  const c = contribs.find((x) => x.id === id);
  if (!c) return { error: "not found" };
  if (c.status !== "pending") return { error: `already ${c.status}` };
  c.status = "rejected";
  c.rejectedAt = new Date().toISOString();
  c.rejectedBy = by;
  c.rejectReason = reason || "";
  writeJSON("contributions.json", contribs);
  addFeedItem({
    type: "contribution_rejected",
    title: "Contribution rejected",
    body: `${nameOf(c.entry)} (${c.dataset}) — ${c.rejectReason || "no reason given"}`,
    dataset: c.dataset,
    meta: { id: c.id, by },
    public: false,
  });
  return { ok: true, id: c.id };
}
