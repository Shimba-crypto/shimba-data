import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const loc = useLocation();
  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
        loc.pathname === to ? "bg-white/10 text-yellow-300" : "text-gray-200 hover:text-yellow-200"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#0a2540] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-bold text-[#0a2540]">S</div>
            <span className="text-xl font-bold tracking-tight">
              Shimba<span className="text-yellow-400">Data</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {link("/docs", "Docs")}
            {link("/usage", "Usage")}
            {link("/status", "Status")}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[#0a2540] text-gray-400 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} ShimbaData · Zambia's data, for developers</span>
          <span className="text-xs">Powered by <a className="text-yellow-400 hover:underline" href="https://johnweb-qncu.onrender.com">JohnWeb</a> · Free &amp; open</span>
        </div>
      </footer>
    </div>
  );
}
