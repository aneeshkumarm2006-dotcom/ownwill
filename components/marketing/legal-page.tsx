type Kind = "privacy" | "terms" | "legal-disclaimer";

const TITLES: Record<Kind, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  "legal-disclaimer": "Legal Disclaimer",
};

export function LegalPage({ kind }: { kind: Kind }) {
  return (
    <section className="py-20">
      <div className="container" style={{ maxWidth: 680 }}>
        <span className="t-overline muted">Legal</span>
        <h1 className="t-h1 mt-2">{TITLES[kind]}</h1>
        <div className="t-caption muted mt-2">Last updated: May 25, 2026</div>
        <div className="t-body mt-8 stack g-4" style={{ textWrap: "pretty" }}>
          {kind === "legal-disclaimer" ? (
            <>
              <p><strong>OwnWill is not a law firm and does not provide legal advice.</strong> We provide self-serve legal forms and general information about wills and estate planning in Canada.</p>
              <p>Our templates are reviewed by Canadian estate lawyers and tailored to your province, but they are not a substitute for individual legal advice. If your circumstances are unusual or complex, we strongly recommend consulting a lawyer.</p>
              <h2 className="t-h3 mt-4">When you should see a lawyer</h2>
              <ul className="stack g-2">
                <li>You have a blended family or stepchildren you want to include unevenly.</li>
                <li>You own a business, or have significant assets outside Canada.</li>
                <li>A beneficiary has a disability requiring a trust.</li>
                <li>You expect your will to be contested.</li>
              </ul>
              <h2 className="t-h3 mt-4">Your responsibility for signing</h2>
              <p>A will is only legally valid if it is signed and witnessed correctly. We send you province-specific instructions with your document — please follow them exactly.</p>
            </>
          ) : kind === "privacy" ? (
            <>
              <p>OwnWill collects only what we need to help you build your documents. Your data is encrypted in transit and at rest, and is never sold to third parties.</p>
              <h2 className="t-h3 mt-4">What we collect</h2>
              <p>Account information (your name, email, province), the answers you give to our wizards, and basic usage analytics.</p>
              <h2 className="t-h3 mt-4">What you control</h2>
              <p>You can export everything from your Profile page, and you can delete your account permanently at any time.</p>
            </>
          ) : (
            <>
              <p>By using OwnWill, you agree to these terms. We make every reasonable effort to keep the service running smoothly and your documents accessible.</p>
              <h2 className="t-h3 mt-4">Your account</h2>
              <p>You&apos;re responsible for keeping your password safe. Let us know right away if you suspect unauthorized access.</p>
              <h2 className="t-h3 mt-4">Refunds</h2>
              <p>We offer a 30-day money-back guarantee on all paid plans, no questions asked.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
