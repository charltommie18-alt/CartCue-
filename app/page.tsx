import ProductForm from "@/components/product-form";
import AccountLinks from "@/components/account-links";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">
            Cart<span className="text-orange-600">Cue</span>
          </h1>
          <AccountLinks />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Amazon content assistant
          </p>

          <h2 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900">
            Turn an Amazon product into ready-to-post social content.
          </h2>

          <p className="mt-4 text-lg text-neutral-600">
            Enter a product, choose your style and generate captions,
            hooks, hashtags and content ideas for social media.
          </p>
        </div>

        <div className="mt-8">
          <ProductForm />
        </div>
      </section>
    </main>
  );
}
