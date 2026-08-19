"use client";

import { useEffect, useState } from "react";
import AmazonIAP, {
  AMAZON_SUBSCRIPTION_SKU,
} from "@/lib/amazon-iap";

import {
  getPlanState,
  getTrialTimeLeft,
  saveAmazonSubscription,
} from "@/lib/plan";

type PlanState = ReturnType<
  typeof getPlanState
>;

export default function SubscriptionPage() {
  const [plan, setPlan] =
    useState<PlanState | null>(null);

  const [time, setTime] = useState(
    getTrialTimeLeft()
  );

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    refresh();

    const timer = setInterval(
      refresh,
      60000
    );

    return () =>
      clearInterval(timer);
  }, []);

  function refresh() {
    setPlan(getPlanState());
    setTime(getTrialTimeLeft());
  }

  async function handleSubscribe() {
    setLoading(true);
    setMessage("");

    try {
      const result =
        await AmazonIAP.purchase({
          sku:
            AMAZON_SUBSCRIPTION_SKU,
        });

      if (!result?.success) {
        throw new Error(
          "Amazon did not complete the purchase."
        );
      }

      /*
       * The receipt must be verified by our
       * server before Pro access is granted.
       */
      const response = await fetch(
        "/api/amazon/verify",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            receiptId:
              result.receiptId,
            userId:
              undefined,
            sku:
              result.sku,
          }),
        }
      );

      const verification =
        await response.json();

      if (!response.ok ||
          !verification.active) {
        throw new Error(
          verification.error ||
            "Amazon payment could not be verified yet."
        );
      }

      saveAmazonSubscription({
        active: true,
        autoRenewing:
          verification.autoRenewing !==
          false,
        renewalDate:
          verification.renewalDate ||
          null,
        cancelDate:
          verification.cancelDate ||
          null,
        freeTrialEndDate:
          verification.freeTrialEndDate ||
          null,
        receiptId:
          result.receiptId,
        verifiedAt: Date.now(),
      });

      refresh();

      setMessage(
        "Your Amazon subscription is active. 🎉"
      );

      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (error: any) {
      setMessage(
        error?.message ||
          "Amazon subscription could not be started."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    setMessage("");

    try {
      const result =
        await AmazonIAP.restorePurchases();

      if (
        !result?.receipts ||
        result.receipts.length === 0
      ) {
        setMessage(
          "No active Amazon subscription was found."
        );
        return;
      }

      const receipt =
        result.receipts.find(
          (item) =>
            item.sku ===
              AMAZON_SUBSCRIPTION_SKU &&
            !item.canceled
        );

      if (!receipt) {
        setMessage(
          "No active CartCue Pro subscription was found."
        );
        return;
      }

      const response = await fetch(
        "/api/amazon/verify",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            receiptId:
              receipt.receiptId,
            sku:
              receipt.sku,
          }),
        }
      );

      const verification =
        await response.json();

      if (!response.ok ||
          !verification.active) {
        throw new Error(
          "Amazon could not verify the restored subscription."
        );
      }

      saveAmazonSubscription({
        active: true,
        autoRenewing:
          verification.autoRenewing !==
          false,
        renewalDate:
          verification.renewalDate ||
          null,
        cancelDate:
          verification.cancelDate ||
          null,
        freeTrialEndDate:
          verification.freeTrialEndDate ||
          null,
        receiptId:
          receipt.receiptId,
        verifiedAt: Date.now(),
      });

      refresh();

      setMessage(
        "Subscription restored successfully. ✓"
      );
    } catch (error: any) {
      setMessage(
        error?.message ||
          "Could not restore your Amazon subscription."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleManageSubscription() {
    /*
     * Amazon handles cancellation and
     * auto-renewal settings.
     */
    window.location.href =
      "https://www.amazon.com/gp/mas/your-account/myapps/yoursubscriptions";
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-xl px-6 py-10">

        <h1 className="text-3xl font-black">
          Manage Subscription
        </h1>

        <div className="mt-6 rounded-2xl border bg-white p-5">
          <p className="text-sm text-neutral-500">
            Current Plan
          </p>

          <p className="mt-1 text-xl font-bold capitalize">
            {plan?.plan || "loading..."}
          </p>

          {plan?.plan === "trial" && (
            <p className="mt-2 text-sm">
              ⏰ {time.hours}h{" "}
              {time.minutes}m remaining
              in your 7-day free trial.
            </p>
          )}

          {plan?.plan === "free" && (
            <p className="mt-2 text-sm text-red-600">
              Your free trial has ended.
            </p>
          )}

          {plan?.plan === "pro" && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-green-600">
                ✓ CartCue Pro is active
              </p>

              {plan.autoRenewing && (
                <p className="text-xs text-neutral-500">
                  Amazon automatic renewal is on.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-black">
            CartCue Pro
          </h2>

          <p className="mt-1 text-lg font-bold">
            $4.99 / month
          </p>

          <p className="mt-1 text-sm text-orange-600 font-semibold">
            7-day free trial
          </p>

          <ul className="mt-4 space-y-2 text-sm text-neutral-600">
            <li>
              ✓ Unlimited Amazon-to-Instagram kits
            </li>
            <li>
              ✓ Correct Amazon product photos
            </li>
            <li>
              ✓ Amazon affiliate links
            </li>
            <li>
              ✓ Unlimited generations
            </li>
            <li>
              ✓ Automatic monthly renewal
            </li>
          </ul>

          {plan?.plan !== "pro" ? (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-orange-500 py-4 font-bold text-white disabled:opacity-50"
            >
              {loading
                ? "Connecting to Amazon..."
                : "Start 7-Day Free Trial"}
            </button>
          ) : (
            <button
              onClick={
                handleManageSubscription
              }
              className="mt-6 w-full rounded-xl border-2 border-orange-300 bg-white py-4 font-bold text-orange-700"
            >
              Manage / Cancel Subscription
            </button>
          )}

          <button
            onClick={handleRestore}
            disabled={loading}
            className="mt-3 w-full rounded-xl border py-3 text-sm font-semibold disabled:opacity-50"
          >
            Restore Amazon Subscription
          </button>

          {message && (
            <div className="mt-4 rounded-xl bg-neutral-100 p-3 text-center text-sm">
              {message}
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-neutral-400">
          Billing, renewals and cancellation
          are handled by Amazon Appstore.
        </p>

        <a
          href="/"
          className="mt-6 block text-center text-sm font-medium underline"
        >
          ← Back to CartCue
        </a>
      </div>
    </main>
  );
    }
