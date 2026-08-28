import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const AMAZON_PARENT_SKU =
  "CartCue_monthly_sub";

const AMAZON_TERM_SKU =
  "CartCue_monthly_term";

type AmazonReceipt = {
  autoRenewing?: boolean;
  cancelDate?: number | null;
  freeTrialEndDate?: number | null;
  gracePeriodEndDate?: number | null;
  renewalDate?: number | null;
  purchaseDate?: number | null;
  receiptId?: string;
  productId?: string;
  parentProductId?: string | null;
  productType?: string;
  term?: string | null;
  termSku?: string | null;
  testTransaction?: boolean;
};

function amazonUrl(
  secret: string,
  userId: string,
  receiptId: string
) {
  const mode =
    (
      process.env.AMAZON_RVS_MODE ||
      "sandbox"
    ).toLowerCase();

  const base =
    mode === "production"
      ? "https://appstore-sdk.amazon.com"
      : "https://appstore-sdk.amazon.com/sandbox";

  return (
    base +
    "/version/1.0/verifyReceiptId/developer/" +
    encodeURIComponent(secret) +
    "/user/" +
    encodeURIComponent(userId) +
    "/receiptId/" +
    encodeURIComponent(receiptId)
  );
}

function matchesCartCue(
  receipt: AmazonReceipt,
  requestedSku: string
) {
  const ids = [
    receipt.productId,
    receipt.termSku,
    receipt.parentProductId,
  ].filter(Boolean);

  if (!requestedSku) {
    return ids.includes(
      AMAZON_PARENT_SKU
    ) ||
      ids.includes(
        AMAZON_TERM_SKU
      );
  }

  return (
    ids.includes(requestedSku) ||
    ids.includes(AMAZON_TERM_SKU) ||
    ids.includes(AMAZON_PARENT_SKU)
  );
}

function isActive(
  receipt: AmazonReceipt
) {
  if (
    receipt.productType !==
    "SUBSCRIPTION"
  ) {
    return false;
  }

  const now =
    Date.now();

  const cancelDate =
    receipt.cancelDate ?? null;

  const renewalDate =
    receipt.renewalDate ?? null;

  const trialEnd =
    receipt.freeTrialEndDate ?? null;

  const graceEnd =
    receipt.gracePeriodEndDate ?? null;

  /*
   * A cancellation does not necessarily mean
   * immediate loss of access. If Amazon supplies
   * a future period end, access remains active
   * until that time.
   */
  const endDate =
    cancelDate ??
    renewalDate ??
    trialEnd ??
    graceEnd ??
    null;

  if (
    endDate !== null
  ) {
    return endDate > now;
  }

  return true;
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

    const sku =
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
        "AMAZON_RVS_SHARED_SECRET is missing."
      );

      return NextResponse.json(
        {
          active: false,
          error:
            "Amazon receipt verification is not configured.",
        },
        { status: 500 }
      );
    }

    const response =
      await fetch(
        amazonUrl(
          secret,
          userId,
          receiptId
        ),
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
          cache: "no-store",
        }
      );

    let receipt:
      AmazonReceipt | null =
      null;

    try {
      receipt =
        (await response.json()) as AmazonReceipt;
    } catch {
      receipt = null;
    }

    if (!response.ok) {

      if (
        response.status ===
        410
      ) {
        return NextResponse.json({
          active: false,
          canceled: true,
          error:
            "Amazon reports that this receipt is no longer valid.",
        });
      }

      console.error(
        "Amazon RVS error:",
        response.status,
        receipt
      );

      return NextResponse.json(
        {
          active: false,
          error:
            "Amazon could not verify the receipt.",
        },
        { status: 502 }
      );
    }

    if (!receipt) {
      return NextResponse.json(
        {
          active: false,
          error:
            "Amazon returned an invalid receipt response.",
        },
        { status: 502 }
      );
    }

    if (
      receipt.productType !==
      "SUBSCRIPTION"
    ) {
      return NextResponse.json(
        {
          active: false,
          error:
            "The Amazon receipt is not a subscription.",
          productType:
            receipt.productType ||
            null,
        },
        { status: 200 }
      );
    }

    if (
      !matchesCartCue(
        receipt,
        sku
      )
    ) {
      return NextResponse.json(
        {
          active: false,
          error:
            "The Amazon receipt does not belong to the CartCue subscription.",
        },
        { status: 200 }
      );
    }

    const active =
      isActive(receipt);

    const cancelDate =
      receipt.cancelDate ??
      null;

    return NextResponse.json({
      active,

      canceled:
        !!cancelDate &&
        cancelDate <= Date.now(),

      receiptId:
        receipt.receiptId ||
        receiptId,

      productType:
        receipt.productType ||
        null,

      productId:
        receipt.productId ||
        null,

      parentProductId:
        receipt.parentProductId ||
        null,

      termSku:
        receipt.termSku ||
        null,

      purchaseDate:
        receipt.purchaseDate ??
        null,

      renewalDate:
        receipt.renewalDate ??
        null,

      cancelDate,

      freeTrialEndDate:
        receipt.freeTrialEndDate ??
        null,

      gracePeriodEndDate:
        receipt.gracePeriodEndDate ??
        null,

      autoRenewing:
        receipt.autoRenewing ??
        false,

      term:
        receipt.term ??
        null,

      testTransaction:
        receipt.testTransaction ??
        false,
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
