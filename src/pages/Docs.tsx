import { usePageTitle } from "../lib/usePageTitle";

const API = "/api/sd";

const endpoints = [
  { method: "GET", path: "/stats", desc: "Overview counts (ECZ subjects, papers, questions)", params: [] },
  { method: "GET", path: "/subjects", desc: "All subjects with nested papers", params: [] },
  { method: "GET", path: "/papers", desc: "Paper list", params: ["subjectId", "grade", "year"] },
  { method: "GET", path: "/papers/:id", desc: "Full paper + questions + model answers", params: [] },
  { method: "GET", path: "/questions", desc: "Question feed (across all papers)", params: ["subjectId", "grade", "limit"] },
  { method: "GET", path: "/search?q=", desc: "Search ECZ questions by keyword", params: ["q (required)"] },
  { method: "GET", path: "/provinces", desc: "Zambia provinces + coordinates", params: [] },
  { method: "GET", path: "/districts", desc: "Zambia districts", params: ["provinceId"] },
  { method: "GET", path: "/constituencies", desc: "Zambia constituencies", params: ["districtId"] },
  { method: "GET", path: "/wards", desc: "Zambia wards", params: ["districtId", "provinceId", "constituencyId"] },
  { method: "GET", path: "/schools", desc: "Zambian schools with lat/lon", params: ["q", "lat", "lon", "radiusKm", "limit"] },
  { method: "GET", path: "/health-facilities", desc: "Clinics, hospitals & health posts (MOH Master Facility List)", params: ["province", "district", "type", "ownership", "lat", "lon", "radiusKm", "limit"] },
  { method: "GET", path: "/universities", desc: "Zambian universities & higher-ed institutions", params: ["type", "province", "town", "q", "limit"] },
  { method: "GET", path: "/sync-state", desc: "Last data sync status (all sources)", params: [] },
];

export default function Docs() {
  usePageTitle("Docs");
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#0a2540] mb-2">API Reference</h1>
      <p className="text-gray-600 mb-8">Base URL: <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{API}</code>. All responses are JSON by default - append <code className="bg-gray-100 px-1 rounded">?format=csv</code> for spreadsheets.</p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-sm text-blue-900">
        <strong>Free tier:</strong> 30 requests/min, no key. <strong>Pro key:</strong> send <code>X-SD-Key: your-key</code> header → 3,000/min. Check <code>X-RateLimit-Remaining</code> in every response.
      </div>

      <div className="space-y-4">
        {endpoints.map((e) => (
          <div key={e.path} className="bg-white border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">{e.method}</span>
              <code className="font-mono text-[#0a2540] font-semibold">{e.path}</code>
            </div>
            <p className="text-sm text-gray-700">{e.desc}</p>
            {e.params.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {e.params.map((p) => (
                  <span key={p} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{p}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h3 className="font-bold text-[#0a2540] mb-3">Tiers</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4"><strong>Free</strong> - 30 req/min, no key, no signup.</div>
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4"><strong>Pro</strong> - 3,000 req/min, free. Submit your project to get a key.</div>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-[#0a2540] mb-2">Get a Pro key</h3>
          <p className="text-sm text-gray-600 mb-3">Submit your project (free):</p>
          <pre className="bg-gray-900 text-green-300 text-xs p-3 rounded-lg overflow-x-auto">{`POST /api/sd/keys
{ "name": "Jane", "project": "StudyApp" }

-> { "key": "sd_abc123..." }`}</pre>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-[#0a2540] mb-2">Usage</h3>
          <p className="text-sm text-gray-600 mb-3">Check your keys session usage:</p>
          <pre className="bg-gray-900 text-green-300 text-xs p-3 rounded-lg overflow-x-auto">{`GET /api/sd/usage
Headers: X-SD-Key: your-key

-> { "key": "...", "requestsThisSession": 42 }`}</pre>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
        <strong>Rate limits</strong> - 429 responses include an <code>upgrade</code> field pointing you to get a key. Respect the <code>X-RateLimit-Reset</code> header.
      </div>
    </div>
  );
}
