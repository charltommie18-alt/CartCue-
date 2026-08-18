"use client";

import { useEffect, useState } from "react";
import ProductForm from "./product-form";
import OutputTabs from "./output-tabs";
import AccountLinks from "./account-links";
import TrialBanner from "./trial-banner";
import SubscribeModal from "./subscribe-modal";
import { saveKit } from "@/lib/storage";
import { getPlanState, getTrialTimeLeft, consumeGeneration } from "@/lib/plan";
import type { PlanState } from "@/lib/plan";
import type { GeneratorInput, InstagramKit } from "@/lib/types";

export default function Generator() {
  const [kit, setKit] = useState<InstagramKit | null>(null);
  const [lastInput, setLastInput] = useState<GeneratorInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [time, setTime] = useState({ hours: 72, minutes: 0, expired: false });

  useEffect(() => {
    const st = getPlanState();
    setPlan(st);
    setTime(getTrialTimeLeft());
    const id = setInterval(() => {
      setTime(getTrialTimeLeft());
      setPlan(getPlanState());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const isExpired = plan?.plan === 'free' && plan?.generationsLeft === 0;
  const isPro = plan?.plan === 'pro';

  async function handleGenerate(input: GeneratorInput) {
    const st = getPlanState();
    setPlan(st);

    // Show popup if trial expired
    if (st.plan === 'free' && st.generationsLeft === 0) {
      setShowModal(true);
      setError("Trial expired. Please subscribe to continue.");
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
        const errorData = await res.json();
        throw new Error(errorData.error || "Generation failed");
      }
      const data = await res.json();
      setKit(data.kit);
      setLastInput(input);
      
      // Consume one generation
      consumeGeneration();
      setPlan(getPlanState());
    } catch (e: any) {
      setError(e.message);
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
      <TrialBanner />

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Cart<span className="text-orange-600">Cue</span></h1>
          <div className="flex gap-4 text-sm">
            <a href="/subscription" className="font-medium text-orange-600">{isPro ? 'Pro ✓' : `${time.hours}h left`}</a>
            <a href="/saved" className="text-neutral-500">Saved</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {isExpired && (
          <div className="rounded-xl bg-black text-white p-4 text-center text-sm">
            ⏰ Trial expired - <a href="/subscription" className="font-bold text-orange-400 underline">Subscribe $4.99/mo to unlock</a>
          </div>
        )}

        <AccountLinks />

        <div className="grid gap-6 md:grid-cols-[420px_1fr]">
          {/* IMPORTANT: disabled={false} allows button to be clickable even when expired, so modal can trigger */}
          <ProductForm loading={loading} onGenerate={handleGenerate} disabled={false} />

          <section>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error} {isExpired && <a href="/subscription" className="font-bold underline">Subscribe</a>}
              </div>
            )}
            {loading && <div className="rounded-xl bg-white p-8 text-center text-sm">Generating with Amazon photo...</div>}
            {kit && !loading && <OutputTabs kit={kit} onSave={handleSave} saved={saved} />}
            {!kit && !loading && !error && (
              <div className="rounded-xl border-dashed border bg-white p-8 text-center text-sm text-neutral-500">
                {isExpired ? 'Trial expired. Click generate to subscribe.' : 'Paste Amazon link and hit Generate'}
              </div>
            )}
          </section>
        </div>
      </main>

      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}
    </div>
  );
          }
