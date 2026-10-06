import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const AMAZON_PARENT_SKU =
  "CartCue_monthly_sub";

const AMAZON_TERM_SKU =
  "CartCue_monthly_term";

type AmazonRvsResponse = {
  autoRenewing?: boolean;

  cancelDate?: number | null;

  cancelReason?: number | null;

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

function encodePart(
  value: string
) {
  return encodeURIComponent(value);
}

function buildRvsUrl(
  sandbox: boolean,
  secret: string,
  userId: string,
  receiptId: string
) {
  const base =
    sandbox
      ? "https://appstore-sdk.amazon.com/sandbox/"
      : "https://appstore-sdk.amazon.com/";

  return (
    base +
    "version/1.0/verifyReceiptId/developer/" +
    encodePart(secret) +
    "/user/" +
    encodePart(userId) +
    "/receiptId/" +
    encodePart(receiptId)
  );
}

async function callRvs(
  sandbox: boolean,
  secret: string,
  userId: string,
  receiptId: string
) {
  return fetch(
    buildRvsUrl(
      sandbox,
      secret,
      userId,
      receiptId
    ),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );
}

function skuMatches(
  receipt: AmazonRvsResponse,
  requestedSku: string
) {
  if (!requestedSku) {
    return true;
  }

  const productId =
    receipt.productId || "";

  const parentProductId =
    receipt.parentProductId || "";

  const termSku =
    receipt.termSku || "";

  /*
   * Production RVS normally returns the real
   * term SKU.
   *
   * RVS Cloud Sandbox can append "_term" to
   * the parent SKU, so accept that form too.
   */
  const sandboxTermSku =
    AMAZON_PARENT_SKU + "_term";

  const accepted = new Set([
    AMAZON_PARENT_SKU,
    AMAZON_TERM_SKU,
    sandboxTermSku,
    requestedSku,
    requestedSku + "_term",
  ]);

  return (
    accepted.has(productId) ||
    accepted.has(parentProductId) ||
    accepted.has(termSku)
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

    const requestedSku =
      typeof body?.sku ===
      "string"
        ? body.sku.trim()
        : "";

    if (!receiptId) {
      return NextResponse.json(
        {
          active: false,
          error:
            "Missing Amazon receipt ID.",
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
            "Missing Amazon user ID.",
        },
        {
          status: 400,
        }
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
        {
          status: 500,
        }
      );
    }

    /*
     * If AMAZON_RVS_MODE=sandbox:
     *   sandbox is tried first.
     *
     * Otherwise:
     *   production is tried first.
     *
     * If the first endpoint rejects the receipt,
     * the other endpoint is attempted.
     *
     * Amazon uses RVS sandbox with App Tester
     * and RVS production for LAT/production.
     */
    const configuredMode =
      (
        process.env
          .AMAZON_RVS_MODE ||
        "production"
      ).toLowerCase();

    const preferSandbox =
      configuredMode === "sandbox";

    let amazonResponse =
      await callRvs(
        preferSandbox,
        secret,
        userId,
        receiptId
      );

    if (
      !amazonResponse.ok &&
      amazonResponse.status !== 410
    ) {
      const retry =
        await callRvs(
          !preferSandbox,
          secret,
          userId,
          receiptId
        );

      if (
        retry.ok ||
        retry.status === 410
      ) {
        amazonResponse =
          retry;
      }
    }

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
      const errorText =
        await amazonResponse.text();

      console.error(
        "Amazon RVS error:",
        amazonResponse.status,
        errorText
      );

      return NextResponse.json(
        {
          active: false,
          error:
            "Amazon could not verify the receipt.",
          amazonStatus:
            amazonResponse.status,
        },
        {
          status: 502,
        }
      );
    }

    let receipt: AmazonRvsResponse;

    try {
      receipt =
        (await amazonResponse.json()) as AmazonRvsResponse;
    } catch {
      return NextResponse.json(
        {
          active: false,
          error:
            "Amazon returned an invalid receipt response.",
        },
        {
          status: 502,
        }
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
        },
        {
          status: 400,
        }
      );
    }

    if (
      !skuMatches(
        receipt,
        requestedSku
      )
    ) {
      console.error(
        "Amazon SKU mismatch:",
        {
          requestedSku,
          productId:
            receipt.productId,
          parentProductId:
            receipt.parentProductId,
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
        {
          status: 400,
        }
      );
    }

    /*
     * Amazon's RVS documentation states that
     * cancelDate is null while the subscription
     * is active. A non-null cancelDate means the
     * receipt is canceled/expired.
     */
    const cancelDate =
      receipt.cancelDate ??
      null;

    const active =
      cancelDate === null;

    const autoRenewing =
      active &&
      receipt.autoRenewing !== false;

    return NextResponse.json({
      active,

      canceled:
        cancelDate !== null,

      autoRenewing,

      receiptId:
        receipt.receiptId ||
        receiptId,

      productId:
        receipt.productId ||
        null,

      parentProductId:
        receipt.parentProductId ||
        null,

      termSku:
        receipt.termSku ||
        null,

      productType:
        receipt.productType ||
        null,

      purchaseDate:
        receipt.purchaseDate ||
        null,

      renewalDate:
        receipt.renewalDate ||
        null,

      cancelDate,

      freeTrialEndDate:
        receipt.freeTrialEndDate ||
        null,

      gracePeriodEndDate:
        receipt.gracePeriodEndDate ||
        null,

      term:
        receipt.term ||
        null,

      testTransaction:
        receipt.testTransaction === true,
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
