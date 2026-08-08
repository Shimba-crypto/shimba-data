import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const loc = useLocation();
  const nav = (to: string, label: string) => (
    <Link
      to={to}
      className={`block px-4 py-2 rounded-md text-[13px] transition ${
        loc.pathname === to
          ? "bg-gray-900 text-white font-medium"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="min-h-screen flex bg-white">
      <aside className="w-52 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="px-6 py-6">
          <Link to="/" className="text-base font-semibold text-gray-900 tracking-tight">
            Shimba<span className="text-emerald-600">Data</span>
          </Link>
          <p className="text-[11px] text-gray-400 mt-0.5">Zambia's data, for developers</p>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {nav("/", "Home")}
          {nav("/docs", "Docs")}
          {nav("/usage", "Usage")}
          {nav("/status", "Status")}
        </nav>
        <div className="px-5 py-4 text-[11px] text-gray-400 leading-relaxed border-t border-gray-200">
          Powered by <a className="text-gray-600 hover:text-gray-900" href="https://johnweb-qncu.onrender.com">JohnWeb</a>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
