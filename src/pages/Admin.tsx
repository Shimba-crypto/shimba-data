import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

const A = "/api/admin";

export default function Admin() {
  usePageTitle("Admin");
  const [token, setToken] = useState(localStorage.getItem("sd-admin-token") || "");
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState("submissions");

  useEffect(() => {
    if (token) {
      fetch(`${A}/me`, { headers: { "X-Admin-Token": token } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setMe(d))
        .catch(() => setMe(null));
    }
  }, [token]);

  if (!token || !me) return <Login onLogin={(t) => { setToken(t); localStorage.setItem("sd-admin-token", t); }} />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0a2540]">Admin · ShimbaData</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{me.username} <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{me.role}</span></span>
          <button onClick={() => { setToken(""); setMe(null); localStorage.removeItem("sd-admin-token"); }} className="text-sm text-red-600 hover:underline">Logout</button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {["submissions", "keys", "stats", "tools"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap ${tab === t ? "border-b-2 border-yellow-400 text-[#0a2540]" : "text-gray-500 hover:text-gray-800"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "submissions" && <Submissions token={token} />}
      {tab === "keys" && <AllKeys token={token} />}
      {tab === "stats" && <Stats tab={tab} token={token} />}
      {tab === "tools" && <Tools tab={tab} token={token} />}
    </div>
  );
}

function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r = await fetch(`${A}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: user, password: pass }) });
    const d = await r.json();
    if (d.token) onLogin(d.token);
    else setErr(d.error || "login failed");
  }
  return (
    <div className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold text-[#0a2540] mb-1">Admin Login</h1>
      <p className="text-sm text-gray-500 mb-6">ShimbaData control panel</p>
      <form onSubmit={submit} className="bg-white border rounded-xl p-6 space-y-4">
        <div><label className="block text-sm font-medium mb-1">Username</label><input value={user} onChange={(e) => setUser(e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full bg-[#0a2540] text-white py-2 rounded-lg font-semibold hover:bg-[#13315c]">Login</button>
      </form>
    </div>
  );
}

function useFetch(token: string, path: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  function load() {
    setLoading(true);
    fetch(`${A}${path}`, { headers: { "X-Admin-Token": token } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [token, path]);
  return { data, loading, reload: load };
}

function Submissions({ token }: { token: string }) {
  const { data, loading, reload } = useFetch(token, "/submissions");
  async function act(key: string, action: "approve" | "reject") {
    await fetch(`${A}/keys/${key}/${action}`, { method: "POST", headers: { "X-Admin-Token": token } });
    reload();
  }
  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!data || !data.length) return <p className="text-gray-500 bg-gray-50 rounded-lg p-6">No pending submissions. ✓</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{data.length} pending</p>
      {data.map((s: any) => (
        <div key={s.key} className="bg-white border rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[#0a2540]">{s.project} <span className="text-sm text-gray-400 font-normal">by {s.name}</span></p>
              <p className="text-sm text-gray-600 mt-0.5">{s.useCase || <span className="italic text-gray-400">no description</span>}</p>
              <div className="flex gap-3 text-xs text-gray-400 mt-1">
                {s.company && <span>🏢 {s.company}</span>}
                {s.email && <span>✉ {s.email}</span>}
                <span>🕐 {s.createdAt?.slice(0, 10)}</span>
              </div>
              <code className="text-xs bg-gray-100 px-1 rounded mt-1 inline-block">{s.key}</code>
            </div>
            <div className="flex gap-2">
              <button onClick={() => act(s.key, "reject")} className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50">Reject</button>
              <button onClick={() => act(s.key, "approve")} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllKeys({ token }: { token: string }) {
  const { data, loading } = useFetch(token, "/keys");
  if (loading) return <p className="text-gray-500">Loading...</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm bg-white border rounded-xl overflow-hidden">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Key</th><th className="text-left p-3">Project</th><th className="text-left p-3">Name</th><th className="text-left p-3">Status</th><th className="text-left p-3">Created</th></tr></thead>
        <tbody>
          {(data || []).map((k: any) => (
            <tr key={k.key} className="border-t">
              <td className="p-3 font-mono text-xs">{k.key}</td>
              <td className="p-3 font-medium">{k.project}</td>
              <td className="p-3">{k.name}</td>
              <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${k.status === "approved" ? "bg-green-100 text-green-700" : k.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{k.status}</span></td>
              <td className="p-3 text-gray-500">{k.createdAt?.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stats({ token }: { token: string }) {
  const { data, loading } = useFetch(token, "/stats");
  if (loading) return <p className="text-gray-500">Loading...</p>;
  const k = data?.keys || {};
  return (
    <div className="grid sm:grid-cols-4 gap-4">
      <StatCard label="Total API calls" value={data?.api?.total ?? "—"} />
      <StatCard label="Keys: Pending" value={k.pending ?? "—"} color="text-yellow-600" />
      <StatCard label="Keys: Approved" value={k.approved ?? "—"} color="text-green-600" />
      <StatCard label="Keys: Rejected" value={k.rejected ?? "—"} color="text-red-600" />
    </div>
  );
}

function Tools({ token }: { token: string }) {
  const [msg, setMsg] = useState("");
  const { data: sync, loading } = useFetch(token, "/sync-state");
  async function triggerSync() {
    setMsg("syncing...");
    await fetch(`${A}/sync`, { method: "POST", headers: { "X-Admin-Token": token } });
    setMsg("sync started - refreshes in background");
  }
  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-bold text-[#0a2540] mb-2">Data sync</h3>
        <p className="text-sm text-gray-500 mb-3">Auto-syncs every 60min. Trigger manually if fresh data is needed.</p>
        <button onClick={triggerSync} className="bg-[#0a2540] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#13315c]">Trigger sync now</button>
        {msg && <span className="ml-3 text-sm text-gray-500">{msg}</span>}
        {!loading && sync && (
          <div className="mt-3 text-xs text-gray-500 space-y-0.5">
            <p>Last: {sync.at?.slice(0, 19)} ({sync.ms}ms)</p>
            <p>ECZ: {sync.johnweb_ok ? "✓" : "✗"} · Admin: {sync.admin_ok ? "✓" : "✗"} · Schools: {sync.schools_ok ? "✓" : "✗"} · Health: {sync.health_ok ? "✓" : "✗"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return <div className="bg-white border rounded-xl p-5"><p className="text-sm text-gray-500">{label}</p><p className={`text-2xl font-bold mt-1 ${color || "text-[#0a2540]"}`}>{value}</p></div>;
}
