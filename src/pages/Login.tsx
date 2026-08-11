import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Login({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  usePageTitle("Login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const r = await fetch("/api/user/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pass }) });
    const d = await r.json();
    setLoading(false);
    if (d.token) { onLogin(d.token, d.user); window.location.href = "/dashboard"; }
    else setErr(d.error || "login failed");
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-6">Log in to your ShimbaData connect account.</p>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required placeholder="Password"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={loading} className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-md hover:bg-gray-700 disabled:opacity-50">
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="my-4 flex items-center gap-3"><div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400">or</span><div className="flex-1 h-px bg-gray-200"/></div>
      <a href="/api/user/sso" className="w-full border border-violet-300 text-violet-700 text-sm font-medium py-2 rounded-md hover:bg-violet-50 flex items-center justify-center gap-2">
        <span className="font-bold text-violet-600">A</span> Login with Auther
      </a>
      <p className="text-sm text-gray-500 mt-5 text-center">
        No account? <Link to="/signup" className="text-gray-900 font-medium hover:underline">Sign up free</Link>
      </p>
    </div>
  );
}
