"use client";

import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

/** Parent subscription product SKU in Amazon Developer Console */
export const AMAZON_PARENT_SKU = "CartCue_monthly_sub";

/** Monthly term SKU — this is what PurchasingService.purchase() must receive */
export const AMAZON_SUBSCRIPTION_SKU = "CartCue_monthly_term";

/** Alias used by subscription page / plan module */
export const AMAZON_SUB_SKU = AMAZON_SUBSCRIPTION_SKU;

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
  purchase(options: { sku: string }): Promise<PurchaseResult>;
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
  }): Promise<{ success: boolean }>;
}

const AmazonIAPNative = registerPlugin<AmazonIAPPlugin>("AmazonIAP");

function ensureAmazonAndroid() {
  if (Capacitor.getPlatform() !== "android") {
    throw new Error(
      "Amazon Appstore payments are only available in the Android Amazon Appstore version of CartCue."
    );
  }
}

export async function purchase(
  input?: string | { sku: string }
) {
  ensureAmazonAndroid();

  let sku = AMAZON_SUBSCRIPTION_SKU;

  if (typeof input === "string") {
    sku = input;
  } else if (input && typeof input.sku === "string") {
    sku = input.sku;
  }

  if (!sku.trim()) {
    throw new Error("Amazon subscription SKU is missing.");
  }

  const result = await AmazonIAPNative.purchase({
    sku: sku.trim(),
  });

  if (!result?.success) {
    throw new Error(
      "Amazon did not complete the subscription purchase."
    );
  }

  let userId = result.userId;
  let marketplace = result.marketplace;

  if (!userId) {
    const userData = await AmazonIAPNative.getUserData();
    userId = userData.userId;
    marketplace = marketplace || userData.marketplace;
  }

  return {
    ...result,
    sku: result.sku || sku,
    userId,
    marketplace,
  };
}

export async function getAmazonUserData() {
  ensureAmazonAndroid();
  return AmazonIAPNative.getUserData();
}

export async function restorePurchases() {
  ensureAmazonAndroid();
  return AmazonIAPNative.restorePurchases();
}

export async function syncPurchases() {
  ensureAmazonAndroid();
  return AmazonIAPNative.syncPurchases();
}

export async function fulfillPurchase(receiptId: string) {
  ensureAmazonAndroid();

  if (!receiptId.trim()) {
    throw new Error("Missing Amazon receipt ID.");
  }

  return AmazonIAPNative.fulfillPurchase({
    receiptId: receiptId.trim(),
    result: "FULFILLED",
  });
}

export async function verifyAmazonReceipt(
  receiptId: string,
  userId: string,
  sku: string = AMAZON_SUBSCRIPTION_SKU
) {
  if (!receiptId.trim()) {
    throw new Error("Missing Amazon receipt ID.");
  }

  if (!userId.trim()) {
    throw new Error("Missing Amazon user ID.");
  }

  const response = await fetch("/api/amazon/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiptId: receiptId.trim(),
      userId: userId.trim(),
      sku: sku.trim() || AMAZON_SUBSCRIPTION_SKU,
    }),
  });

  const data = await response.json();

  if (!response.ok && data?.error) {
    throw new Error(data.error);
  }

  if (data?.error && data.active !== true) {
    throw new Error(
      data.error || "Amazon receipt verification failed."
    );
  }

  return data;
}

/**
 * Full subscribe flow used by the modal and any standalone button:
 * purchase → verify with Amazon RVS → fulfill → return active state.
 */
export async function subscribeToCartCue() {
  ensureAmazonAndroid();

  const result = await purchase({
    sku: AMAZON_SUBSCRIPTION_SKU,
  });

  if (!result.receiptId) {
    throw new Error("Amazon did not return a receipt ID.");
  }

  if (!result.userId) {
    throw new Error("Amazon did not return a user ID.");
  }

  const verification = await verifyAmazonReceipt(
    result.receiptId,
    result.userId,
    AMAZON_SUBSCRIPTION_SKU
  );

  if (!verification?.active) {
    throw new Error(
      verification?.error ||
        "Amazon verification did not confirm an active subscription."
    );
  }

  await fulfillPurchase(result.receiptId);

  return {
    ...result,
    verification,
    active: true,
  };
}

const AmazonIAP = {
  purchase,
  subscribeToCartCue,
  restorePurchases,
  syncPurchases,
  getUserData: getAmazonUserData,
  fulfillPurchase,
  verifyAmazonReceipt,
};

export default AmazonIAP;
