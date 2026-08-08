import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

const API = "/api/sd";

export default function Landing() {
  usePageTitle("");
  const [stats, setStats] = useState<any>(null);
  const [keyName, setKeyName] = useState("");
  const [keyEmail, setKeyEmail] = useState("");
  const [keyCompany, setKeyCompany] = useState("");
  const [keyProject, setKeyProject] = useState("");
  const [keyUseCase, setKeyUseCase] = useState("");
  const [newKey, setNewKey] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`${API}/stats`).then((r) => r.json()).then(setStats).catch(() => setStats({ error: true }));
  }, []);

  async function genKey(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setNewKey("");
    const r = await fetch(`${API}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName, email: keyEmail, company: keyCompany, project: keyProject, useCase: keyUseCase }),
    });
    const d = await r.json();
    if (d.key) setNewKey(d.key);
    else setErr(d.error || "failed");
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-[#0a2540] to-[#13315c] text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            API live · free tier available
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
            Zambia's data,<br />for <span className="text-yellow-400">developers</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Free, open API — ECZ past papers, admin divisions, schools, and health facilities.
            Build apps, bots, and study tools on top of {stats?.subjects ?? "—"} subjects, {stats?.questions ?? "—"} questions, 1,853 wards, 2,357 schools, and 2,828 health facilities.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/docs" className="bg-yellow-400 text-[#0a2540] font-bold px-6 py-3 rounded-lg hover:bg-yellow-300 transition">Read the Docs →</Link>
            <Link to="/#keys" className="border border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition">Get a Pro key</Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            ["📊", "ECZ Papers", `${stats?.subjects ?? "—"} subjects · ${stats?.questions ?? "—"} questions`],
            ["🗺️", "Admin divisions", "10 provinces · 116 districts · 1,853 wards"],
            ["🏫", "Schools", "2,357 Zambian education facilities"],
            ["🏥", "Health facilities", "2,828 clinics, hospitals & health posts"],
          ].map(([icon, t, s]) => (
            <div key={t} className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="text-3xl mb-2">{icon}</div>
              <h3 className="font-bold text-[#0a2540]">{t}</h3>
              <p className="text-sm text-gray-500 mt-1">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-center text-[#0a2540] mb-8">Tiers</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="border-2 border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-lg">Free</h3>
              <p className="text-3xl font-extrabold mt-2">$0<span className="text-base font-normal text-gray-500">/mo</span></p>
              <p className="text-xs text-gray-500 mb-2">no key required</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>✓ 30 requests / min</li>
                <li>✓ All endpoints</li>
                <li>✓ JSON + CSV</li>
                <li>✓ No signup</li>
              </ul>
              <Link to="/docs" className="mt-6 block text-center bg-gray-100 text-[#0a2540] font-semibold py-2 rounded-lg hover:bg-gray-200">Start building</Link>
            </div>
            <div className="border-2 border-yellow-400 rounded-xl p-6 relative">
              <span className="absolute -top-3 right-4 bg-yellow-400 text-[#0a2540] text-xs font-bold px-2 py-1 rounded">PRO</span>
              <h3 className="font-bold text-lg">Pro</h3>
              <p className="text-3xl font-extrabold mt-2">Free</p>
              <p className="text-xs text-gray-500 mb-2">submit your project to unlock</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>✓ 3,000 requests / min</li>
                <li>✓ Usage dashboard</li>
                <li>✓ Priority uptime</li>
                <li>✓ Your X-SD-Key header</li>
              </ul>
              <Link to="/#keys" className="mt-6 block text-center bg-yellow-400 text-[#0a2540] font-semibold py-2 rounded-lg hover:bg-yellow-300">Submit project</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="keys" className="max-w-2xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-[#0a2540] mb-2">Get a Pro key</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Free — just tell us who you are and what you're building.</p>
        <form onSubmit={genKey} className="bg-white border rounded-xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name *</label>
              <input value={keyName} onChange={(e) => setKeyName(e.target.value)} required
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company / org (optional)</label>
              <input value={keyCompany} onChange={(e) => setKeyCompany(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Acme Labs" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project name *</label>
            <input value={keyProject} onChange={(e) => setKeyProject(e.target.value)} required
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="What are you building?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What will you use it for?</label>
            <textarea value={keyUseCase} onChange={(e) => setKeyUseCase(e.target.value)} rows={2}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="A study app for Copperbelt students…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <input type="email" value={keyEmail} onChange={(e) => setKeyEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="you@project.com" />
          </div>
          <button className="w-full bg-[#0a2540] text-white font-semibold py-2.5 rounded-lg hover:bg-[#13315c] transition">Submit & get key</button>
          {newKey && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm">
              <p className="font-semibold text-green-800">Your key (save it now — shown once!):</p>
              <code className="block mt-1 bg-white p-2 rounded text-xs break-all select-all">{newKey}</code>
            </div>
          )}
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </form>
      </section>

      <section className="bg-[#0a2540] text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Try it live</h2>
          <p className="text-gray-300 text-sm mb-6">No key needed — these are open endpoints:</p>
          <div className="bg-black/30 rounded-xl p-4 text-left font-mono text-sm space-y-2 overflow-x-auto">
            <p className="text-yellow-400">GET /api/sd/stats</p>
            <p className="text-yellow-400">GET /api/sd/papers?grade=7</p>
            <p className="text-yellow-400">GET /api/sd/districts?provinceId=ZM101</p>
            <p className="text-yellow-400">GET /api/sd/health-facilities?province=Lusaka&amp;type=Hospital</p>
            <p className="text-yellow-400">GET /api/sd/schools?lat=-15.477&amp;lon=29.18&amp;radiusKm=30</p>
          </div>
          <Link to="/docs" className="mt-6 inline-block text-yellow-400 hover:underline">See full reference →</Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-4 text-white">Data sources</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/10 rounded-lg p-3"><strong className="text-yellow-300">ECZ Papers</strong><br/>from JohnWeb (our own platform)</div>
          <div className="bg-white/10 rounded-lg p-3"><strong className="text-yellow-300">Admin map</strong><br/>openadmindata.org (CC-BY-4.0)</div>
          <div className="bg-white/10 rounded-lg p-3"><strong className="text-yellow-300">Schools</strong><br/>OpenStreetMap / HDX</div>
          <div className="bg-white/10 rounded-lg p-3"><strong className="text-yellow-300">Health facilities</strong><br/>Ministry of Health Master Facility List</div>
        </div>
      </section>
    </div>
  );
}
