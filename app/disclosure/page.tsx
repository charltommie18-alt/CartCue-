export default function DisclosurePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-10 text-sm leading-6 text-neutral-700">
      <h1 className="text-2xl font-bold text-neutral-900">
        Affiliate Disclosure & Amazon Compliance
      </h1>
      <p>Last updated: August 16, 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          1. Affiliate disclosure
        </h2>
        <p>
          CartCue is designed for affiliate marketers. If you earn commissions
          from links you share, you must disclose that clearly. The FTC
          requires disclosures to be clear and conspicuous. Use the disclosure
          CartCue generates, such as:
        </p>
        <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
          &quot;As an Amazon Associate, I earn from qualifying
          purchases.&quot;
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          2. Amazon Associates requirements
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Identify yourself as an Amazon Associate when sharing affiliate
            links.
          </li>
          <li>
            Product prices and availability can change. Always verify on
            Amazon before claiming a price in your posts.
          </li>
          <li>
            Do not use Amazon trademarks in a confusing way or in your own
            branding.
          </li>
          <li>
            Do not incentivize clicks on affiliate links or make false claims
            about products.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          3. Instagram / Meta rules
        </h2>
        <p>
          When posting sponsored or affiliate content on Instagram, follow
          Meta&apos;s policies, including using their branded-content tools
          where required and not misleading your audience.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          4. How CartCue helps you comply
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Automatic affiliate disclosure included in every kit.</li>
          <li>No false-claim or income-promise generation.</li>
          <li>No scraping of Amazon — you provide your own product data.</li>
        </ul>
      </section>

      <p className="text-xs text-neutral-500">
        This page is general information, not legal advice. Review Amazon&apos;s
        Operating Agreement and FTC Endorsement Guides, and consult a lawyer
        for your specific situation.
      </p>
    </main>
  );
}
