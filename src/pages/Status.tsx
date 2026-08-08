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

  const ok = health?.ok;
  const ds = health?.datasets || {};

  const sources = [
    ["ECZ", sync?.johnweb_ok],
    ["Admin", sync?.admin_ok],
    ["Schools", sync?.schools_ok],
    ["Health", sync?.health_ok],
    ["Universities", sync?.universities_ok],
    ["Laws", sync?.laws_ok],
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Status</h1>

      <div className={`mt-4 inline-flex items-center gap-2 text-sm ${ok ? "text-emerald-700" : "text-red-600"}`}>
        <span className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
        {ok ? "Operational" : "Degraded"}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Datasets</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Papers" value={ds.ecz?.papers ?? "—"} />
          <Stat label="Wards" value={ds.admin?.wards ?? "—"} />
          <Stat label="Schools" value={ds.schools ?? "—"} />
          <Stat label="Health" value={ds.healthFacilities ?? "—"} />
          <Stat label="Universities" value={ds.universities ?? "—"} />
          <Stat label="Laws" value={ds.laws ?? "—"} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Sources</h2>
        <div className="space-y-2">
          {sources.map(([name, active]) => (
            <div key={name} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{name}</span>
              <span className={`text-xs ${active ? "text-emerald-600" : "text-red-600"}`}>{active ? "synced" : "failed"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        Last sync: {sync?.at ? new Date(sync.at).toLocaleString() : "—"} · {sync?.ms}ms
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
