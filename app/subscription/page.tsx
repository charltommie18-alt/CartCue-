"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

import AmazonIAP from "@/lib/amazon-iap";

import {
  AMAZON_SUB_SKU,
  saveAmazonSubscription,
  getPlanState,
} from "@/lib/plan";

import type { PlanState } from "@/lib/plan";

export default function SubscriptionPage() {
  const [state, setState] =
    useState<PlanState | null>(null);

  const [notice, setNotice] =
    useState<string>("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    try {
      setState(getPlanState());
    } catch (error) {
      console.error(
        "Unable to load subscription state:",
        error
      );
    }
  }, []);

  async function startSubscription() {
    setNotice("");

    if (
      Capacitor.getPlatform() !==
      "android"
    ) {
      setNotice(
        "Amazon subscriptions are available in the Android Amazon Appstore version of CartCue."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * Start the Amazon subscription.
       *
       * This function does NOT unlock Pro
       * until Amazon RVS confirms the receipt.
       */
      const result =
        await AmazonIAP.subscribeToCartCue();

      if (
        !result ||
        !result.active
      ) {
        throw new Error(
          "Amazon did not confirm an active subscription."
        );
      }

      /*
       * Amazon RVS has now confirmed
       * the subscription.
       *
       * Only now save Pro locally.
       */
      saveAmazonSubscription({
        active: true,

        autoRenewing:
          result.verification
            ?.autoRenewing !== false,

        renewalDate:
          result.verification
            ?.renewalDate ?? null,

        cancelDate:
          result.verification
            ?.cancelDate ?? null,

        freeTrialEndDate:
          result.verification
            ?.freeTrialEndDate ?? null,

        receiptId:
          result.receiptId ?? null,

        verifiedAt:
          Date.now(),
      });

      setState(
        getPlanState()
      );

      setNotice(
        "Amazon verified your subscription. CartCue Pro is now active."
      );
    } catch (error) {
      console.error(
        "Amazon subscription error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      /*
       * Amazon can return an existing-purchase
       * response when the tester already owns
       * the subscription.
       *
       * Try restore automatically.
       */
      if (
        /already.?purchased/i.test(
          message
        ) ||
        /existing.?purchase/i.test(
          message
        )
      ) {
        await restoreSubscription();
        return;
      }

      /*
       * Do not show cancellation as a scary
       * error message.
       */
      if (
        /cancel/i.test(message)
      ) {
        setNotice(
          "The Amazon purchase was cancelled."
        );
      } else {
        setNotice(
          "Amazon subscription failed: " +
            message
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function restoreSubscription() {
    setNotice("");
    setLoading(true);

    try {
      if (
        Capacitor.getPlatform() !==
        "android"
      ) {
        setNotice(
          "Amazon subscription restore is available in the Android Amazon Appstore version of CartCue."
        );

        return;
      }

      /*
       * Ask Amazon for the customer's
       * existing purchases.
       */
      const result =
        await AmazonIAP.restorePurchases();

      const receipts =
        Array.isArray(
          result?.receipts
        )
          ? result.receipts
          : [];

      /*
       * Find the CartCue subscription.
       *
       * App Tester may return:
       *
       * CartCue_monthly_sub_term
       *
       * for termSku.
       */
      const receipt =
        receipts.find(
          (item) => {
            const sku =
              item?.sku || "";

            const termSku =
              item?.termSku || "";

            return (
              sku ===
                AMAZON_SUB_SKU ||
              sku ===
                "CartCue_monthly_sub" ||
              sku ===
                "CartCue_monthly_sub_term" ||
              termSku ===
                AMAZON_SUB_SKU ||
              termSku ===
                "CartCue_monthly_sub" ||
              termSku ===
                "CartCue_monthly_sub_term"
            );
          }
        );

      if (!receipt) {
        setNotice(
          "Amazon did not find a CartCue subscription to restore."
        );

        return;
      }

      if (
        !receipt.receiptId
      ) {
        setNotice(
          "Amazon returned the subscription without a receipt ID."
        );

        return;
      }

      if (
        !result?.userId
      ) {
        setNotice(
          "Amazon did not return the customer ID required for verification."
        );

        return;
      }

      /*
       * ALWAYS verify restored purchases
       * through the server.
       */
      const verification =
        await AmazonIAP.verifyAmazonReceipt(
          receipt.receiptId,
          result.userId,
          AMAZON_SUB_SKU
        );

      if (
        !verification?.active
      ) {
        setNotice(
          "Amazon found the subscription, but it is not currently active."
        );

        return;
      }

      /*
       * Save only after successful
       * Amazon RVS verification.
       */
      saveAmazonSubscription({
        active: true,

        autoRenewing:
          verification.autoRenewing !==
          false,

        renewalDate:
          verification.renewalDate ??
          null,

        cancelDate:
          verification.cancelDate ??
          null,

        freeTrialEndDate:
          verification.freeTrialEndDate ??
          null,

        receiptId:
          receipt.receiptId,

        verifiedAt:
          Date.now(),
      });

      /*
       * Tell Amazon the receipt was handled.
       */
      try {
        await AmazonIAP.fulfillPurchase(
          receipt.receiptId
        );
      } catch (fulfillError) {
        /*
         * Verification succeeded.
         *
         * Fulfillment failure should be logged,
         * but should not remove the verified
         * subscription.
         */
        console.error(
          "Amazon fulfillment error:",
          fulfillError
        );
      }

      setState(
        getPlanState()
      );

      setNotice(
        "Your Amazon subscription was verified and restored successfully."
      );
    } catch (error) {
      console.error(
        "Amazon restore error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setNotice(
        "Could not restore the Amazon subscription: " +
          message
      );
    } finally {
      setLoading(false);
    }
  }

  function manageSubscription() {
    setNotice(
      "To manage or cancel billing, use your Amazon Appstore subscription settings."
    );
  }

  const isPro =
    state?.plan === "pro";

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8">

      <div className="mx-auto max-w-5xl">

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-neutral-900">
            CartCue Pro
          </h1>

          <p className="mt-2 text-neutral-600">
            Create more content with CartCue Pro.
          </p>

        </div>

        {state && (
          <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">

            <div className="text-sm text-neutral-600">
              Current plan
            </div>

            <div className="mt-1 text-lg font-bold text-neutral-900">
              {state.plan === "pro"
                ? "Pro"
                : state.plan === "trial"
                ? "7-Day Trial"
                : "Free"}
            </div>

            {state.trialEndsAt &&
              state.plan === "trial" && (
                <div className="mt-1 text-sm text-neutral-500">
                  Trial ends{" "}
                  {new Date(
                    state.trialEndsAt
                  ).toLocaleDateString()}
                </div>
              )}

            {state.generationsLeft !==
              null && (
              <div className="mt-1 text-sm text-neutral-500">
                Generations remaining:{" "}
                {state.generationsLeft}
              </div>
            )}

          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm">
            {notice}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">

          {/* FREE */}

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-neutral-900">
              Free
            </h2>

            <p className="mt-2 text-3xl font-bold text-neutral-900">
              $0
            </p>

            <p className="mt-1 text-sm text-neutral-500">
              For basic use.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-neutral-700">

              <li>
                ✓ Basic content creation
              </li>

              <li>
                ✓ Save your content
              </li>

              <li>
                ✓ Basic features
              </li>

            </ul>

            <a
              href="/"
              className="mt-8 block rounded-xl border border-neutral-300 px-4 py-3 text-center font-semibold text-neutral-700"
            >
              Continue Free
            </a>

          </section>

          {/* PRO */}

          <section className="rounded-2xl border-2 border-orange-500 bg-white p-6 shadow-md">

            <div className="mb-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
              PRO
            </div>

            <h2 className="text-xl font-bold text-neutral-900">
              CartCue Pro
            </h2>

            <div className="mt-2">

              <span className="text-4xl font-bold text-neutral-900">
                $4.99
              </span>

              <span className="text-neutral-500">
                /month
              </span>

            </div>

            <p className="mt-2 text-sm text-neutral-500">
              7-day free trial
            </p>

            <ul className="mt-6 space-y-3 text-sm text-neutral-700">

              <li>
                ✓ Unlimited content creation
              </li>

              <li>
                ✓ Pro features
              </li>

              <li>
                ✓ Advanced tools
              </li>

              <li>
                ✓ Amazon Appstore billing
              </li>

              <li>
                ✓ 7-day free trial
              </li>

            </ul>

            {!isPro && (
              <button
                type="button"
                onClick={
                  startSubscription
                }
                disabled={loading}
                className="mt-8 w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Connecting to Amazon..."
                  : "Start 7-Day Free Trial"}
              </button>
            )}

            {isPro && (
              <div className="mt-8 rounded-xl bg-green-50 p-4 text-center font-semibold text-green-700">
                ✓ Pro is active
              </div>
            )}

            <button
              type="button"
              onClick={
                restoreSubscription
              }
              disabled={loading}
              className="mt-3 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Restore Amazon Subscription
            </button>

            {isPro && (
              <button
                type="button"
                onClick={
                  manageSubscription
                }
                className="mt-3 w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Manage / Cancel Subscription
              </button>
            )}

            <div className="mt-4 text-center">

              <p className="text-[10px] text-neutral-400">
                Amazon SKU
              </p>

              <p className="font-mono text-[10px] text-neutral-400">
                {AMAZON_SUB_SKU}
              </p>

            </div>

          </section>

        </div>

        <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-4 text-center text-xs text-neutral-600">

          <p className="font-semibold text-neutral-800">
            7-day free trial
          </p>

          <p className="mt-1">
            If you subscribe through Amazon,
            Amazon handles the subscription,
            renewal and billing.
          </p>

          <p className="mt-1">
            You can manage or cancel the
            subscription through Amazon.
          </p>

        </div>

      </div>

    </main>
  );
      }
