import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

interface FeedItem {
  id: string;
  type: string;
  title: string;
  body: string;
  dataset: string | null;
  at: string;
}

const TYPE_STYLES: Record<string, string> = {
  contribution_approved: "bg-emerald-100 text-emerald-800",
  contribution_submitted: "bg-gray-100 text-gray-600",
  contribution_rejected: "bg-red-100 text-red-700",
  paper_added: "bg-violet-100 text-violet-800",
  dataset_synced: "bg-blue-100 text-blue-800",
};

const TYPE_LABEL: Record<string, string> = {
  contribution_approved: "Published",
  contribution_submitted: "Submitted",
  contribution_rejected: "Rejected",
  paper_added: "New paper",
  dataset_synced: "Dataset",
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Feed() {
  usePageTitle("Feed");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/sd/feed?limit=50")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[#0a2540]">Feed</h1>
        <button onClick={load} className="text-sm text-emerald-700 hover:underline">refresh</button>
      </div>
      <p className="text-sm text-gray-500 mb-8">New data as it lands — approved contributions, papers, and dataset refreshes.</p>

      {loading && items.length === 0 ? (
        <p className="text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          No activity yet — the feed fills up as data is synced and contributions are approved.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-start">
              <div className={`shrink-0 mt-0.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${TYPE_STYLES[i.type] || "bg-gray-100 text-gray-600"}`}>
                {TYPE_LABEL[i.type] || i.type}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900">{i.title}</div>
                {i.body && <div className="text-[13px] text-gray-500 mt-0.5 truncate">{i.body}</div>}
                <div className="text-[11px] text-gray-400 mt-1">
                  {timeAgo(i.at)}
                  {i.dataset && <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{i.dataset}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}