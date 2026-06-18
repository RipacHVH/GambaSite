import CalcoBetLogo from "./CalcoBetLogo";

const SITE = "https://calcobet.com";
const EMAIL = "legal@calcobet.com";
const COMPANY = "CalcoBet Analytics";

const pages = {
  "/terms": {
    title: "Terms of Service",
    updated: "19 June 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: `By accessing or using ${SITE} ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.`,
      },
      {
        heading: "2. Description of Service",
        body: `${COMPANY} provides statistical analysis of publicly available sports odds data. We identify mathematical edges (positive expected value) in football betting markets for informational purposes only. We are NOT a bookmaker, tipster, or financial adviser. We do not accept wagers.`,
      },
      {
        heading: "3. No Betting Advice",
        body: `Nothing on this website constitutes betting advice, financial advice, or a recommendation to place any bet. All content is for informational and educational purposes only. You are solely responsible for any bets you place. Past performance of picks does not guarantee future results. Betting involves risk and you may lose money.`,
      },
      {
        heading: "4. Eligibility",
        body: `You must be at least 18 years old (or the legal gambling age in your jurisdiction, whichever is higher) to use this Service. By using the Service you confirm you meet this requirement. You are responsible for complying with all laws applicable to sports betting in your country or region.`,
      },
      {
        heading: "5. User Accounts",
        body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate information and notify us immediately of any unauthorised use. We reserve the right to terminate accounts that violate these Terms.`,
      },
      {
        heading: "6. Subscriptions & Payments",
        body: `Pro subscriptions are billed monthly via Stripe. You may cancel at any time; access continues until the end of the paid billing period. We offer a 7-day money-back guarantee on first-time subscriptions — contact ${EMAIL} within 7 days of payment. Refunds are at our discretion after that period.`,
      },
      {
        heading: "7. Intellectual Property",
        body: `All content, algorithms, design, and code on this website are the property of ${COMPANY}. You may not reproduce, distribute, or create derivative works without our express written permission.`,
      },
      {
        heading: "8. Disclaimer of Warranties",
        body: `The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or timeliness of odds data. ${COMPANY} is not liable for any losses — financial or otherwise — arising from use of this Service.`,
      },
      {
        heading: "9. Limitation of Liability",
        body: `To the fullest extent permitted by law, ${COMPANY} shall not be liable for any indirect, incidental, special, or consequential damages, including betting losses, arising from your use of the Service. Our total liability to you shall not exceed the amount you paid us in the 30 days prior to the claim.`,
      },
      {
        heading: "10. Governing Law",
        body: `These Terms are governed by the laws of Bulgaria. Disputes shall be resolved in the courts of Sofia, Bulgaria, unless mandatory consumer protection laws in your jurisdiction provide otherwise.`,
      },
      {
        heading: "11. Changes to Terms",
        body: `We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify subscribers of material changes by email.`,
      },
      {
        heading: "12. Contact",
        body: `Questions about these Terms: ${EMAIL}`,
      },
    ],
  },

  "/privacy": {
    title: "Privacy Policy",
    updated: "19 June 2026",
    sections: [
      {
        heading: "1. Who We Are",
        body: `${COMPANY} operates ${SITE}. This policy explains how we collect, use, and protect your personal data. For GDPR purposes, we are the data controller.`,
      },
      {
        heading: "2. Data We Collect",
        body: `Account data: email address and hashed password when you register.\n\nUsage data: pages visited, features used, approximate location (country level) via server logs.\n\nPayment data: handled entirely by Stripe. We do not store card numbers or payment details.\n\nNewsletter: email address if you subscribe to daily picks.\n\nBet tracking: email address and event details if you use the "Track this bet" feature.`,
      },
      {
        heading: "3. How We Use Your Data",
        body: `To provide and improve the Service; to send daily pick emails (if subscribed); to send bet result notifications (if tracking); to process payments via Stripe; to comply with legal obligations. We do not sell your data to third parties.`,
      },
      {
        heading: "4. Legal Basis (GDPR)",
        body: `Contract: to deliver the Service you signed up for.\nLegitimate interests: security, fraud prevention, service improvement.\nConsent: newsletter emails (you can withdraw at any time via the unsubscribe link in any email).`,
      },
      {
        heading: "5. Data Retention",
        body: `Account data is retained while your account is active and for 30 days after deletion. Newsletter subscribers are removed immediately upon unsubscribe. Pick history is retained for up to 2 years for track record purposes.`,
      },
      {
        heading: "6. Third Parties",
        body: `Stripe (payment processing) — governed by Stripe's Privacy Policy.\nBrevo (email delivery) — used only to send transactional emails on our behalf.\nThe Odds API — provides odds data; no personal data is shared with them.\nCloudflare — CDN and DNS; may process IP addresses per Cloudflare's privacy policy.`,
      },
      {
        heading: "7. Your Rights (GDPR)",
        body: `You have the right to: access your personal data; correct inaccurate data; request deletion ("right to be forgotten"); restrict or object to processing; data portability. To exercise any right, email ${EMAIL}. We will respond within 30 days.`,
      },
      {
        heading: "8. Cookies",
        body: `See our Cookie Policy at ${SITE}/cookies for full details.`,
      },
      {
        heading: "9. Security",
        body: `Passwords are hashed using bcrypt. Data is transmitted over HTTPS. We take reasonable technical and organisational measures to protect your data, but no system is 100% secure.`,
      },
      {
        heading: "10. Contact & Complaints",
        body: `Data protection enquiries: ${EMAIL}. You also have the right to lodge a complaint with your local data protection authority (in Bulgaria: the Commission for Personal Data Protection, cpdp.bg).`,
      },
    ],
  },

  "/cookies": {
    title: "Cookie Policy",
    updated: "19 June 2026",
    sections: [
      {
        heading: "1. What Are Cookies",
        body: `Cookies are small text files stored on your device by your browser. They help websites remember information about your visit.`,
      },
      {
        heading: "2. Cookies We Use",
        body: `Strictly necessary cookies:\n• Authentication token (localStorage): stores your JWT login token locally so you stay signed in. Not a cookie but functionally equivalent — essential to the service.\n\nWe do not use advertising cookies, cross-site tracking cookies, or third-party analytics cookies.`,
      },
      {
        heading: "3. Third-Party Cookies",
        body: `Stripe may set cookies during the checkout process to prevent fraud and ensure payment security. These are governed by Stripe's Cookie Policy. Cloudflare may set a __cf_bm cookie for bot management.`,
      },
      {
        heading: "4. Managing Cookies",
        body: `You can control cookies through your browser settings. Disabling cookies may affect your ability to stay signed in. For the authentication token stored in localStorage, you can clear it via your browser's developer tools or by signing out.`,
      },
      {
        heading: "5. Contact",
        body: `Questions about cookies: ${EMAIL}`,
      },
    ],
  },

  "/responsible-gambling": {
    title: "Responsible Gambling",
    updated: "19 June 2026",
    sections: [
      {
        heading: "Important Notice",
        body: `${COMPANY} provides statistical analysis tools. We are not a gambling operator and do not facilitate betting. However, we take responsible gambling seriously and encourage all users to gamble responsibly if they choose to bet.`,
      },
      {
        heading: "Gambling Should Be Entertainment",
        body: `Betting should be fun and within your means. Never bet money you cannot afford to lose. Expected value analysis can improve decision-making, but there are no guaranteed wins in sports betting. All bets carry risk.`,
      },
      {
        heading: "Signs of Problem Gambling",
        body: `You may have a gambling problem if you: bet more than you can afford; borrow money to gamble; feel anxious or irritable when not gambling; chase losses; lie about your gambling; neglect work, family, or responsibilities due to gambling.`,
      },
      {
        heading: "Get Help",
        body: `If you or someone you know has a gambling problem, help is available:\n\n• GamCare (UK): gamcare.org.uk | 0808 8020 133\n• Gambling Therapy: gamblingtherapy.org (international, free)\n• BeGambleAware: begambleaware.org\n• Gamblers Anonymous: gamblersanonymous.org\n• Bulgaria: Национална линия за хазартна зависимост — consult your GP or mental health services`,
      },
      {
        heading: "Self-Exclusion & Deposit Limits",
        body: `Licensed bookmakers are required to offer self-exclusion and deposit limit tools. Use them. In the UK, Gamstop (gamstop.co.uk) allows you to self-exclude from all UKGC-licensed operators at once.`,
      },
      {
        heading: "Our Commitment",
        body: `We will never market directly to users who have indicated a gambling problem. Our Service is restricted to users aged 18 and over. If you believe our Service has contributed to gambling harm, contact us at ${EMAIL} and we will remove your account immediately.`,
      },
      {
        heading: "Age Verification",
        body: `You must be 18 years of age or older to use this Service. It is illegal for anyone under 18 to gamble in most jurisdictions. If you are under 18, please leave this site immediately.`,
      },
    ],
  },
};

