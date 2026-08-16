"use client";

import { useEffect, useState } from "react";
import {
  AMAZON_SUB_SKU,
  activateAmazonSub,
  getPlanState,
  startTrial,
} from "@/lib/plan";
import type { PlanState } from "@/lib/plan";

// When your Amazon checkout / Appstore link is ready, paste it here.
const AMAZON_PAYMENT_URL = "";

export default function SubscriptionPage() {
  const [state, setState] = useState<PlanState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setState(getPlanState());
  }, []);

  function handleTrial() {
    startTrial();
    setState(getPlanState());
    setNotice("7-day Pro trial started. Enjoy unlimited kits!");
  }

  function handleAmazon() {
    if (AMAZON_PAYMENT_URL) {
      window.open(AMAZON_PAYMENT_URL, "_blank");
      return;
    }
    setNotice(
      `Amazon checkout for ${AMAZON_SUB_SKU} goes live with the Fire/Android app. For the web beta: subscribe on Amazon, then tap "I subscribed on Amazon" to activate Pro.`
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">
            Cart<span className="text-orange-600">Cue</span> Subscription
          </h1>
          <a
            href="/"
            className="text-sm font-medium text-orange-600 hover:underline"
          >
            ← Back to app
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {state && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm">
            <p>
              Current plan:{" "}
              <span className="font-semibold uppercase">{state.plan}</span>
              {state.plan === "trial" && state.trialEndsAt && (
                <> · ends {new Date(state.trialEndsAt).toLocaleDateString()}</>
              )}
              {state.generationsLeft !== null && (
                <> · {state.generationsLeft} generations left</>
              )}
              {state.plan === "pro" && state.subSku && (
                <> · SKU: {state.subSku}</>
              )}
            </p>
          </div>
        )}

        {notice && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {notice}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-neutral-900">Starter</h2>
            <p className="mt-1 text-3xl font-bold text-neutral-900">$0</p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li>3 content kits / month</li>
              <li>Basic styles</li>
              <li>Save kits on this device</li>
            </ul>
            <a
              href="/"
              className="mt-6 block rounded-md border border-neutral-300 px-4 py-2.5 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Use free
            </a>
          </div>

          <div className="rounded-xl border-2 border-orange-600 bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase text-orange-600">
              Most popular
            </p>
            <h2 className="mt-1 font-semibold text-neutral-900">
              Pro Creator
            </h2>
            <p className="mt-1 text-3xl font-bold text-neutral-900">
              $4.99
              <span className="text-sm font-normal text-neutral-500">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li>Unlimited content kits</li>
              <li>All 10 styles + 7 tones</li>
              <li>AI captions (when enabled)</li>
              <li>Works on Fire tablets & all devices</li>
            </ul>

            <button
              onClick={handleAmazon}
              className="mt-6 w-full rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-amber-500"
            >
              Subscribe with Amazon — $4.99/mo
            </button>
            <button
              onClick={handleTrial}
              className="mt-2 w-full rounded-md border border-orange-600 px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50"
            >
              Start 7-day free trial
            </button>
            <button
              onClick={() => {
                activateAmazonSub();
                setState(getPlanState());
                setNotice("Pro activated with Amazon subscription.");
              }}
              className="mt-2 w-full text-xs text-neutral-500 hover:underline"
            >
              I subscribed on Amazon — activate Pro
            </button>

            <p className="mt-3 text-center font-mono text-[11px] text-neutral-400">
              SKU: {AMAZON_SUB_SKU}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm opacity-80">
            <h2 className="font-semibold text-neutral-900">Agency</h2>
            <p className="mt-1 text-3xl font-bold text-neutral-900">
              $14.99
              <span className="text-sm font-normal text-neutral-500">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li>Everything in Pro</li>
              <li>Bulk generation</li>
              <li>Multiple Instagram profiles</li>
              <li>Priority support</li>
            </ul>
            <p className="mt-6 rounded-md border border-neutral-200 px-4 py-2.5 text-center text-sm text-neutral-500">
              Coming soon
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-500">
          7-day free trial · cancel anytime · billed monthly via Amazon (
          {AMAZON_SUB_SKU})
        </p>
      </main>
    </div>
  );
            }
