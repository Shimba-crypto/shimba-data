import { Link } from "react-router-dom";

export default function Collect() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Contribute data</h1>
      <p className="text-sm text-gray-500 mt-1">
        Help grow the ShimbaData datasets — schools, ECZ papers, health facilities and laws.
        Every submission is reviewed before going public.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="font-semibold">Browser extension</h3>
          <p className="text-sm text-gray-500 mt-1">
            Fill in a form or detect candidates from the page you're viewing — nothing is
            read automatically.
          </p>
          <ol className="text-sm text-gray-600 mt-3 list-decimal pl-5 space-y-1">
            <li>Clone the repo: <code className="bg-gray-100 px-1 rounded">github.com/Shimba-crypto/shimba-data</code></li>
            <li>Open <code className="bg-gray-100 px-1 rounded">chrome://extensions</code>, enable Developer mode</li>
            <li>Load unpacked → the <code className="bg-gray-100 px-1 rounded">extension/</code> folder</li>
          </ol>
        </div>
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="font-semibold">CLI</h3>
          <p className="text-sm text-gray-500 mt-1">Submit JSON entries from the terminal.</p>
          <pre className="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg mt-3 overflow-x-auto">{`node scripts/collect.js entry.json \\
  --dataset=schools --email you@x.com

npm run collect -- entry.json --dataset=laws`}</pre>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        By submitting you agree to the <Link className="text-gray-900 underline" to="/terms">Terms</Link> and
        <Link className="text-gray-900 underline" to="/privacy"> Privacy Policy</Link>.
      </p>
    </div>
  );
}