export default function LegalPage({ page }) {
  const content = pages[page];
  if (!content) return null;

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* Minimal header */}
      <header style={{ background: "#060D1A", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-4xl px-6 py-4 lg:px-8 flex items-center justify-between">
          <a href="/"><CalcoBetLogo tileSize={34} textSize={22} taglineSize={8} gap={10} /></a>
          <a href="/" className="text-xs font-semibold transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>← Back to home</a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-black text-blue-deep sm:text-4xl">{content.title}</h1>
          <p className="mt-2 text-sm text-base-muted">Last updated: {content.updated}</p>
        </div>

        {/* Disclaimer banner for gambling-related pages */}
        {(page === "/terms" || page === "/responsible-gambling") && (
          <div className="mb-10 rounded-2xl border p-5" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
              {page === "/responsible-gambling"
                ? "If you are struggling with gambling, please call GamCare on 0808 8020 133 (UK) or visit gamblingtherapy.org (international)."
                : "CalcoBet provides statistical analysis only. We are not a bookmaker and do not accept bets. Nothing on this site constitutes betting or financial advice."}
            </p>
          </div>
        )}

        <div className="space-y-8">
          {content.sections.map(({ heading, body }) => (
            <div key={heading} className="rounded-2xl border border-base-border bg-white p-8 shadow-card">
              <h2 className="font-display text-base font-black text-blue-deep mb-3">{heading}</h2>
              <div className="space-y-2">
                {body.split("\n").map((line, i) => (
                  <p key={i} className={`text-sm leading-relaxed ${line === "" ? "hidden" : ""}`} style={{ color: line.startsWith("•") || line.endsWith(":") ? "#0F172A" : "#475569" }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl p-6 text-center" style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}>
          <p className="text-sm text-base-muted">Questions? Email us at <a href={`mailto:${EMAIL}`} className="font-semibold hover:underline" style={{ color: "#D97706" }}>{EMAIL}</a></p>
        </div>
      </main>

      <footer style={{ background: "#060D1A", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "#334155" }}>© {new Date().getFullYear()} CalcoBet Analytics. Statistical analysis only — not a bookmaker.</p>
          <div className="flex gap-4">
            {[["Terms", "/terms"], ["Privacy", "/privacy"], ["Cookies", "/cookies"], ["Responsible Gambling", "/responsible-gambling"]].map(([label, href]) => (
              <a key={label} href={href} className="text-xs transition-colors hover:text-white" style={{ color: "#334155" }}>{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
