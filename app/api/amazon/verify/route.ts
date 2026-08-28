import { NextResponse } from "next/server";

export const dynamic =
  "force-dynamic";

const AMAZON_PARENT_SKU =
  "CartCue_monthly_sub";

const AMAZON_TERM_SKU =
  "CartCue_monthly_term";

type AmazonReceipt = {
  productType?: string;

  productId?: string;

  parentProductId?:
    string | null;

  termSku?:
    string | null;

  receiptId?:
    string;

  purchaseDate?:
    number | null;

  renewalDate?:
    number | null;

  cancelDate?:
    number | null;

  freeTrialEndDate?:
    number | null;

  gracePeriodEndDate?:
    number | null;

  autoRenewing?:
    boolean;

  term?:
    string | null;

  testTransaction?:
    boolean;
};

function buildAmazonRvsUrl(
  sharedSecret: string,
  userId: string,
  receiptId: string
) {

  const mode =
    (
      process.env
        .AMAZON_RVS_MODE ||
      "sandbox"
    ).toLowerCase();

  const base =
    mode === "production"
      ? "https://appstore-sdk.amazon.com"
      : "https://appstore-sdk.amazon.com/sandbox";

  return (
    base +
    "/version/1.0/verifyReceiptId/developer/" +
    encodeURIComponent(
      sharedSecret
    ) +
    "/user/" +
    encodeURIComponent(
      userId
    ) +
    "/receiptId/" +
    encodeURIComponent(
      receiptId
    )
  );
}

function isCartCueSku(
  receipt: AmazonReceipt,
  requestedSku: string
) {

  const ids = [
    receipt.productId,
    receipt.parentProductId,
    receipt.termSku,
  ].filter(
    Boolean
  );

  if (!requestedSku) {

    return (
      ids.includes(
        AMAZON_PARENT_SKU
      ) ||
      ids.includes(
        AMAZON_TERM_SKU
      )
    );
  }

  return (
    ids.includes(
      requestedSku
    ) ||
    ids.includes(
      AMAZON_PARENT_SKU
    ) ||
    ids.includes(
      AMAZON_TERM_SKU
    )
  );
}

function subscriptionIsActive(
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

  const dates = [
    receipt.cancelDate,
    receipt.renewalDate,
    receipt.gracePeriodEndDate,
    receipt.freeTrialEndDate,
  ].filter(
    (
      value
    ): value is number =>
      typeof value ===
        "number" &&
      value > 0
  );

  if (
    dates.length ===
    0
  ) {
    return true;
  }

  return (
    Math.max(
      ...dates
    ) > now
  );
}

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();

    const receiptId =
      typeof body?.receiptId ===
      "string"
        ? body.receiptId.trim()
        : "";

    const userId =
      typeof body?.userId ===
      "string"
        ? body.userId.trim()
        : "";

    const sku =
      typeof body?.sku ===
      "string"
        ? body.sku.trim()
        : "";

    if (!receiptId) {

      return NextResponse.json(
        {
          active: false,

          error:
            "Amazon receipt ID is required.",
        },

        {
          status: 400,
        }
      );
    }

    if (!userId) {

      return NextResponse.json(
        {
          active: false,

          error:
            "Amazon user ID is required.",
        },

        {
          status: 400,
        }
      );
    }

    const sharedSecret =
      process.env
        .AMAZON_RVS_SHARED_SECRET;

    if (!sharedSecret) {

      console.error(
        "AMAZON_RVS_SHARED_SECRET is missing."
      );

      return NextResponse.json(
        {
          active: false,

          error:
            "Amazon RVS is not configured on the server.",
        },

        {
          status: 500,
        }
      );
    }

    const response =
      await fetch(
        buildAmazonRvsUrl(
          sharedSecret,
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

    let amazonData:
      AmazonReceipt | null =
      null;

    try {

      amazonData =
        (await response.json()) as AmazonReceipt;

    } catch {

      amazonData = null;
    }

    if (!response.ok) {

      console.error(
        "Amazon RVS error:",
        response.status
      );

      return NextResponse.json(
        {
          active: false,

          error:
            "Amazon receipt verification failed.",

          amazonStatus:
            response.status,
        },

        {
          status: 200,
        }
      );
    }

    if (!amazonData) {

      return NextResponse.json(
        {
          active: false,

          error:
            "Amazon returned an invalid receipt.",
        },

        {
          status: 200,
        }
      );
    }

    if (
      amazonData.productType !==
      "SUBSCRIPTION"
    ) {

      return NextResponse.json(
        {
          active: false,

          error:
            "The Amazon receipt is not a subscription.",
        },

        {
          status: 200,
        }
      );
    }

    if (
      !isCartCueSku(
        amazonData,
        sku
      )
    ) {

      return NextResponse.json(
        {
          active: false,

          error:
            "The Amazon receipt does not belong to the CartCue subscription.",
        },

        {
          status: 200,
        }
      );
    }

    const active =
      subscriptionIsActive(
        amazonData
      );

    const now =
      Date.now();

    const canceled =
      !!amazonData.cancelDate &&
      amazonData.cancelDate <=
        now;

    return NextResponse.json({

      active,

      canceled,

      receiptId:
        amazonData.receiptId ||
        receiptId,

      productType:
        amazonData.productType ||
        null,

      productId:
        amazonData.productId ||
        null,

      parentProductId:
        amazonData.parentProductId ||
        null,

      termSku:
        amazonData.termSku ||
        null,

      purchaseDate:
        amazonData.purchaseDate ??
        null,

      renewalDate:
        amazonData.renewalDate ??
        null,

      cancelDate:
        amazonData.cancelDate ??
        null,

      freeTrialEndDate:
        amazonData.freeTrialEndDate ??
        null,

      gracePeriodEndDate:
        amazonData.gracePeriodEndDate ??
        null,

      autoRenewing:
        amazonData.autoRenewing ??
        false,

      term:
        amazonData.term ??
        null,

      testTransaction:
        amazonData.testTransaction ??
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

      {
        status: 500,
      }
    );
  }
      }
