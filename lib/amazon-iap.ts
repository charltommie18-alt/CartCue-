"use client";

import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

export const AMAZON_PARENT_SKU =
  "CartCue_monthly_sub";

/*
 * IMPORTANT:
 *
 * This MUST exactly match the TERM SKU
 * you created under the CartCue_monthly_sub
 * subscription in Amazon Developer Console.
 *
 * If your Amazon term SKU is different,
 * change ONLY this value.
 */
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
    result:
      | "FULFILLED"
      | "UNAVAILABLE";
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

  console.log(
    "Starting Amazon purchase:",
    sku
  );

  const result =
    await AmazonIAPNative.purchase({
      sku,
    });

  if (!result) {
    throw new Error(
      "Amazon returned no purchase response."
    );
  }

  if (!result.success) {
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

  if (!userId) {
    throw new Error(
      "Amazon did not return a user ID."
    );
  }

  return {
    ...result,

    success: true,

    sku:
      result.sku ||
      sku,

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

  return AmazonIAPNative.fulfillPurchase({
    receiptId,
    result: "FULFILLED",
  });
}

/*
 * Send the Amazon receipt to YOUR SERVER.
 *
 * The Amazon shared secret is NEVER placed
 * in this file.
 */
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

        body: JSON.stringify({
          receiptId,
          userId,
          sku,
        }),
      }
    );

  let data: any;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Amazon verification server returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "Amazon receipt verification failed."
    );
  }

  return data;
}

/*
 * Complete Amazon subscription flow:
 *
 * 1. Start Amazon purchase
 * 2. Receive receipt
 * 3. Receive Amazon user ID
 * 4. Send both to our server
 * 5. Server calls Amazon RVS
 * 6. Only if RVS says active do we unlock Pro
 * 7. Fulfill the receipt
 */
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

  console.log(
    "Amazon receipt received."
  );

  const verification =
    await verifyAmazonReceipt(
      purchaseResult.receiptId,
      purchaseResult.userId,
      AMAZON_SUBSCRIPTION_SKU
    );

  if (
    !verification ||
    !verification.active
  ) {
    throw new Error(
      "Amazon RVS did not confirm an active subscription."
    );
  }

  /*
   * IMPORTANT:
   *
   * Verify first.
   * Fulfill second.
   */
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
