export default function DeleteDataPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">
          Delete Your Data
        </h1>

        <p className="mt-4 text-neutral-600">
          CartCue stores certain application data locally on your
          device so that saved content and preferences can continue
          to work.
        </p>

        <h2 className="mt-8 text-xl font-semibold">
          Delete local CartCue data
        </h2>

        <p className="mt-3 text-neutral-600">
          You can remove locally stored CartCue data by clearing the
          application's data or uninstalling the application from
          your device.
        </p>

        <h2 className="mt-8 text-xl font-semibold">
          Subscription information
        </h2>

        <p className="mt-3 text-neutral-600">
          Amazon Appstore subscriptions are managed by Amazon.
          Removing CartCue data does not automatically cancel an
          Amazon subscription. Manage cancellation through Amazon
          Appstore.
        </p>
      </article>
    </main>
  );
}
