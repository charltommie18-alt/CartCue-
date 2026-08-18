"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    AmazonIAP?: {
      purchaseSubscription: (sku: string) => Promise<{
        success: boolean;
        receiptId?: string;
        sku?: string;
        error?: string;
      }>;
      restorePurchases: () => Promise<{
        success: boolean;
        purchases?: Array<{
          sku: string;
          receiptId?: string;
        }>;
        error?: string;
      }>;
    };
  }
}

const SUBSCRIPTION_SKU = "CartCue_monthly_sub";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState("");

  const isAmazonApp = () =>
    typeof window !== "undefined" &&
    !!window.AmazonIAP;

  async function subscribe() {
    setMessage("");

    if (!isAmazonApp()) {
      setMessage(
        "Amazon subscriptions are available in the Amazon Appstore version of CartCue."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await window.AmazonIAP!.purchaseSubscription(
        SUBSCRIPTION_SKU
      );

      if (result.success) {
        setMessage(
          "Subscription successful! CartCue Pro is now active."
        );
      } else {
        setMessage(
          result.error || "The subscription could not be completed."
        );
      }
    } catch (error) {
      console.error("Amazon subscription error:", error);
      setMessage("Unable to start the Amazon subscription.");
    } finally {
      setLoading(false);
    }
  }

  async function restorePurchases() {
    setMessage("");

    if (!isAmazonApp()) {
      setMessage(
        "Restore purchases is available in the Amazon Appstore version of CartCue."
      );
      return;
    }

    try {
      setRestoring(true);

      const result = await window.AmazonIAP!.restorePurchases();

      if (result.success && result.purchases?.length) {
        const active = result.purchases.some(
          (purchase) => purchase.sku === SUBSCRIPTION_SKU
        );

        if (active) {
          setMessage(
            "Your CartCue Pro subscription has been restored."
          );
        } else {
          setMessage("No active CartCue Pro subscription was found.");
        }
      } else {
        setMessage(
          result.error || "No active subscription was found."
        );
      }
    } catch (error) {
      console.error("Restore subscription error:", error);
      setMessage("Unable to restore your subscription.");
    } finally {
      setRestoring(false);
    }
  }

  useEffect(() => {
    if (!isAmazonApp()) return;

    const restore = async () => {
      try {
        await window.AmazonIAP!.restorePurchases();
      } catch (error) {
        console.log("Automatic restore skipped:", error);
      }
    };

    restore();
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-md text-center">

        <h1 className="text-3xl font-bold">
          CartCue Pro
        </h1>

        <p className="mt-3 text-gray-600">
          Unlock all CartCue Pro features with a monthly subscription.
        </p>

        <div className="mt-8 rounded-2xl border p-6 shadow-sm">

          <div className="text-4xl font-bold">
            $4.99
          </div>

          <div className="mt-1 text-gray-500">
            per month
          </div>

          <ul className="mt-6 space-y-3 text-left text-sm">
            <li>✓ Unlimited CartCue features</li>
            <li>✓ Pro tools and functionality</li>
            <li>✓ Continued access while subscribed</li>
            <li>✓ Cancel through Amazon</li>
          </ul>

          <button
            onClick={subscribe}
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-black px-5 py-4 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Opening Amazon..."
              : "Subscribe for $4.99/month"}
          </button>

          <button
            onClick={restorePurchases}
            disabled={restoring}
            className="mt-3 w-full rounded-xl border px-5 py-3 font-medium disabled:opacity-50"
          >
            {restoring
              ? "Restoring..."
              : "Restore Purchase"}
          </button>

          {message && (
            <div className="mt-5 rounded-xl bg-gray-100 p-4 text-sm">
              {message}
            </div>
          )}

          <p className="mt-5 text-xs text-gray-500">
            Payments and subscriptions are processed securely
            through Amazon Appstore.
          </p>

        </div>
      </div>
    </main>
  );
}
