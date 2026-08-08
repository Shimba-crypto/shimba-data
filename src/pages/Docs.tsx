import { usePageTitle } from "../lib/usePageTitle";

const API = "/api/sd";

const endpoints = [
  { method: "GET", path: "/stats", desc: "Overview counts", params: [] },
  { method: "GET", path: "/subjects", desc: "All subjects", params: [] },
  { method: "GET", path: "/papers", desc: "Paper list", params: ["subjectId", "grade", "year"] },
  { method: "GET", path: "/papers/:id", desc: "Full paper + questions", params: [] },
  { method: "GET", path: "/questions", desc: "Question feed", params: ["subjectId", "grade", "limit"] },
  { method: "GET", path: "/search?q=", desc: "Search questions", params: ["q"] },
  { method: "GET", path: "/provinces", desc: "Provinces", params: [] },
  { method: "GET", path: "/districts", desc: "Districts", params: ["provinceId"] },
  { method: "GET", path: "/constituencies", desc: "Constituencies", params: ["districtId"] },
  { method: "GET", path: "/wards", desc: "Wards", params: ["districtId"] },
  { method: "GET", path: "/schools", desc: "Schools (lat/lon)", params: ["q", "lat", "lon", "radiusKm"] },
  { method: "GET", path: "/health-facilities", desc: "Health facilities", params: ["province", "type", "lat", "lon"] },
  { method: "GET", path: "/universities", desc: "Universities", params: ["type", "province", "town", "q"] },
  { method: "GET", path: "/sync-state", desc: "Sync status", params: [] },
];

export default function Docs() {
  usePageTitle("Docs");
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">API Reference</h1>
      <p className="text-sm text-gray-500 mt-1">
        Base: <code className="text-gray-700">{API}</code> · JSON default · append <code className="text-gray-700">?format=csv</code> for CSV
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Free: 30/min, no key · Pro: send <code>X-SD-Key</code> header → 3,000/min
      </p>

      <div className="mt-8 divide-y border-y">
        {endpoints.map((e) => (
          <div key={e.path} className="py-3 flex items-start gap-4">
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 w-10 text-center shrink-0">{e.method}</span>
            <div className="min-w-0">
              <code className="text-sm font-medium text-gray-900">{e.path}</code>
              {e.params.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {e.params.map((p) => (
                    <span key={p} className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{p}</span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-0.5">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Key management</h2>
        <pre className="bg-gray-900 text-gray-300 text-xs p-4 rounded-lg overflow-x-auto">{`POST /api/sd/keys
{ "name": "Jane", "project": "StudyApp" }
→ { "key": "sd_abc...", "status": "pending" }

GET /api/sd/usage
Headers: X-SD-Key: your-key
→ { "requestsThisSession": 42 }

GET /api/sd/keys/status/:key
→ { "status": "approved" | "pending" | "rejected" }`}</pre>
      </div>
    </div>
  );
}
