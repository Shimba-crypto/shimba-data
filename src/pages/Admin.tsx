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

  const tabs = ["submissions", "contributions", "keys", "admins", "stats", "tools"];
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0a2540]">Admin - ShimbaData</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{me.username} <span className={`px-2 py-0.5 rounded text-xs ${me.role === "super_admin" ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-600"}`}>{me.role}</span></span>
          <button onClick={() => { setToken(""); setMe(null); localStorage.removeItem("sd-admin-token"); }} className="text-sm text-red-600 hover:underline">Logout</button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap ${tab === t ? "border-b-2 border-yellow-400 text-[#0a2540]" : "text-gray-500 hover:text-gray-800"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "submissions" && <Submissions token={token} />}
      {tab === "contributions" && <Contributions token={token} />}
      {tab === "keys" && <AllKeys token={token} />}
      {tab === "admins" && <Admins token={token} me={me} />}
      {tab === "stats" && <Stats token={token} />}
      {tab === "tools" && <Tools token={token} />}
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

function useFetch(token: string, path: string, opts?: { skip?: boolean }) {
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
  useEffect(() => { if (!opts?.skip) load(); }, [token, path]);
  return { data, loading, reload: load };
}

function Submissions({ token }: { token: string }) {
  const { data, loading, reload } = useFetch(token, "/submissions");
  async function act(key: string, action: "approve" | "reject") {
    await fetch(`${A}/keys/${key}/${action}`, { method: "POST", headers: { "X-Admin-Token": token } });
    reload();
  }
  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!data || !data.length) return <p className="text-gray-500 bg-gray-50 rounded-lg p-6">No pending submissions. All clear.</p>;
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
                {s.company && <span>{s.company}</span>}
                {s.email && <span>{s.email}</span>}
                <span>{s.createdAt?.slice(0, 10)}</span>
              </div>
              <code className="text-xs bg-gray-100 px-1 rounded mt-1 inline-block">{s.key}</code>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => act(s.key, "reject")} className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50">Reject</button>
              <button onClick={() => act(s.key, "approve")} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Contributions({ token }: { token: string }) {
  const { data, loading, reload } = useFetch(token, "/contributions?status=pending");
  async function act(id: string, action: "approve" | "reject") {
    const reason = action === "reject" ? window.prompt("Rejection reason (optional):", "") : undefined;
    await fetch(`${A}/contributions/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ reason }),
    });
    reload();
  }
  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!data || !data.length) return <p className="text-gray-500 bg-gray-50 rounded-lg p-6">No pending contributions. All clear.</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{data.length} pending — approving publishes the entry and posts it to the feed</p>
      {data.map((c: any) => (
        <div key={c.id} className="bg-white border rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[#0a2540]">{c.entry?.name || c.entry?.title} <span className="text-sm font-normal text-gray-400">→ {c.dataset}</span></p>
              <p className="text-sm text-gray-600 mt-0.5 truncate">{Object.entries(c.entry || {}).filter(([k]) => k !== "name" && k !== "title").map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`).join(" · ") || <span className="italic text-gray-400">no extra fields</span>}</p>
              <div className="flex gap-3 text-xs text-gray-400 mt-1">
                <span>{c.email || "anonymous"}</span>
                <span>via {c.source}</span>
                <span>{c.at?.slice(0, 16).replace("T", " ")}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => act(c.id, "reject")} className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50">Reject</button>
              <button onClick={() => act(c.id, "approve")} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
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

function Admins({ token, me }: { token: string; me: any }) {
  const { data, loading, reload } = useFetch(token, "/admins");
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [msg, setMsg] = useState("");
  const isSuper = me.role === "super_admin";

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch(`${A}/admins`, { method: "POST", headers: { "X-Admin-Token": token, "Content-Type": "application/json" }, body: JSON.stringify({ username: newUser, password: newPass, role: newRole }) });
    const d = await r.json();
    if (d.ok) { setMsg(`Created ${d.username} (${d.role})`); setNewUser(""); setNewPass(""); setShowForm(false); reload(); }
    else setMsg(d.error || "failed");
  }

  async function toggleActive(username: string, active: boolean) {
    if (username === me.username) return setMsg("cannot change your own status");
    await fetch(`${A}/admins/${username}`, { method: "PATCH", headers: { "X-Admin-Token": token, "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    reload();
  }

  async function removeAdmin(username: string) {
    if (username === me.username) return setMsg("cannot remove yourself");
    if (!confirm(`Remove admin "${username}"?`)) return;
    const r = await fetch(`${A}/admins/${username}`, { method: "DELETE", headers: { "X-Admin-Token": token } });
    const d = await r.json();
    if (d.ok) reload(); else setMsg(d.error || "failed");
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{(data || []).length} admin accounts - each person has their own login, no shared passwords.</p>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#0a2540] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#13315c]">+ Add admin</button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-white border rounded-xl p-5 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium mb-1">Username *</label><input value={newUser} onChange={(e) => setNewUser(e.target.value)} required className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Password *</label><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={6} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} disabled={!isSuper} className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100">
                <option value="admin">admin</option>
                {isSuper && <option value="super_admin">super_admin</option>}
              </select>
            </div>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Create admin</button>
        </form>
      )}
      {msg && <p className="text-sm text-blue-700 bg-blue-50 rounded-lg p-3">{msg}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-white border rounded-xl overflow-hidden">
          <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Username</th><th className="text-left p-3">Role</th><th className="text-left p-3">Status</th><th className="text-left p-3">Created</th><th className="text-left p-3">Actions</th></tr></thead>
          <tbody>
            {(data || []).map((a: any) => (
              <tr key={a.username} className="border-t">
                <td className="p-3 font-medium">{a.username} {a.username === me.username && <span className="text-xs text-gray-400">(you)</span>}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${a.role === "super_admin" ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-600"}`}>{a.role}</span></td>
                <td className="p-3"><span className={`text-xs ${a.active === false ? "text-red-600" : "text-green-600"}`}>{a.active === false ? "inactive" : "active"}</span></td>
                <td className="p-3 text-gray-500">{a.createdAt?.slice(0, 10)}</td>
                <td className="p-3">
                  {isSuper && a.username !== me.username && (
                    <div className="flex gap-2">
                      <button onClick={() => toggleActive(a.username, a.active === false ? true : false)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">{a.active === false ? "Activate" : "Deactivate"}</button>
                      <button onClick={() => removeAdmin(a.username)} className="text-xs px-2 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50">Remove</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stats({ token }: { token: string }) {
  const { data, loading } = useFetch(token, "/stats");
  if (loading) return <p className="text-gray-500">Loading...</p>;
  const k = data?.keys || {};
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total API calls" value={data?.api?.total ?? "-"} />
      <StatCard label="Keys: Pending" value={k.pending ?? "-"} color="text-yellow-600" />
      <StatCard label="Keys: Approved" value={k.approved ?? "-"} color="text-green-600" />
      <StatCard label="Keys: Rejected" value={k.rejected ?? "-"} color="text-red-600" />
    </div>
  );
}

function Tools({ token }: { token: string }) {
  const [msg, setMsg] = useState("");
  const [sync, setSync] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  function loadSync() {
    setLoading(true);
    fetch("/api/sd/sync-state")
      .then((r) => r.json())
      .then(setSync)
      .catch(() => setSync(null))
      .finally(() => setLoading(false));
  }
  useEffect(loadSync, []);
  async function triggerSync() {
    setMsg("syncing...");
    await fetch(`${A}/sync`, { method: "POST", headers: { "X-Admin-Token": token } });
    setMsg("sync started - refreshes in background");
    setTimeout(loadSync, 5000);
  }
  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-bold text-[#0a2540] mb-2">Data sync</h3>
        <p className="text-sm text-gray-500 mb-3">Auto-syncs every 60min. Trigger manually for fresh data.</p>
        <button onClick={triggerSync} className="bg-[#0a2540] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#13315c]">Trigger sync now</button>
        {msg && <span className="ml-3 text-sm text-gray-500">{msg}</span>}
        {!loading && sync && (
          <div className="mt-3 text-xs text-gray-500 space-y-0.5">
            <p>Last: {sync.at?.slice(0, 19)} ({sync.ms}ms)</p>
            <p>ECZ: {sync.johnweb_ok ? "ok" : "FAIL"} | Admin: {sync.admin_ok ? "ok" : "FAIL"} | Schools: {sync.schools_ok ? "ok" : "FAIL"} | Health: {sync.health_ok ? "ok" : "FAIL"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return <div className="bg-white border rounded-xl p-5"><p className="text-sm text-gray-500">{label}</p><p className={`text-2xl font-bold mt-1 ${color || "text-[#0a2540]"}`}>{value}</p></div>;
}
