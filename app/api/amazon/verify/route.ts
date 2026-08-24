import { NextResponse } from "next/server";

const AMAZON_PARENT_SKU =
  "CartCue_monthly_sub";

const AMAZON_TERM_SKU =
  "CartCue_monthly_term";

type AmazonRvsResponse = {
  autoRenewing?: boolean;
  cancelDate?: number | null;
  freeTrialEndDate?: number | null;
  gracePeriodEndDate?: number | null;
  renewalDate?: number | null;
  purchaseDate?: number | null;
  receiptId?: string;
  productId?: string;
  productType?: string;
  term?: string | null;
  termSku?: string | null;
  testTransaction?: boolean;
};

function encodePart(
  value: string
) {
  return encodeURIComponent(value);
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const receiptId =
      String(
        body?.receiptId || ""
      ).trim();

    const userId =
      String(
        body?.userId || ""
      ).trim();

    const requestedSku =
      String(
        body?.sku || ""
      ).trim();

    if (!receiptId) {
      return NextResponse.json(
        {
          active: false,
          error:
            "Missing Amazon receipt ID.",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          active: false,
          error:
            "Missing Amazon user ID.",
        },
        { status: 400 }
      );
    }

    const secret =
      process.env
        .AMAZON_RVS_SHARED_SECRET;

    if (!secret) {
      console.error(
        "AMAZON_RVS_SHARED_SECRET is not configured."
      );

      return NextResponse.json(
        {
          active: false,
          error:
            "Amazon receipt verification is not configured on the server.",
        },
        { status: 500 }
      );
    }

    const mode =
      process.env.AMAZON_RVS_MODE ===
      "sandbox"
        ? "sandbox/"
        : "";

    const url =
      "https://appstore-sdk.amazon.com/" +
      mode +
      "version/1.0/verifyReceiptId/developer/" +
      encodePart(secret) +
      "/user/" +
      encodePart(userId) +
      "/receiptId/" +
      encodePart(receiptId);

    const amazonResponse =
      await fetch(url, {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
        cache: "no-store",
      });

    if (
      amazonResponse.status ===
      410
    ) {
      return NextResponse.json({
        active: false,
        canceled: true,
        error:
          "Amazon reports that this receipt is no longer valid.",
      });
    }

    if (!amazonResponse.ok) {
      const text =
        await amazonResponse.text();

      console.error(
        "Amazon RVS error:",
        amazonResponse.status,
        text
      );

      return NextResponse.json(
        {
          active: false,
          error:
            "Amazon could not verify the receipt.",
          amazonStatus:
            amazonResponse.status,
        },
        { status: 502 }
      );
    }

    const receipt =
      (await amazonResponse.json()) as AmazonRvsResponse;

    if (
      receipt.productType !==
      "SUBSCRIPTION"
    ) {
      return NextResponse.json(
        {
          active: false,
          error:
            "The Amazon receipt is not a subscription.",
        },
        { status: 400 }
      );
    }

    /*
     * Production:
     * termSku should be the real term SKU.
     *
     * App Tester/RVS Sandbox:
     * Amazon may return:
     *
     * CartCue_monthly_sub_term
     *
     * instead of the real term SKU.
     */

    const sandboxTermSku =
      `${AMAZON_PARENT_SKU}_term`;

    const skuMatches =
      !requestedSku ||
      receipt.productId ===
        requestedSku ||
      receipt.termSku ===
        requestedSku ||
      receipt.productId ===
        AMAZON_PARENT_SKU ||
      receipt.termSku ===
        AMAZON_PARENT_SKU ||
      receipt.productId ===
        AMAZON_TERM_SKU ||
      receipt.termSku ===
        AMAZON_TERM_SKU ||
      (
        receipt.testTransaction ===
          true &&
        (
          receipt.productId ===
            sandboxTermSku ||
          receipt.termSku ===
            sandboxTermSku
        )
      );

    if (!skuMatches) {
      console.error(
        "Amazon SKU mismatch:",
        {
          requestedSku,
          productId:
            receipt.productId,
          termSku:
            receipt.termSku,
        }
      );

      return NextResponse.json(
        {
          active: false,
          error:
            "The Amazon receipt belongs to a different subscription.",
        },
        { status: 400 }
      );
    }

    const now =
      Date.now();

    const cancelDate =
      receipt.cancelDate ??
      null;

    const renewalDate =
      receipt.renewalDate ??
      null;

    const trialEnd =
      receipt.freeTrialEndDate ??
      null;

    const graceEnd =
      receipt.gracePeriodEndDate ??
      null;

    const accessEnd =
      cancelDate ||
      renewalDate ||
      graceEnd ||
      trialEnd ||
      null;

    const active =
      !accessEnd ||
      accessEnd > now;

    const autoRenewing =
      active &&
      receipt.autoRenewing !==
        false &&
      !cancelDate;

    return NextResponse.json({
      active,

      canceled:
        !!cancelDate &&
        cancelDate <= now,

      autoRenewing,

      receiptId:
        receipt.receiptId ||
        receiptId,

      productId:
        receipt.productId ||
        null,

      termSku:
        receipt.termSku ||
        null,

      purchaseDate:
        receipt.purchaseDate ||
        null,

      renewalDate,

      cancelDate,

      freeTrialEndDate:
        trialEnd,

      gracePeriodEndDate:
        graceEnd,

      term:
        receipt.term ||
        null,

      testTransaction:
        receipt.testTransaction ===
        true,
    });
  } catch (error) {
    console.error(
      "Amazon verification error:",
      error
    );

    return NextResponse.json(
      {
        active: false,
        error:
          "Unexpected Amazon verification error.",
      },
      { status: 500 }
    );
  }
        }
