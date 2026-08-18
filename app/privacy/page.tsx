export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>

        <p className="mt-4 text-neutral-600">
          CartCue is designed to collect only information needed to
          provide its features.
        </p>

        <h2 className="mt-8 text-xl font-semibold">
          Information we process
        </h2>

        <p className="mt-3 text-neutral-600">
          Product information and generated content may be processed
          when you use CartCue's content-generation features.
        </p>

        <h2 className="mt-8 text-xl font-semibold">
          Payments
        </h2>

        <p className="mt-3 text-neutral-600">
          Amazon handles payment information for subscriptions
          purchased through Amazon Appstore. CartCue does not receive
          your Amazon payment card details.
        </p>

        <h2 className="mt-8 text-xl font-semibold">
          Data deletion
        </h2>

        <p className="mt-3 text-neutral-600">
          Use the data deletion page available in the application if
          you want to remove stored CartCue data.
        </p>
      </article>
    </main>
  );
}
