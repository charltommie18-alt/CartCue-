export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-10 text-sm leading-6 text-neutral-700">
      <h1 className="text-2xl font-bold text-neutral-900">Privacy Policy</h1>
      <p>Last updated: August 16, 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          1. What we store
        </h2>
        <p>
          CartCue is built privacy-first. We do not require accounts, we do not
          use cookies, and we do not run analytics or trackers.
        </p>
        <p>
          Your products, generated content kits, saved links, and subscription
          status are stored only in your device&apos;s local storage. They
          never leave your device except when you press Generate (product
          details are sent to our server to create content).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          2. What our hosting provider sees
        </h2>
        <p>
          Our app runs on Render. Like any web service, Render may temporarily
          process technical data such as IP address, browser type, and request
          logs for security, rate limiting, and performance. This data is not
          sold or used for marketing.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          3. AI processing (optional)
        </h2>
        <p>
          If AI generation is enabled, the product details you submit are sent
          to the AI provider solely to generate your content. Do not submit
          personal or sensitive information in product fields.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          4. Your rights (GDPR / CCPA)
        </h2>
        <p>
          Since your data lives on your device, you control it completely:
          clearing your browser data deletes it instantly. You may contact us
          anytime with questions or requests at your-email@example.com.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          5. Children
        </h2>
        <p>
          CartCue is a marketing tool for businesses and creators. It is not
          directed to children under 16, and we do not knowingly collect data
          from children.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          6. Changes
        </h2>
        <p>
          We may update this policy. Material changes will be shown in the
          app. Continued use means acceptance.
        </p>
      </section>
    </main>
  );
}
