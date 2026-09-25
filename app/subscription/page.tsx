"use client";

import { useEffect, useState } from "react";

import AmazonIAP from "@/lib/amazon-iap";

import {
  AMAZON_PARENT_SKU,
  AMAZON_SUB_SKU,
  getPlanState,
  saveAmazonSubscription,
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
    if (busy) return;

    setNotice(null);
    setBusy(true);

    try {
      const result = await AmazonIAP.subscribeToCartCue();

      if (!result?.active || !result?.verification?.active) {
        throw new Error(
          "Amazon did not confirm an active subscription."
        );
      }

      saveAmazonSubscription({
        active: true,
        autoRenewing: result.verification.autoRenewing !== false,
        renewalDate: result.verification.renewalDate || null,
        cancelDate: result.verification.cancelDate || null,
        freeTrialEndDate: result.verification.freeTrialEndDate || null,
        gracePeriodEndDate:
          result.verification.gracePeriodEndDate || null,
        receiptId: result.receiptId || null,
        verifiedAt: Date.now(),
      });

      setState(getPlanState());

      setNotice(
        "Payment successful. Your CartCue Pro subscription is active."
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      if (message.toUpperCase().includes("ALREADY_PURCHASED")) {
        await restoreAmazonPurchase();
      } else if (!/cancel/i.test(message)) {
        setNotice(
          `Purchase could not be completed: ${message}`
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function restoreAmazonPurchase() {
    if (busy) return;

    setNotice(null);
    setBusy(true);

    try {
      const result = await AmazonIAP.restorePurchases();

      const receipts = Array.isArray(result?.receipts)
        ? result.receipts
        : [];

      const activeReceipt = receipts.find((receipt) => {
        const parentSku = receipt?.sku;
        const termSku = receipt?.termSku;

        const skuMatches =
          parentSku === AMAZON_PARENT_SKU ||
          parentSku === AMAZON_SUB_SKU ||
          termSku === AMAZON_SUB_SKU ||
          termSku === AMAZON_PARENT_SKU;

        return (
          skuMatches &&
          !receipt?.canceled &&
          !!receipt?.receiptId
        );
      });

      if (!activeReceipt?.receiptId || !result?.userId) {
        setNotice(
          "No active CartCue subscription was found."
        );
        return;
      }

      const verification = await AmazonIAP.verifyAmazonReceipt(
        activeReceipt.receiptId,
        result.userId,
        activeReceipt.termSku ||
          activeReceipt.sku ||
          AMAZON_SUB_SKU
      );

      if (!verification?.active) {
        setNotice(
          verification?.error ||
            "Amazon did not verify an active subscription."
        );
        return;
      }

      await AmazonIAP.fulfillPurchase(activeReceipt.receiptId);

      saveAmazonSubscription({
        active: true,
        autoRenewing: verification.autoRenewing !== false,
        renewalDate: verification.renewalDate || null,
        cancelDate: verification.cancelDate || null,
        freeTrialEndDate: verification.freeTrialEndDate || null,
        gracePeriodEndDate: verification.gracePeriodEndDate || null,
        receiptId: activeReceipt.receiptId,
        verifiedAt: Date.now(),
      });

      setState(getPlanState());

      setNotice(
        "Your CartCue Pro subscription has been restored and verified."
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      setNotice(
        `Could not restore the subscription: ${message}`
      );
    } finally {
      setBusy(false);
    }
  }

  function handleManageSubscription() {
    setNotice(
      "To cancel, open the Amazon Appstore and manage CartCue under your subscriptions. Cancelling there stops future billing."
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">
            Cart
            <span className="text-orange-600">Cue</span>{" "}
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

              {state.plan === "trial" && state.trialEndsAt && (
                <>
                  {" "}
                  · Trial ends{" "}
                  {new Date(state.trialEndsAt).toLocaleDateString()}
                </>
              )}

              {state.generationsLeft !== null && (
                <>
                  {" "}
                  · {state.generationsLeft} generations remaining
                </>
              )}

              {state.plan === "pro" && (
                <> · CartCue Pro active</>
              )}
            </p>
          </div>
        )}

        {notice && (
          <div className="rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-800 shadow-sm">
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

            <p className="mt-2 text-center text-[11px] text-neutral-500">
              Free plan
            </p>
          </div>

          <div className="rounded-xl border-2 border-orange-600 bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase text-orange-600">
              Pro Creator
            </p>

            <h2 className="mt-1 font-semibold text-neutral-900">
              CartCue Pro
            </h2>

            <p className="mt-1 text-3xl font-bold text-neutral-900">
              $4.99
              <span className="text-sm font-normal text-neutral-500">
                /mo
              </span>
            </p>

            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li>Unlimited content kits</li>
              <li>All styles and tones</li>
              <li>AI captions</li>
              <li>Appstore billing</li>
            </ul>

            <button
              type="button"
              onClick={handleAmazonPurchase}
              disabled={busy}
              className="mt-6 w-full rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy
                ? "Opening purchase…"
                : "Subscribe — $4.99/mo"}
            </button>

            <button
              type="button"
              onClick={restoreAmazonPurchase}
              disabled={busy}
              className="mt-2 w-full rounded-md px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
            >
              Restore subscription
            </button>

            <button
              type="button"
              onClick={handleManageSubscription}
              className="mt-2 w-full rounded-md border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Manage / Cancel Subscription
            </button>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm opacity-80">
            <h2 className="font-semibold text-neutral-900">
              Agency
            </h2>

            <p className="mt-1 text-3xl font-bold text-neutral-900">
              $14.99
              <span className="text-sm font-normal text-neutral-500">
                /mo
              </span>
            </p>

            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li>Everything in Pro</li>
              <li>Bulk generation</li>
              <li>Multiple social profiles</li>
              <li>Priority support</li>
            </ul>

            <p className="mt-6 rounded-md border border-neutral-200 px-4 py-2.5 text-center text-sm text-neutral-500">
              Coming soon
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-center text-xs text-neutral-600">
          <p className="font-semibold">Appstore subscription</p>

          <p className="mt-1">
            CartCue Pro is purchased and billed through the Amazon
            Appstore.
          </p>

          <p className="mt-1">
            If your subscription term includes a free trial, it is
            applied according to the subscription configuration.
          </p>

          <p className="mt-1">
            Manage or cancel through Amazon Appstore subscription
            management.
          </p>
        </div>
      </main>
    </div>
  );
      }
