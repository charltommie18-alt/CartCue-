"use client";

import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

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

export async function purchase(
  input?:
    | string
    | {
        sku: string;
      }
) {
  ensureAndroid();

  let sku =
    AMAZON_SUBSCRIPTION_SKU;

  if (
    typeof input === "string"
  ) {
    sku = input;
  } else if (
    input &&
    typeof input.sku === "string"
  ) {
    sku = input.sku;
  }

  if (!sku) {
    throw new Error(
      "Amazon subscription SKU is missing."
    );
  }

  const result =
    await AmazonIAPNative.purchase({
      sku,
    });

  if (!result?.success) {
    throw new Error(
      "Amazon did not complete the subscription purchase."
    );
  }

  let userId =
    result.userId;

  let marketplace =
    result.marketplace;

  if (!userId) {
    const userData =
      await AmazonIAPNative.getUserData();

    userId =
      userData.userId;

    marketplace =
      marketplace ||
      userData.marketplace;
  }

  return {
    ...result,

    sku:
      result.sku || sku,

    userId,

    marketplace,
  };
}

export async function getAmazonUserData() {
  ensureAndroid();

  return AmazonIAPNative.getUserData();
}

export async function restorePurchases() {
  ensureAndroid();

  return AmazonIAPNative.restorePurchases();
}

export async function syncPurchases() {
  ensureAndroid();

  return AmazonIAPNative.syncPurchases();
}

export async function fulfillPurchase(
  receiptId: string
) {
  ensureAndroid();

  if (!receiptId) {
    throw new Error(
      "Missing Amazon receipt ID."
    );
  }

  return AmazonIAPNative.fulfillPurchase(
    {
      receiptId,
      result: "FULFILLED",
    }
  );
}

export async function verifyAmazonReceipt(
  receiptId: string,
  userId: string,
  sku: string =
    AMAZON_SUBSCRIPTION_SKU
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

        cache: "no-store",

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

export async function subscribeToCartCue() {
  ensureAndroid();

  const purchaseResult =
    await purchase({
      sku:
        AMAZON_SUBSCRIPTION_SKU,
    });

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

  if (
    !verification?.active
  ) {
    throw new Error(
      verification?.error ||
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
