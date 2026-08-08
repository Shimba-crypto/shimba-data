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
  const admin = ds.admin || {};
  const ecz = ds.ecz || {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#0a2540] mb-2">API status</h1>
      <p className="text-gray-600 mb-8">Live health of ShimbaData and all its data sources.</p>

      <div className={`rounded-xl p-5 mb-6 border ${ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
          <span className={`font-bold ${ok ? "text-green-800" : "text-red-800"}`}>{ok ? "All systems operational" : "Degraded"}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-[#0a2540] mb-2">ECZ Papers</h3>
          <p className="text-sm text-gray-600">Subjects: <strong>{ecz.subjects ?? "—"}</strong></p>
          <p className="text-sm text-gray-600">Papers: <strong>{ecz.papers ?? "—"}</strong></p>
          <p className="text-sm text-gray-600">Questions: <strong>{ecz.questions ?? "—"}</strong></p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-[#0a2540] mb-2">Admin divisions</h3>
          <p className="text-sm text-gray-600">Provinces: <strong>{admin.provinces ?? "—"}</strong></p>
          <p className="text-sm text-gray-600">Districts: <strong>{admin.districts ?? "—"}</strong></p>
          <p className="text-sm text-gray-600">Wards: <strong>{admin.wards ?? "—"}</strong></p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-[#0a2540] mb-2">Schools</h3>
          <p className="text-sm text-gray-600">Facilities: <strong>{ds.schools ?? "—"}</strong></p>
          <p className="text-xs text-gray-400 mt-1">from OpenStreetMap</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-bold text-[#0a2540] mb-2">Last sync</h3>
        <p className="text-sm text-gray-600">At: <span className="font-mono">{sync?.at || "—"}</span></p>
        <p className="text-sm text-gray-600">Duration: <strong>{sync?.ms ? sync.ms + "ms" : "—"}</strong></p>
        <p className="text-sm text-gray-600">JohnWeb: <span className={sync?.johnweb_ok ? "text-green-600" : "text-red-600"}>{sync?.johnweb_ok ? "ok" : "failed"}</span></p>
        <p className="text-sm text-gray-600">Admin: <span className={sync?.admin_ok ? "text-green-600" : "text-red-600"}>{sync?.admin_ok ? "ok" : "failed"}</span></p>
        <p className="text-sm text-gray-600">Schools: <span className={sync?.schools_ok ? "text-green-600" : "text-red-600"}>{sync?.schools_ok ? "ok" : "failed"}</span></p>
      </div>

      <div className="mt-8 bg-gray-50 border rounded-xl p-5">
        <h3 className="font-bold text-[#0a2540] mb-2">Data sources</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li><strong>ECZ Papers</strong> — synced from JohnWeb's public API (our own platform)</li>
          <li><strong>Admin divisions</strong> — openadmindata.org, CC-BY-4.0</li>
          <li><strong>Schools</strong> — OpenStreetMap via HDX</li>
        </ul>
        <p className="text-xs text-gray-400 mt-2">All sources refresh every 60 minutes. Sources are the truth — ShimbaData mirrors them.</p>
      </div>
    </div>
  );
}
