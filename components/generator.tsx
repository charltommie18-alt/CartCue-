"use client";

import { useEffect, useState } from "react";
import ProductForm from "./product-form";
import OutputTabs from "./output-tabs";
import AccountLinks from "./account-links";
import { saveKit } from "@/lib/storage";
import { consumeGeneration, getPlanState } from "@/lib/plan";
import type { PlanState } from "@/lib/plan";
import type { GeneratorInput, InstagramKit } from "@/lib/types";

export default function Generator() {
  const [kit, setKit] = useState<InstagramKit | null>(null);
  const [lastInput, setLastInput] = useState<GeneratorInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [plan, setPlan] = useState<PlanState | null>(null);

  useEffect(() => {
    setPlan(getPlanState());
  }, []);

  async function handleGenerate(input: GeneratorInput) {
    const st = getPlanState();
    if (st.generationsLeft === 0) {
      setError(
        "You're out of free generations. Upgrade to Pro ($4.99/mo via Amazon) for unlimited kits."
      );
      setPlan(st);
      return;
    }

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
      consumeGeneration();
      setPlan(getPlanState());
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
          <div className="flex gap-4">
            <a
              href="/subscription"
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              Subscription
            </a>
            <a
              href="/saved"
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              Saved kits
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {plan && (
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-600 shadow-sm">
            <span>
              Plan:{" "}
              <span className="font-semibold uppercase">{plan.plan}</span>
              {plan.generationsLeft !== null && (
                <> · {plan.generationsLeft} generations left</>
              )}
            </span>
            <a
              href="/subscription"
              className="font-medium text-orange-600 hover:underline"
            >
              Upgrade
            </a>
          </div>
        )}

        <AccountLinks />

        <div className="grid gap-6 md:grid-cols-[360px_1fr] lg:grid-cols-[420px_1fr]">
          <ProductForm loading={loading} onGenerate={handleGenerate} />

          <section>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}{" "}
                <a href="/subscription" className="font-semibold underline">
                  See plans
                </a>
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
