import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Signup({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  usePageTitle("Sign up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const r = await fetch("/api/user/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password: pass }) });
    const d = await r.json();
    setLoading(false);
    if (d.user) {
      // auto-login after signup
      const lr = await fetch("/api/user/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pass }) });
      const ld = await lr.json();
      if (ld.token) { onLogin(ld.token, ld.user); window.location.href = "/dashboard"; }
    } else setErr(d.error || "signup failed");
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create account</h1>
      <p className="text-sm text-gray-500 mb-6">Join ShimbaData connect to manage API keys and credits.</p>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={6} placeholder="Password (6+ chars)"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={loading} className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-md hover:bg-gray-700 disabled:opacity-50">
          {loading ? "..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4 text-center">
        Have an account? <Link to="/login" className="text-gray-900 hover:underline">Login</Link>
      </p>
    </div>
  );
}
