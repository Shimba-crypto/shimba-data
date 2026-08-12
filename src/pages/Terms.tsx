import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 text-sm text-gray-600 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Terms of Service</h1>
      <p className="text-xs text-gray-400">Last updated: August 2026</p>

      <Section title="1. The ShimbaData Collector">
        <p>The ShimbaData Collector (browser extension and CLI) lets you contribute data — schools, ECZ papers, health facilities and laws — to the public ShimbaData datasets. Submissions are <b>not published immediately</b>: they are stored as pending and reviewed by administrators.</p>
      </Section>
      <Section title="2. What you agree to when you submit">
        <ul className="list-disc pl-5 space-y-1">
          <li>You confirm the information is accurate to the best of your knowledge.</li>
          <li>You allow ShimbaData to store, review, and — if approved — publish your submission under an open data license.</li>
          <li>We may contact you at the email you provided about your submission.</li>
          <li>Rejected submissions are kept for audit, not published.</li>
        </ul>
      </Section>
      <Section title="3. Prohibited submissions">
        <p>Do not submit personal data about other people (names of private individuals, phone numbers, home addresses), harmful or illegal content, or duplicates of existing entries. Repeated abuse may lead to your submissions being blocked.</p>
      </Section>
      <Section title="4. The API">
        <p>The ShimbaData API is provided "as is". API keys are approved per project; misuse (spam, scraping beyond limits, reselling without permission) may result in key revocation. See rate limits in the API docs.</p>
      </Section>
      <Section title="5. Disclaimers">
        <p>Data is provided for informational purposes and may be outdated or inaccurate. Always verify against official sources (ECZ, MOH, central statistics).</p>
      </Section>
      <Section title="6. Changes">
        <p>We may update these terms. Continued use of the service constitutes acceptance. Contact: <a className="text-gray-900 underline" href="mailto:admin@shimbadata.com">admin@shimbadata.com</a> · See the <Link className="text-gray-900 underline" to="/privacy">Privacy Policy</Link>.</p>
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
