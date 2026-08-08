import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Landing() {
  usePageTitle("");
  const [stats, setStats] = useState<any>(null);
  const [keyName, setKeyName] = useState("");
  const [keyProject, setKeyProject] = useState("");
  const [keyUseCase, setKeyUseCase] = useState("");
  const [newKey, setNewKey] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/sd/stats").then((r) => r.json()).then(setStats).catch(() => setStats({ error: true }));
  }, []);

  async function genKey(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setNewKey("");
    const r = await fetch("/api/sd/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName, project: keyProject, useCase: keyUseCase }),
    });
    const d = await r.json();
    if (d.key) setNewKey(d.key);
    else setErr(d.error || "failed");
  }

  const papers = stats?.papers || "—";

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">ShimbaData</h1>
      <p className="text-gray-500 mt-3 leading-relaxed max-w-xl">
        Free, open API for Zambian public data. ECZ past papers, admin divisions, schools, health facilities, universities, and laws.
      </p>

      <div className="flex flex-wrap gap-3 mt-6">
        <Link to="/docs" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-medium">Read the Docs</Link>
        <a href="#keys" className="text-sm text-gray-600 px-4 py-2 rounded-md border border-gray-300 hover:border-gray-500 font-medium">Get a Pro key</a>
        {!localStorage.getItem("sd-user-token") && <Link to="/signup" className="text-sm text-gray-600 px-4 py-2 rounded-md border border-gray-300 hover:border-gray-500 font-medium">Sign up free</Link>}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-10">
        {[
          ["Papers", String(papers)],
          ["Wards", "1,853"],
          ["Schools", "2,357"],
          ["Health", "2,548"],
          ["Universities", "52"],
          ["Laws", "73"],
        ].map(([t, s]) => (
          <div key={t} className="border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-gray-900">{s}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wide">{t}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-10">
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-900">Free</h2>
          <p className="text-sm text-gray-500 mt-1">30 req/min. No key, no signup.</p>
          <Link to="/docs" className="text-sm text-gray-900 font-medium hover:underline mt-3 inline-block">Start building →</Link>
        </div>
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-900">Pro</h2>
          <p className="text-sm text-gray-500 mt-1">3,000 req/min. Submit your project — free.</p>
          <a href="#keys" className="text-sm text-gray-900 font-medium hover:underline mt-3 inline-block">Get a key →</a>
        </div>
      </div>

      <section id="keys" className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900">Get a Pro key</h2>
        <p className="text-sm text-gray-500 mt-1">Free. Tell us what you're building.</p>
        <form onSubmit={genKey} className="mt-4 space-y-3 border border-gray-200 rounded-lg p-5">
          <input value={keyName} onChange={(e) => setKeyName(e.target.value)} required placeholder="Your name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          <input value={keyProject} onChange={(e) => setKeyProject(e.target.value)} required placeholder="Project name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          <textarea value={keyUseCase} onChange={(e) => setKeyUseCase(e.target.value)} rows={2} placeholder="What will you use it for? (optional)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          <button className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-md hover:bg-gray-700">Submit</button>
          {newKey && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md text-sm">
              <p className="text-emerald-800 font-medium">Key issued (save it — shown once):</p>
              <code className="block mt-1 text-xs break-all select-all text-emerald-900">{newKey}</code>
            </div>
          )}
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </form>
      </section>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Try it</h2>
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm space-y-1 overflow-x-auto">
          <p className="text-gray-300">GET /api/sd/stats</p>
          <p className="text-gray-300">GET /api/sd/papers?grade=7</p>
          <p className="text-gray-300">GET /api/sd/universities?type=public</p>
          <p className="text-gray-300">GET /api/sd/laws?category=Commerce</p>
        </div>
        <Link to="/docs" className="text-sm text-gray-500 hover:text-gray-900 mt-2 inline-block">Full reference →</Link>
      </div>
    </div>
  );
}
