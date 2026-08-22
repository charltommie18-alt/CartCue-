"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

export const AMAZON_PARENT_SKU =
  "CartCue_monthly_sub";

export const AMAZON_SUBSCRIPTION_SKU =
  "CartCue_monthly_term";

type PurchaseResult = {
  success: boolean;
  sku?: string;
  termSku?: string;
  receiptId?: string;
  purchaseDate?: number;
  productType?: string;
  userId?: string;
  marketplace?: string;
};

type RestoreReceipt = {
  sku?: string;
  termSku?: string;
  receiptId?: string;
  purchaseDate?: number;
  canceled?: boolean;
};

type RestoreResult = {
  receipts: RestoreReceipt[];
  userId?: string;
  marketplace?: string;
};

interface AmazonIAPPlugin {
  purchase(options: {
    sku: string;
  }): Promise<PurchaseResult>;

  getUserData(): Promise<{
    userId: string;
    marketplace: string;
    countryCode?: string;
  }>;

  restorePurchases(): Promise<RestoreResult>;

  syncPurchases(): Promise<RestoreResult>;

  fulfillPurchase(options: {
    receiptId: string;
    result?: "FULFILLED" | "UNAVAILABLE";
  }): Promise<{
    success: boolean;
  }>;
}

const AmazonIAPNative =
  registerPlugin<AmazonIAPPlugin>(
    "AmazonIAP"
  );

function ensureAndroid() {
  if (
    Capacitor.getPlatform() !==
    "android"
  ) {
    throw new Error(
      "Amazon Appstore payments are only available in the Android Amazon Appstore version of CartCue."
    );
  }
}

/**
 * Get Amazon user information.
 */
export async function getAmazonUserData() {
  ensureAndroid();

  return AmazonIAPNative.getUserData();
}

/**
 * Start an Amazon subscription purchase.
 *
 * Accepts an optional SKU so existing CartCue
 * code such as:
 *
 * purchase(AMAZON_SUBSCRIPTION_SKU)
 *
 * continues to work.
 */
export async function purchase(
  sku: string = AMAZON_SUBSCRIPTION_SKU
) {
  ensureAndroid();

  if (!sku) {
    throw new Error(
      "Amazon subscription SKU is missing."
    );
  }

  const userData =
    await AmazonIAPNative.getUserData();

  const result =
    await AmazonIAPNative.purchase({
      sku,
    });

  if (!result?.success) {
    throw new Error(
      "Amazon did not complete the subscription purchase."
    );
  }

  return {
    ...result,

    sku:
      result.sku || sku,

    userId:
      result.userId ||
      userData.userId,

    marketplace:
      result.marketplace ||
      userData.marketplace,
  };
}

/**
 * Restore previous Amazon purchases.
 */
export async function restorePurchases() {
  ensureAndroid();

  return AmazonIAPNative.restorePurchases();
}

/**
 * Synchronize Amazon purchases.
 */
export async function syncPurchases() {
  ensureAndroid();

  return AmazonIAPNative.syncPurchases();
}

/**
 * Fulfill an Amazon receipt after verification.
 */
export async function fulfillPurchase(
  receiptId: string
) {
  ensureAndroid();

  if (!receiptId) {
    throw new Error(
      "Missing Amazon receipt ID."
    );
  }

  return AmazonIAPNative.fulfillPurchase({
    receiptId,
    result: "FULFILLED",
  });
}

/**
 * Verify an Amazon receipt on the CartCue
 * server.
 */
export async function verifyAmazonReceipt(
  receiptId: string,
  userId: string,
  sku: string = AMAZON_SUBSCRIPTION_SKU
) {
  if (!receiptId) {
    throw new Error(
      "Missing Amazon receipt ID."
    );
  }

  if (!userId) {
    throw new Error(
      "Missing Amazon user ID."
    );
  }

  const response =
    await fetch(
      "/api/amazon/verify",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          receiptId,
          userId,
          sku,
        }),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "Amazon receipt verification failed."
    );
  }

  return data;
}

/**
 * Complete CartCue subscription flow.
 */
export async function subscribeToCartCue() {
  ensureAndroid();

  const purchaseResult =
    await purchase(
      AMAZON_SUBSCRIPTION_SKU
    );

  if (
    !purchaseResult.receiptId
  ) {
    throw new Error(
      "Amazon did not return a receipt ID."
    );
  }

  if (
    !purchaseResult.userId
  ) {
    throw new Error(
      "Amazon did not return a user ID."
    );
  }

  const verification =
    await verifyAmazonReceipt(
      purchaseResult.receiptId,
      purchaseResult.userId,
      AMAZON_SUBSCRIPTION_SKU
    );

  if (!verification?.active) {
    throw new Error(
      "Amazon verification did not confirm an active subscription."
    );
  }

  await fulfillPurchase(
    purchaseResult.receiptId
  );

  return {
    ...purchaseResult,
    verification,
    active: true,
  };
}

const AmazonIAP = {
  purchase,
  subscribeToCartCue,
  restorePurchases,
  syncPurchases,
  getUserData:
    getAmazonUserData,
  fulfillPurchase,
  verifyAmazonReceipt,
};

export default AmazonIAP;
