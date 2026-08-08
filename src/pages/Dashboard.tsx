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

  async function load() {
    const [c, k] = await Promise.all([
      fetch("/api/user/credits", { headers: { "X-User-Token": token } }).then((r) => r.json()),
      fetch("/api/sd/keys", { headers: { "X-Admin-Token": token } }).then((r) => r.json()).catch(() => []),
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
    if (d.ok) setMsg(`Purchased ${d.credits} credits! Pay via invoice.`);
    else setMsg(d.error || "failed");
    load();
  }

  const sub = credits?.subscription;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <button onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-900">Logout</button>
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {["overview", "keys", "credits", "account"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap ${tab === t ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid sm:grid-cols-3 gap-3">
          <Card label="Credits" value={credits?.balance?.toLocaleString() || "0"} />
          <Card label="Plan" value={sub ? sub.tier : "Free"} />
          <Card label="Linked JohnWeb" value={user?.linkedJohnWebEmail || "Not linked"} />
        </div>
      )}

      {tab === "keys" && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your API Keys</h2>
          {keys.length === 0 && <p className="text-sm text-gray-500">No keys yet. Keys are issued after admin approval.</p>}
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.key} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <code className="text-xs font-mono">{k.key}</code>
                  <p className="text-xs text-gray-500 mt-0.5">{k.name || "Key"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${k.status === "approved" ? "bg-green-100 text-green-700" : k.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{k.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "credits" && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Buy Credit Packs</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {PACKS.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">{p.label}</p>
                <p className="text-lg font-bold mt-1">{p.credits.toLocaleString()} <span className="text-sm font-normal text-gray-500">credits</span></p>
                <p className="text-sm text-gray-500 mt-1">K{p.price}</p>
                <button onClick={() => buyPack(p.id)} className="mt-3 w-full text-sm bg-gray-900 text-white py-1.5 rounded-md hover:bg-gray-700">Buy</button>
              </div>
            ))}
          </div>
          {msg && <p className="text-sm text-gray-700 mt-3 bg-gray-50 p-3 rounded-lg">{msg}</p>}
        </div>
      )}

      {tab === "account" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Link JohnWeb Account</h2>
            <p className="text-sm text-gray-500 mb-3">Connect your JohnWeb account to sync your developer profile.</p>
            <div className="flex gap-2">
              <input value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder="JohnWeb email"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
              <button onClick={linkJohnWeb} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700">Link</button>
            </div>
            {linkMsg && <p className="text-sm text-gray-600 mt-2">{linkMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
