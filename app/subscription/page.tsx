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

import type {
  PlanState,
} from "@/lib/plan";

export default function SubscriptionPage() {
  const [state, setState] =
    useState<PlanState | null>(null);

  const [notice, setNotice] =
    useState<string | null>(null);

  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    setState(
      getPlanState()
    );
  }, []);

  async function handleAmazonPurchase() {
    setNotice(null);

    if (
      !Capacitor.isNativePlatform()
    ) {
      setNotice(
        "Amazon subscriptions are purchased inside the Android Amazon Appstore version of CartCue."
      );
      return;
    }

    setBusy(true);

    try {
      /*
       * IMPORTANT:
       * Amazon purchase() uses the CHILD/TERM SKU.
       *
       * Amazon returns the PARENT SKU in the
       * PurchaseResponse.sku for subscriptions.
       *
       * Therefore we must NOT reject the purchase
       * just because result.sku is CartCue_monthly_sub.
       */
      const result =
        await AmazonIAP.purchase({
          sku:
            AMAZON_SUB_SKU,
        });

      if (!result?.receiptId) {
        throw new Error(
          "Amazon did not return a purchase receipt."
        );
      }

      if (!result?.userId) {
        throw new Error(
          "Amazon did not return the customer ID needed to verify the purchase."
        );
      }

      const returnedParentSku =
        result.sku || "";

      const returnedTermSku =
        result.termSku || "";

      const validSku =
        returnedParentSku ===
          AMAZON_PARENT_SKU ||
        returnedParentSku ===
          AMAZON_SUB_SKU ||
        returnedTermSku ===
          AMAZON_SUB_SKU ||
        returnedTermSku ===
          AMAZON_PARENT_SKU;

      if (!validSku) {
        throw new Error(
          `Unexpected Amazon SKU. Parent: ${returnedParentSku || "none"}, Term: ${returnedTermSku || "none"}`
        );
      }

      /*
       * NEVER activate Pro merely because Amazon's
       * purchase callback succeeded.
       *
       * Send the receipt to the server and let Amazon
       * RVS confirm the subscription.
       */
      const verification =
        await AmazonIAP.verifyAmazonReceipt(
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

      /*
       * Tell Amazon the purchase was successfully
       * processed only after server verification.
       */
      await AmazonIAP.fulfillPurchase(
        result.receiptId
      );

      activateAmazonSub(
        result.receiptId,
        verification
      );

      const newState =
        getPlanState();

      setState(
        newState
      );

      setNotice(
        "Payment successful. Your CartCue Pro subscription is active."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      if (
        message
          .toUpperCase()
          .includes(
            "ALREADY_PURCHASED"
          )
      ) {
        await restoreAmazonPurchase();
      } else if (
        !/cancel/i.test(
          message
        )
      ) {
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

    if (
      !Capacitor.isNativePlatform()
    ) {
      setNotice(
        "Restore is available in the Android Amazon Appstore version of CartCue."
      );
      return;
    }

    setBusy(true);

    try {
      const result =
        await AmazonIAP.restorePurchases();

      const receipts =
        Array.isArray(
          result?.receipts
        )
          ? result.receipts
          : [];

      /*
       * Amazon can return the parent SKU in
       * receipt.sku and the term SKU in
       * receipt.termSku.
       */
      const activeReceipt =
        receipts.find(
          (receipt) => {
            const parent =
              receipt?.sku;

            const term =
              receipt?.termSku;

            const skuMatches =
              parent ===
                AMAZON_PARENT_SKU ||
              parent ===
                AMAZON_SUB_SKU ||
              term ===
                AMAZON_SUB_SKU ||
              term ===
                AMAZON_PARENT_SKU;

            return (
              skuMatches &&
              !receipt?.canceled &&
              !!receipt?.receiptId
            );
          }
        );

      if (
        !activeReceipt?.receiptId
      ) {
        setNotice(
          "No active CartCue Amazon subscription was found."
        );
        return;
      }

      const userId =
        result?.userId;

      if (!userId) {
        throw new Error(
          "Amazon did not return the customer ID needed to restore the subscription."
        );
      }

      const verification =
        await AmazonIAP.verifyAmazonReceipt(
          activeReceipt.receiptId,
          userId,
          AMAZON_SUB_SKU
        );

      if (
        !verification?.active
      ) {
        setNotice(
          verification?.error ||
            "Amazon did not verify an active subscription."
        );
        return;
      }

      await AmazonIAP.fulfillPurchase(
        activeReceipt.receiptId
      );

      activateAmazonSub(
        activeReceipt.receiptId,
        verification
      );

      setState(
        getPlanState()
      );

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

  function handleManageSubscription() {
    setNotice(
      "To cancel, open the Amazon Appstore and manage CartCue under your subscriptions. Cancelling there stops future Amazon billing."
    );
  }

  /*
   * KEEP THE REST OF YOUR EXISTING JSX BELOW THIS POINT.
   */

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">
            Cart
            <span className="text-orange-600">
              Cue
            </span>{" "}
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

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            CartCue Pro
          </h2>

          <p className="mt-1 text-sm text-neutral-600">
            Create more content with CartCue Pro.
          </p>
        </div>

        {state && (
          <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
            <div className="text-xs text-neutral-500">
              Current plan
            </div>

            <div className="mt-1 font-semibold text-neutral-900">
              {state.plan === "pro"
                ? "CartCue Pro"
                : state.plan === "trial"
                ? "7-Day Trial"
                : "Free"}
            </div>

            {state.trialEndsAt && (
              <div className="mt-1 text-xs text-neutral-500">
                Trial ends{" "}
                {new Date(
                  state.trialEndsAt
                ).toLocaleDateString()}
              </div>
            )}

            {state.generationsLeft !==
              null && (
              <div className="mt-1 text-xs text-neutral-500">
                Generations remaining:{" "}
                {
                  state.generationsLeft
                }
              </div>
            )}

            {state.subscriptionEndAt && (
              <div className="mt-1 text-xs text-neutral-500">
                Subscription access until{" "}
                {new Date(
                  state.subscriptionEndAt
                ).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            {notice}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-xs font-semibold text-neutral-500">
              FREE
            </div>

            <div className="mt-2 text-3xl font-bold text-neutral-900">
              $0
            </div>

            <p className="mt-1 text-sm text-neutral-500">
              For basic use.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-neutral-700">
              <li>✓ Basic content creation</li>
              <li>✓ Save your content</li>
              <li>✓ Basic features</li>
            </ul>

            <button
              type="button"
              className="mt-6 w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700"
            >
              Continue Free
            </button>
          </div>

          <div className="rounded-xl border-2 border-orange-300 bg-white p-5">
            <div className="text-xs font-semibold text-orange-600">
              PRO
            </div>

            <div className="mt-2 text-xl font-bold text-neutral-900">
              CartCue Pro
            </div>

            <div className="mt-1 text-3xl font-bold text-neutral-900">
              $4.99
              <span className="text-sm font-normal text-neutral-500">
                /month
              </span>
            </div>

            <p className="mt-1 text-sm text-neutral-500">
              7-day free trial
            </p>

            <ul className="mt-5 space-y-2 text-sm text-neutral-700">
              <li>✓ Unlimited content creation</li>
              <li>✓ Pro features</li>
              <li>✓ Advanced tools</li>
              <li>✓ Amazon Appstore billing</li>
              <li>✓ 7-day free trial</li>
            </ul>

            <button
              type="button"
              disabled={busy}
              onClick={
                handleAmazonPurchase
              }
              className="mt-6 w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy
                ? "Processing Amazon payment…"
                : "Start 7-Day Free Trial"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={
                restoreAmazonPurchase
              }
              className="mt-2 w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-50"
            >
              Restore Amazon Subscription
            </button>

            <div className="mt-4 text-center text-[10px] text-neutral-400">
              Amazon Parent SKU:{" "}
              {AMAZON_PARENT_SKU}
              <br />
              Amazon Term SKU:{" "}
              {AMAZON_SUB_SKU}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4 text-center text-xs text-neutral-600">
          <strong>7-day free trial</strong>
          <br />
          If you subscribe through Amazon,
          Amazon handles the subscription,
          renewal and billing.
          <br />
          You can manage or cancel the
          subscription through Amazon.
        </div>

        <button
          type="button"
          onClick={
            handleManageSubscription
          }
          className="mt-4 w-full text-sm text-orange-600 hover:underline"
        >
          Manage Amazon Subscription
        </button>
      </main>
    </div>
  );
      }
