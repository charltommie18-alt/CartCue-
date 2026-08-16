"use client";

import { useState } from "react";
import ProductForm from "./product-form";
import OutputTabs from "./output-tabs";
import AccountLinks from "./account-links";
import { saveKit } from "@/lib/storage";
import type { GeneratorInput, InstagramKit } from "@/lib/types";

export default function Generator() {
  const [kit, setKit] = useState<InstagramKit | null>(null);
  const [lastInput, setLastInput] = useState<GeneratorInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleGenerate(input: GeneratorInput) {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Generation failed");
      }
      const data = await res.json();
      setKit(data.kit);
      setLastInput(input);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!kit || !lastInput) return;
    saveKit({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      productName: lastInput.productName,
      style: lastInput.style,
      tone: lastInput.tone,
      kit,
    });
    setSaved(true);
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              Cart<span className="text-orange-600">Cue</span>
            </h1>
            <p className="text-sm text-neutral-500">
              Turn Amazon products into Instagram content.
            </p>
          </div>
          <a
            href="/saved"
            className="text-sm font-medium text-orange-600 hover:underline"
          >
            Saved kits
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <AccountLinks />

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <ProductForm loading={loading} onGenerate={handleGenerate} />

          <section>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading && (
              <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
                Generating your content kit…
              </div>
            )}

            {kit && !loading && (
              <OutputTabs kit={kit} onSave={handleSave} saved={saved} />
            )}

            {!kit && !loading && !error && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                Fill in a product (or click “Load sample”) and hit{" "}
                <span className="font-semibold">Generate content kit</span> to
                see captions, hashtags, reel scripts, stories, and carousel
                copy.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
               }
