import crypto from "crypto";
import { readJSON, writeJSON } from "./storage.js";

// Activity feed. An append-only log of events (contribution approvals,
// new papers from sync, dataset refreshes) served publicly via /api/sd/feed.
// Items with public !== true are only visible to admins.

const MAX_ITEMS = 500;

export function addFeedItem({ type, title, body, dataset, meta, public: isPublic }) {
  const feed = readJSON("feed.json") || [];
  const item = {
    id: "f_" + crypto.randomBytes(6).toString("hex"),
    type,
    title,
    body: body || "",
    dataset: dataset || null,
    meta: meta || {},
    public: isPublic !== false,
    at: new Date().toISOString(),
  };
  feed.push(item);
  const trimmed = feed.length > MAX_ITEMS ? feed.slice(feed.length - MAX_ITEMS) : feed;
  writeJSON("feed.json", trimmed);
  return item;
}

export function getFeed({ limit = 30, before } = {}) {
  let items = readJSON("feed.json") || [];
  items = items.filter((i) => i.public !== false);
  if (before) items = items.filter((i) => i.at < before);
  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return items.slice(0, Math.min(limit, 100));
}

export function getAllFeed() {
  const items = readJSON("feed.json") || [];
  return items.slice().sort((a, b) => (a.at < b.at ? 1 : -1));
}
