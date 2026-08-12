import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 text-sm text-gray-600 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Privacy Policy</h1>
      <p className="text-xs text-gray-400">Last updated: August 2026</p>

      <Section title="1. Data collected by the Collector">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Submissions</b> — the entry you submit (school/paper/facility/law details).</li>
          <li><b>Submitter email</b> — used to contact you about your submission.</li>
          <li><b>Metadata</b> — timestamp, IP address (for abuse prevention), source ("extension" or "cli").</li>
        </ul>
        <p className="mt-2">The browser extension never reads page content automatically. "Detect from this page" only runs when you click the button, and only fills form fields with text you can see.</p>
      </Section>
      <Section title="2. How submissions are handled">
        <p>Submissions are stored as "pending" and reviewed by administrators. Approved entries are merged into the public datasets (and may flow into ShimSearch's search index). Rejected entries are retained for audit purposes but never published.</p>
      </Section>
      <Section title="3. Other data we process">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Accounts</b> — name, email, password hash (bcrypt) when you register or sign in with Auther.</li>
          <li><b>API usage</b> — IP addresses and per-key request counters for rate limiting; no query content is stored.</li>
          <li><b>Sync operations</b> — the server fetches public data from external sources (JohnWeb, OSM/HOTOSM, MOH) on a schedule.</li>
        </ul>
      </Section>
      <Section title="4. Sharing">
        <p>We do not sell personal data. Approved submissions are public data by design. Submitter emails and IPs are visible only to administrators.</p>
      </Section>
      <Section title="5. Retention & deletion">
        <p>To have a submission or your account removed, email <a className="text-gray-900 underline" href="mailto:admin@shimbadata.com">admin@shimbadata.com</a>. We will delete your records within 14 days, except where required for legal or audit reasons.</p>
      </Section>
      <Section title="6. Storage">
        <p>Data is stored on Render's infrastructure. Note: some JSON stores on the free plan may reset on redeploy. See the <Link className="text-gray-900 underline" to="/terms">Terms of Service</Link>.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section>
      <h2 className="text-[15px] font-medium text-gray-900 mb-1">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </section>
  );
}
