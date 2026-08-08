import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function Usage() {
  usePageTitle("Usage");
  const [key, setKey] = useState("");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const k = localStorage.getItem("sd-key") || "";
    if (k) { setKey(k); load(k); }
  }, []);

  async function load(k: string) {
    setErr(""); setData(null);
    localStorage.setItem("sd-key", k);
    const r = await fetch("/api/sd/usage", { headers: { "X-SD-Key": k } });
    if (!r.ok) { setErr("invalid key"); return; }
    setData(await r.json());
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Usage</h1>
      <p className="text-sm text-gray-500 mt-1">Enter your Pro key to see session usage. Saved locally.</p>

      <form onSubmit={(e) => { e.preventDefault(); load(key); }} className="mt-6 flex gap-2">
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="sd_..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-900" />
        <button className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700">Check</button>
      </form>

      {data && (
        <div className="mt-6 border border-gray-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Project</span><span className="text-gray-900">{data.project}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Session requests</span><span className="text-gray-900">{data.requestsThisSession}</span></div>
        </div>
      )}
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
    </div>
  );
}
