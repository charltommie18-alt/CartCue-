"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

import AmazonIAP from "@/lib/amazon-iap";
import {
  AMAZON_PARENT_SKU,
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
        "Amazon subscriptions are purchased inside the Amazon Appstore version of CartCue. Install CartCue from the Amazon Appstore (or App Tester), then open this screen again."
      );
      return;
    }

    setBusy(true);

    try {
      const result = await AmazonIAP.purchase({
        sku: AMAZON_SUB_SKU,
      });

      if (!result?.receiptId) {
        throw new Error("Amazon did not return a purchase receipt.");
      }

      if (!result?.userId) {
        throw new Error(
          "Amazon did not return the customer ID needed to verify the purchase."
        );
      }

      const parentSku = result.sku || "";
      const termSku = result.termSku || "";

      const skuMatches =
        parentSku === AMAZON_PARENT_SKU ||
        parentSku === AMAZON_SUB_SKU ||
        termSku === AMAZON_SUB_SKU ||
        termSku === AMAZON_PARENT_SKU;

      if (!skuMatches) {
        throw new Error(
          `Unexpected Amazon SKU. Parent: ${parentSku || "none"}, Term: ${
            termSku || "none"
          }`
        );
      }

      const verification = await AmazonIAP.verifyAmazonReceipt(
        result.receiptId,
        result.userId,
        AMAZON_SUB_SKU
      );

      if (!verification?.active) {
        throw new Error(
          verification?.error ||
            "Amazon did not verify an active subscription."
        );
      }

      await AmazonIAP.fulfillPurchase(result.receiptId);

      activateAmazonSub(result.receiptId, verification);

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
        setNotice(`Amazon purchase could not be completed: ${message}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function restoreAmazonPurchase() {
    setNotice(null);

    if (!Capacitor.isNativePlatform()) {
      setNotice(
        "Restore is available in the Amazon Appstore version of CartCue."
      );
      return;
    }

    setBusy(true);

    try {
      const result = await AmazonIAP.restorePurchases();

      const receipts = Array.isArray(result?.receipts)
        ? result.receipts
        : [];

      const activeReceipt = receipts.find(
        (receipt) =>
          !receipt?.canceled &&
          (receipt?.sku === AMAZON_SUB_SKU ||
            receipt?.termSku === AMAZON_SUB_SKU ||
            receipt?.sku === AMAZON_PARENT_SKU ||
            receipt?.termSku === AMAZON_PARENT_SKU)
      );

      if (!activeReceipt?.receiptId || !result?.userId) {
        setNotice("No active CartCue Amazon subscription was found.");
        return;
      }

      const verification = await AmazonIAP.verifyAmazonReceipt(
        activeReceipt.receiptId,
        result.userId,
        activeReceipt.termSku || activeReceipt.sku || AMAZON_SUB_SKU
      );

      if (!verification?.active) {
        setNotice(
          "Amazon could not verify an active CartCue subscription."
        );
        return;
      }

      await AmazonIAP.fulfillPurchase(activeReceipt.receiptId);

      activateAmazonSub(activeReceipt.receiptId, verification);

      setState(getPlanState());
      setNotice("Your CartCue Pro subscription has been restored.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      if (!/cancel/i.test(message)) {
        setNotice(`Restore failed: ${message}`);
      }
    } finally {
      setBusy(false);
    }
  }

  const isPro = state?.plan === "pro";

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <h1 className="text-2xl font-black tracking-tight">
        CartCue Pro
      </h1>

      <p className="mt-2 text-sm text-neutral-600">
        Unlimited product kits, correct photos, and Amazon affiliate
        links. Billed by Amazon Appstore.
      </p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-black">$4.99</span>
          <span className="text-sm text-neutral-500">/ month</span>
        </div>

        <p className="mt-1 text-sm font-semibold text-orange-600">
          7-day free trial (when enabled on the Amazon term)
        </p>

        <ul className="mt-4 space-y-2 text-sm text-neutral-700">
          <li>✓ Unlimited generations</li>
          <li>✓ Correct product photos</li>
          <li>✓ Amazon affiliate links</li>
          <li>✓ Managed by Amazon billing</li>
        </ul>

        {isPro ? (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-800">
            You are on CartCue Pro.
            {state?.subscriptionEndAt && (
              <p className="mt-1 text-xs opacity-80">
                Next renewal / end:{" "}
                {new Date(state.subscriptionEndAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAmazonPurchase}
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#FF9900] to-[#FF6600] py-4 text-center text-base font-bold text-white disabled:opacity-60"
          >
            {busy
              ? "Connecting to Amazon…"
              : "Start free trial — $4.99/mo via Amazon"}
          </button>
        )}

        <button
          type="button"
          onClick={restoreAmazonPurchase}
          disabled={busy}
          className="mt-3 w-full rounded-xl border border-neutral-300 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-60"
        >
          Restore Amazon purchases
        </button>

        {notice && (
          <p
            className={`mt-4 rounded-xl p-3 text-sm ${
              /successful|restored|active/i.test(notice)
                ? "bg-green-50 text-green-800"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            {notice}
          </p>
        )}

        <p className="mt-4 text-xs text-neutral-400">
          Parent SKU: {AMAZON_PARENT_SKU}
          <br />
          Term SKU: {AMAZON_SUB_SKU}
          <br />
          Purchase works only inside the Amazon Appstore build of
          CartCue.
        </p>
      </div>
    </main>
  );
}
