import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function Status() {
  usePageTitle("Status");
  const [sync, setSync] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  async function load() {
    const [s, h] = await Promise.all([
      fetch("/api/sd/sync-state").then((r) => r.json()),
      fetch("/api/sd/_health").then((r) => r.json()),
    ]);
    setSync(s); setHealth(h);
  }
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const ok = health?.ok && sync?.ok;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#0a2540] mb-2">API status</h1>
      <p className="text-gray-600 mb-8">Live health of the ShimbaData API and its data sync.</p>

      <div className={`rounded-xl p-5 mb-6 border ${ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
          <span className={`font-bold ${ok ? "text-green-800" : "text-red-800"}`}>{ok ? "All systems operational" : "Degraded"}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-[#0a2540] mb-2">API health</h3>
          <p className="text-sm text-gray-600">Server time: <span className="font-mono">{health?.time || "—"}</span></p>
          <p className="text-sm text-gray-600">Data ready: <span className={health?.dataReady ? "text-green-600" : "text-red-600"}>{health?.dataReady ? "yes" : "no"}</span></p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-[#0a2540] mb-2">Last sync</h3>
          <p className="text-sm text-gray-600">At: <span className="font-mono">{sync?.at || "—"}</span></p>
          <p className="text-sm text-gray-600">Subjects: <strong>{sync?.subjects ?? "—"}</strong></p>
          <p className="text-sm text-gray-600">Papers: <strong>{sync?.papers ?? "—"}</strong> / details: <strong>{sync?.paperDetails ?? "—"}</strong></p>
          <p className="text-xs text-gray-400 mt-1">Took {sync?.ms ?? "—"}ms</p>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 border rounded-xl p-5">
        <h3 className="font-bold text-[#0a2540] mb-2">About the data</h3>
        <p className="text-sm text-gray-600">ShimbaData syncs copies of JohnWeb's public ECZ data every 60 minutes. JohnWeb is the source of truth — if a new paper is added there, ShimbaData picks it up on the next sync automatically.</p>
      </div>
    </div>
  );
}
