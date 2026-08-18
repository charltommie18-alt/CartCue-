"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import AmazonIAP from "@/lib/amazon-iap";
import {
  AMAZON_SUB_SKU,
  activateAmazonSub,
  getPlanState,
} from "@/lib/plan";
import type { PlanState } from "@/lib/plan";

export default function SubscriptionPage() {
  const [state, setState] = useState<PlanState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(getPlanState());
  }, []);

  async function handleAmazonPurchase() {
    setNotice(null);

    if (!Capacitor.isNativePlatform()) {
      setNotice(
        "Amazon subscriptions are purchased inside the Amazon/Android app. Open the Amazon Appstore version of CartCue to subscribe."
      );
      return;
    }

    setBusy(true);

    try {
      const result = await AmazonIAP.purchase({
        sku: AMAZON_SUB_SKU,
      });

      if (result.sku !== AMAZON_SUB_SKU) {
        throw new Error("Unexpected Amazon SKU");
      }

      activateAmazonSub();

      setState(getPlanState());

      setNotice(
        "Payment successful. Your CartCue Pro subscription is active."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      if (message.includes("ALREADY_PURCHASED")) {
        await restoreAmazonPurchase();
      } else if (!/cancel/i.test(message)) {
        setNotice(
          `Amazon purchase could not be completed: ${message}`
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function restoreAmazonPurchase() {
    setNotice(null);

    if (!Capacitor.isNativePlatform()) {
      setNotice(
        "Restore is available in the Amazon/Android app."
      );
      return;
    }

    setBusy(true);

    try {
      const result =
        await AmazonIAP.restorePurchases();

      const active = result.receipts.some(
        (r) => r.sku === AMAZON_SUB_SKU
      );

      if (!active) {
        setNotice(
          "No active CartCue Amazon subscription was found."
        );
        return;
      }

      activateAmazonSub();

      setState(getPlanState());

      setNotice(
        "Your CartCue Pro subscription has been restored."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setNotice(
        `Could not restore the Amazon subscription: ${message}`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">
            Cart<span className="text-orange-600">Cue</span>{" "}
            Subscription
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
              <span className="font-semibold uppercase">
                {state.plan}
              </span>

              {state.trialEndsAt && (
                <>
                  {" "}
                  · ends{" "}
                  {new Date(
                    state.trialEndsAt
                  ).toLocaleDateString()}
                </>
              )}

              {state.generationsLeft !== null && (
                <>
                  {" "}
                  · {state.generationsLeft} generations left
                </>
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
            <h2 className="font-semibold text-neutral-900">
              Starter
            </h2>

            <p className="mt-1 text-3xl font-bold text-neutral-900">
              $0
            </p>

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
              <span className="text-sm font-normal text-neutral-500">
                /mo
              </span>
            </p>

            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li>Unlimited content kits</li>
              <li>All 10 styles + 7 tones</li>
              <li>AI captions when enabled</li>
              <li>Works on Fire tablets & all devices</li>
            </ul>

            <button
              onClick={handleAmazonPurchase}
              disabled={busy}
              className="mt-6 w-full rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy
                ? "Processing Amazon payment…"
                : "Subscribe with Amazon — $4.99/mo"}
            </button>

            <button
              onClick={restoreAmazonPurchase}
              disabled={busy}
              className="mt-3 w-full rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
            >
              Restore Amazon Purchase
            </button>

            <p className="mt-4 text-center text-xs text-neutral-500">
              Payment and subscription management are handled
              through Amazon Appstore.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
  }
