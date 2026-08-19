"use client";

import { useState } from "react";

import AmazonIAP, {
  AMAZON_SUBSCRIPTION_SKU,
} from "@/lib/amazon-iap";

import {
  saveAmazonSubscription,
} from "@/lib/plan";

export default function SubscribeModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function subscribe() {
    setLoading(true);
    setError("");

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
            "Amazon could not verify the subscription."
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

      window.location.href = "/";
    } catch (e: any) {
      setError(
        e?.message ||
          "Unable to start the Amazon subscription."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-xl">
          ⭐
        </div>

        <h2 className="mt-4 text-xl font-black">
          Your Trial Has Ended
        </h2>

        <p className="mt-2 text-sm text-neutral-500">
          Continue with CartCue Pro and get
          unlimited Amazon product kits.
        </p>

        <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-left text-sm">
          <p>✓ Unlimited generations</p>
          <p>✓ Correct product photos</p>
          <p>✓ Amazon affiliate links</p>
          <p>✓ $4.99/month via Amazon</p>
          <p className="mt-2 font-bold text-orange-600">
            ✓ 7-day free trial
          </p>
        </div>

        <button
          type="button"
          onClick={subscribe}
          disabled={loading}
          className="mt-5 block w-full rounded-full bg-orange-500 py-3.5 font-bold text-white disabled:opacity-50"
        >
          {loading
            ? "Connecting to Amazon..."
            : "Start 7-Day Free Trial"}
        </button>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={onClose}
          disabled={loading}
          className="mt-3 text-sm text-neutral-400"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
