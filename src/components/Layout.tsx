import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const loc = useLocation();
  const nav = (to: string, label: string, icon: string) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
        loc.pathname === to
          ? "bg-yellow-400/10 text-yellow-400 border-l-2 border-yellow-400"
          : "text-gray-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 bg-[#0a2540] text-white flex flex-col border-r border-white/10">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-bold text-[#0a2540]">S</div>
          <span className="text-lg font-bold tracking-tight">
            Shimba<span className="text-yellow-400">Data</span>
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav("/", "Home", "🏠")}
          {nav("/docs", "Docs", "📖")}
          {nav("/usage", "Usage", "📊")}
          {nav("/status", "Status", "💚")}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs text-gray-500">
          Powered by <a className="text-yellow-500/80 hover:text-yellow-400" href="https://johnweb-qncu.onrender.com">JohnWeb</a>
          <br />&copy; {new Date().getFullYear()} ShimbaData
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="border-t px-6 py-4 text-xs text-gray-400 text-center">
          Zambia's data, for developers &middot; Free &amp; open API
        </footer>
      </div>
    </div>
  );
}
