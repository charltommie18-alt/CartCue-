"use client";

import { Capacitor } from "@capacitor/core";

export const AMAZON_PARENT_SKU =
  "CartCue_monthly_sub";

/*
 * IMPORTANT:
 * Amazon purchases the MONTHLY TERM SKU,
 * not the parent subscription SKU.
 *
 * Put your real Monthly Term SKU here after
 * you see it in Amazon Developer Console.
 */
export const AMAZON_SUBSCRIPTION_SKU =
  "REPLACE_WITH_YOUR_MONTHLY_TERM_SKU";

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

type RestoreResult = {
  receipts: Array<{
    sku?: string;
    termSku?: string;
    receiptId?: string;
    purchaseDate?: number;
    canceled?: boolean;
  }>;
  userId?: string;
  marketplace?: string;
};

type AmazonIAPApi = {
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
};

let plugin:
  | AmazonIAPApi
  | null = null;

async function getPlugin() {
  if (plugin) {
    return plugin;
  }

  if (
    Capacitor.getPlatform() !==
    "android"
  ) {
    throw new Error(
      "Amazon Appstore payments are only available in the Android Amazon Appstore build."
    );
  }

  try {
    const module =
      await import(
        "../amazon-iap/AmazonIAP"
      );

    plugin =
      module.AmazonIAP as AmazonIAPApi;

    return plugin;
  } catch {
    /*
     * Capacitor native plugins are normally
     * registered by the Android project.
     *
     * Try the global Capacitor plugin
     * registration if the direct import is
     * not available.
     */
    const CapacitorModule =
      await import(
        "@capacitor/core"
      );

    const registered =
      CapacitorModule.registerPlugin<AmazonIAPApi>(
        "AmazonIAP"
      );

    plugin = registered;

    return plugin;
  }
}

export async function getAmazonUserData() {
  const api =
    await getPlugin();

  return api.getUserData();
}

export async function purchase({
  sku = AMAZON_SUBSCRIPTION_SKU,
}: {
  sku?: string;
} = {}) {
  if (
    !sku ||
    sku ===
      "REPLACE_WITH_YOUR_MONTHLY_TERM_SKU"
  ) {
    throw new Error(
      "Your Amazon Monthly Term SKU has not been entered yet."
    );
  }

  const api =
    await getPlugin();

  /*
   * Get Amazon user information BEFORE
   * purchasing so the receipt can later be
   * verified securely on the server.
   */
  let userData;

  try {
    userData =
      await api.getUserData();
  } catch {
    userData = undefined;
  }

  const result =
    await api.purchase({
      sku,
    });

  if (!result?.success) {
    throw new Error(
      "Amazon did not complete the purchase."
    );
  }

  return {
    ...result,

    userId:
      result.userId ||
      userData?.userId,

    marketplace:
      result.marketplace ||
      userData?.marketplace,
  };
}

export async function restorePurchases() {
  const api =
    await getPlugin();

  const result =
    await api.restorePurchases();

  return result;
}

export async function syncPurchases() {
  const api =
    await getPlugin();

  const result =
    await api.syncPurchases();

  return result;
}

export async function fulfillPurchase(
  receiptId: string
) {
  if (!receiptId) {
    throw new Error(
      "Missing Amazon receipt ID."
    );
  }

  const api =
    await getPlugin();

  return api.fulfillPurchase({
    receiptId,
    result: "FULFILLED",
  });
}

const AmazonIAP = {
  purchase,
  restorePurchases,
  syncPurchases,
  getUserData: getAmazonUserData,
  fulfillPurchase,
};

export default AmazonIAP;
