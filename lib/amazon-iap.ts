import { registerPlugin } from "@capacitor/core";

export const AMAZON_SUBSCRIPTION_SKU =
  "cartcue_pro_monthly";

export interface AmazonPurchaseResult {
  success: boolean;
  sku: string;
  receiptId: string;
  purchaseDate: number;
  productType?: string;
  termSku?: string;
}

export interface AmazonUserData {
  userId: string;
  marketplace: string;
  countryCode?: string;
}

export interface AmazonReceipt {
  sku: string;
  receiptId: string;
  purchaseDate: number;
  productType?: string;
  termSku?: string;
  canceled?: boolean;
}

export interface AmazonRestoreResult {
  receipts: AmazonReceipt[];
}

export interface AmazonProductData {
  sku: string;
  title?: string;
  description?: string;
  price?: string;
  productType?: string;
  subscriptionPeriod?: string;
  freeTrialPeriod?: string;
}

export interface AmazonProductDataResult {
  products: AmazonProductData[];
}

export interface AmazonIAPPlugin {
  purchase(options: {
    sku: string;
  }): Promise<AmazonPurchaseResult>;

  getUserData(): Promise<AmazonUserData>;

  restorePurchases(): Promise<AmazonRestoreResult>;

  syncPurchases(): Promise<{
    started: boolean;
  }>;

  getProductData(options: {
    skus: string[];
  }): Promise<AmazonProductDataResult>;

  fulfillPurchase(options: {
    receiptId: string;
    result?: "FULFILLED" | "EXISTING_PURCHASE" | "NOT_ELIGIBLE" | "UNAVAILABLE";
  }): Promise<{
    success: boolean;
  }>;
}

const AmazonIAP =
  registerPlugin<AmazonIAPPlugin>("AmazonIAP");

export default AmazonIAP;
