import { usePageTitle } from "../lib/usePageTitle";

const API = "/api/sd";

const endpoints = [
  { method: "GET", path: "/stats", desc: "Overview counts (subjects, papers, questions)", params: [] },
  { method: "GET", path: "/subjects", desc: "All subjects with nested papers", params: [] },
  { method: "GET", path: "/papers", desc: "Paper list", params: ["subjectId", "grade", "year"] },
  { method: "GET", path: "/papers/:id", desc: "Full paper + questions + model answers", params: [] },
  { method: "GET", path: "/questions", desc: "Question feed across all papers", params: ["subjectId", "grade", "limit"] },
  { method: "GET", path: "/search?q=", desc: "Search ECZ questions by keyword", params: ["q (required)"] },
  { method: "GET", path: "/provinces", desc: "Zambia's 10 provinces + coordinates", params: [] },
  { method: "GET", path: "/districts", desc: "Zambia's 116 districts", params: ["provinceId"] },
  { method: "GET", path: "/constituencies", desc: "Zambia's 156 constituencies", params: ["districtId"] },
  { method: "GET", path: "/wards", desc: "Zambia's ~1,853 wards", params: ["districtId", "provinceId", "constituencyId"] },
  { method: "GET", path: "/schools", desc: "Zambian schools with lat/lon", params: ["q", "lat", "lon", "radiusKm", "limit"] },
  { method: "GET", path: "/health-facilities", desc: "Clinics, hospitals & health posts (MOH)", params: ["province", "district", "type", "ownership", "lat", "lon", "radiusKm"] },
  { method: "GET", path: "/universities", desc: "Zambian universities & higher-ed", params: ["type (public|private)", "province", "town", "q"] },
  { method: "GET", path: "/laws", desc: "Zambian Acts of Parliament", params: ["category", "year", "q", "limit"] },
  { method: "GET", path: "/sync-state", desc: "Last data sync status (all sources)", params: [] },
];

export default function Docs() {
  usePageTitle("Docs");
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">API Reference</h1>
      <p className="text-gray-500 mt-2 leading-relaxed">
        ShimbaData is a free, open API for Zambian public data. No key required for the free tier.
        All responses are JSON by default — append <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">?format=csv</code> for spreadsheets.
      </p>

      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 text-sm">Free tier</h3>
          <p className="text-sm text-gray-500 mt-1">30 requests/min · No key · No signup</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 text-sm">Pro tier</h3>
          <p className="text-sm text-gray-500 mt-1">3,000 requests/min · Send <code>X-SD-Key</code> header</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <a href="#endpoints" className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-md">Endpoints</a>
        <a href="#auth" className="text-sm text-gray-600 px-3 py-1.5 rounded-md border border-gray-300">Key management</a>
        <a href="#examples" className="text-sm text-gray-600 px-3 py-1.5 rounded-md border border-gray-300">Examples</a>
      </div>

      <h2 id="endpoints" className="text-lg font-semibold text-gray-900 mt-10 mb-4">Endpoints</h2>
      <div className="divide-y border-y border-gray-200">
        {endpoints.map((e) => (
          <div key={e.path} className="py-3.5 flex items-start gap-4">
            <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded mt-0.5 w-12 text-center shrink-0">{e.method}</span>
            <div className="min-w-0">
              <code className="text-sm font-medium text-gray-900">{e.path}</code>
              {e.params.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {e.params.map((p) => (
                    <span key={p} className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{p}</span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 id="auth" className="text-lg font-semibold text-gray-900 mt-10 mb-4">Key management</h2>
      <pre className="bg-gray-900 text-gray-300 text-xs p-4 rounded-lg overflow-x-auto leading-relaxed">{`# Submit a key request (free, no login)
POST /api/sd/keys
{ "name": "Jane", "project": "StudyApp", "email": "jane@app.com" }
→ { "key": "sd_abc123...", "status": "pending" }

# Check your key status
GET /api/sd/keys/status/sd_abc123...
→ { "status": "approved" | "pending" | "rejected" }

# Use your key (Pro tier)
GET /api/sd/papers?grade=12
Headers: X-SD-Key: sd_abc123...
→ { 120 papers }

# Check rate-limit usage
GET /api/sd/usage
Headers: X-SD-Key: sd_abc123...
→ { "requestsThisSession": 42 }`}</pre>

      <h2 id="examples" className="text-lg font-semibold text-gray-900 mt-10 mb-4">Examples</h2>
      <pre className="bg-gray-900 text-gray-300 text-xs p-4 rounded-lg overflow-x-auto leading-relaxed">{`# Search ECZ questions
curl "https://shimbadata.onrender.com/api/sd/search?q=president"

# Schools near Lusaka (within 30km)
curl "https://shimbadata.onrender.com/api/sd/schools?lat=-15.477&lon=29.18&radiusKm=30"

# Public universities
curl "https://shimbadata.onrender.com/api/sd/universities?type=public"

# Commerce laws
curl "https://shimbadata.onrender.com/api/sd/laws?category=Commerce"

# Export to CSV
curl "https://shimbadata.onrender.com/api/sd/papers?grade=7&format=csv"`}</pre>

      <div className="mt-8 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 text-sm">Rate limits</h3>
        <p className="text-sm text-gray-500 mt-1">Exceeding the limit returns <code>429</code> with an <code>upgrade</code> field. Check <code>X-RateLimit-Remaining</code> in every response.</p>
      </div>
    </div>
  );
}
