import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function Usage() {
  usePageTitle("Usage");
  const [key, setKey] = useState("");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const k = localStorage.getItem("sd-key") || "";
    if (k) { setKey(k); load(k); }
  }, []);

  async function load(k: string) {
    setErr(""); setData(null);
    localStorage.setItem("sd-key", k);
    setSaved(k);
    const r = await fetch("/api/sd/usage", { headers: { "X-SD-Key": k } });
    if (!r.ok) { setErr("invalid key"); return; }
    setData(await r.json());
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#0a2540] mb-2">Usage dashboard</h1>
      <p className="text-gray-600 mb-6">Enter your Pro key to see session stats. Saved locally in your browser only.</p>

      <form onSubmit={(e) => { e.preventDefault(); load(key); }} className="bg-white border rounded-xl p-5 space-y-3 mb-6">
        <label className="block text-sm font-medium text-gray-700">Your X-SD-Key</label>
        <div className="flex gap-2">
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="sd_..."
            className="flex-1 border rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-yellow-400 outline-none" />
          <button className="bg-[#0a2540] text-white px-4 py-2 rounded-lg hover:bg-[#13315c]">Check</button>
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>

      {data && (
        <div className="bg-white border rounded-xl p-6 space-y-3">
          <h2 className="font-bold text-lg text-[#0a2540]">Key: {data.name}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Session requests</p>
              <p className="text-2xl font-bold text-[#0a2540]">{data.requestsThisSession}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Tier</p>
              <p className="text-2xl font-bold text-yellow-600">Pro</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Session count resets on server restart. For long-term billing we'll add monthly totals.</p>
        </div>
      )}
    </div>
  );
}
