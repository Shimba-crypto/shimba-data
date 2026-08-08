import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

const PACKS = [
  { id: "starter", label: "Starter", price: 20, credits: 2000 },
  { id: "growth", label: "Growth", price: 75, credits: 10000 },
  { id: "power", label: "Power", price: 200, credits: 35000 },
];

export default function Dashboard({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  usePageTitle("Dashboard");
  const [tab, setTab] = useState("overview");
  const [credits, setCredits] = useState<any>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [linkEmail, setLinkEmail] = useState(user?.linkedJohnWebEmail || "");
  const [linkMsg, setLinkMsg] = useState("");
  const [msg, setMsg] = useState("");
  const [showReq, setShowReq] = useState(false);
  const [reqName, setReqName] = useState(user?.name || "");
  const [reqProject, setReqProject] = useState("");
  const [reqCase, setReqCase] = useState("");
  const [reqMsg, setReqMsg] = useState("");

  async function load() {
    const [c, k] = await Promise.all([
      fetch("/api/user/credits", { headers: { "X-User-Token": token } }).then((r) => r.json()),
      fetch("/api/user/keys", { headers: { "X-User-Token": token } }).then((r) => r.json()),
    ]);
    setCredits(c);
    setKeys(k);
  }
  useEffect(() => { load(); }, [token]);

  async function linkJohnWeb() {
    setLinkMsg("");
    const r = await fetch("/api/user/link-johnweb", { method: "POST", headers: { "X-User-Token": token, "Content-Type": "application/json" }, body: JSON.stringify({ email: linkEmail }) });
    const d = await r.json();
    setLinkMsg(d.ok ? "Linked!" : d.error || "failed");
    load();
  }

  async function buyPack(packId: string) {
    setMsg("");
    const r = await fetch("/api/user/buy-credits", { method: "POST", headers: { "X-User-Token": token, "Content-Type": "application/json" }, body: JSON.stringify({ packId }) });
    const d = await r.json();
    setMsg(d.ok ? `Purchased ${d.credits} credits! Invoice generated for K${d.price}.` : d.error || "failed");
    load();
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setReqMsg("");
    const r = await fetch("/api/user/key-request", { method: "POST", headers: { "X-User-Token": token, "Content-Type": "application/json" }, body: JSON.stringify({ name: reqName, project: reqProject, useCase: reqCase }) });
    const d = await r.json();
    if (d.key) { setReqMsg(`Key issued: ${d.key} — save it! Status: pending admin approval.`); setShowReq(false); setReqProject(""); setReqCase(""); load(); }
    else setReqMsg(d.error || "failed");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <button onClick={onLogout} className="text-sm text-gray-400 hover:text-gray-700">Logout</button>
      </div>

      <div className="flex gap-1 mb-8 border-b border-gray-200 overflow-x-auto">
        {["overview", "keys", "credits", "account"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap border-b-2 -mb-px transition ${tab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card label="Credits" value={credits?.balance?.toLocaleString() || "0"} accent="text-emerald-600" />
          <Card label="Keys" value={String(keys.length)} accent="text-blue-600" />
          <Card label="Linked JohnWeb" value={user?.linkedJohnWebEmail ? "Connected" : "Not linked"} accent={user?.linkedJohnWebEmail ? "text-emerald-600" : "text-gray-400"} />
        </div>
      )}

      {tab === "keys" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Your API Keys</h2>
            <button onClick={() => setShowReq(!showReq)} className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-700">+ Request key</button>
          </div>
          {showReq && (
            <form onSubmit={submitRequest} className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
              <input value={reqName} onChange={(e) => setReqName(e.target.value)} required placeholder="Your name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
              <input value={reqProject} onChange={(e) => setReqProject(e.target.value)} required placeholder="Project name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
              <textarea value={reqCase} onChange={(e) => setReqCase(e.target.value)} rows={2} placeholder="What will you use it for? (optional)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
              <button className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-md hover:bg-gray-700">Submit request</button>
              {reqMsg && <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{reqMsg}</p>}
            </form>
          )}
          {keys.length === 0 && !showReq && <p className="text-sm text-gray-500">No keys yet. Request one to get started.</p>}
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.key} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <code className="text-xs font-mono text-gray-900">{k.key}</code>
                  <p className="text-xs text-gray-500 mt-0.5">{k.project}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${k.status === "approved" ? "bg-emerald-50 text-emerald-700" : k.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{k.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "credits" && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Buy Credit Packs</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {PACKS.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-lg p-5">
                <p className="font-semibold text-gray-900">{p.label}</p>
                <p className="text-2xl font-bold mt-2">{p.credits.toLocaleString()}</p>
                <p className="text-xs text-gray-500">credits</p>
                <p className="text-lg font-semibold text-gray-900 mt-3">K{p.price}</p>
                <button onClick={() => buyPack(p.id)} className="mt-4 w-full text-sm bg-gray-900 text-white py-2 rounded-md hover:bg-gray-700 font-medium">Buy</button>
              </div>
            ))}
          </div>
          {msg && <p className="text-sm text-gray-700 mt-4 bg-gray-50 p-4 rounded-lg">{msg}</p>}
          <p className="text-xs text-gray-400 mt-4">Credits are added after payment confirmation. Invoices are processed by an admin.</p>
        </div>
      )}

      {tab === "account" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Link JohnWeb Account</h2>
            <p className="text-sm text-gray-500 mb-4">Connect your JohnWeb account to sync your developer profile across both platforms.</p>
            <div className="flex gap-2">
              <input value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder="JohnWeb email"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
              <button onClick={linkJohnWeb} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 font-medium">Link</button>
            </div>
            {linkMsg && <p className="text-sm text-gray-600 mt-2">{linkMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, accent = "text-gray-900" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
