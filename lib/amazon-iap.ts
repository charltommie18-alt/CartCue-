import { registerPlugin } from "@capacitor/core";

export interface AmazonPurchaseResult {
  sku: string;
  receiptId: string;
  purchaseDate: number;
}

export interface AmazonUserData {
  userId: string;
  marketplace: string;
}

export interface AmazonRestoreResult {
  receipts: {
    sku: string;
    receiptId: string;
  }[];
}

export interface AmazonIAPPlugin {
  purchase(options: {
    sku: string;
  }): Promise<AmazonPurchaseResult>;

  getUserData(): Promise<AmazonUserData>;

  restorePurchases(): Promise<AmazonRestoreResult>;
}

const AmazonIAP =
  registerPlugin<AmazonIAPPlugin>("AmazonIAP");

export default AmazonIAP;
