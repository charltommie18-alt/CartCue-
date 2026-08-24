import {
  NextRequest,
  NextResponse,
} from "next/server";

export const dynamic =
  "force-dynamic";

function getRvsMode(): string {
  return (
    process.env.AMAZON_RVS_MODE ||
    "sandbox"
  ).toLowerCase();
}

function buildAmazonRvsUrl(
  sharedSecret: string,
  userId: string,
  receiptId: string
): string {
  const mode =
    getRvsMode();

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

function isActiveSubscription(
  data: any
): boolean {
  if (!data) {
    return false;
  }

  if (
    data.productType !==
    "SUBSCRIPTION"
  ) {
    return false;
  }

  /*
   * Amazon can provide cancelDate
   * for a subscription that has been
   * cancelled.
   *
   * If there is no cancel date, the
   * subscription is currently active.
   */
  if (data.cancelDate) {
    return false;
  }

  return true;
}

export async function POST(
  request: NextRequest
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
          error:
            "Amazon RVS is not configured on the server.",
        },
        {
          status: 500,
        }
      );
    }

    const rvsUrl =
      buildAmazonRvsUrl(
        sharedSecret,
        userId,
        receiptId
      );

    console.log(
      "Verifying Amazon receipt:",
      receiptId
    );

    const response =
      await fetch(rvsUrl, {
        method: "GET",

        headers: {
          Accept:
            "application/json",
        },

        cache: "no-store",
      });

    let amazonData: any;

    try {
      amazonData =
        await response.json();
    } catch {
      amazonData = null;
    }

    /*
     * Amazon RVS HTTP 200 means:
     * receipt ID + user ID + shared
     * secret are valid.
     */
    if (!response.ok) {
      console.error(
        "Amazon RVS error:",
        response.status,
        amazonData
      );

      if (
        response.status ===
        410
      ) {
        return NextResponse.json(
          {
            active: false,
            error:
              "Amazon subscription receipt is no longer valid.",
            amazonStatus:
              response.status,
          },
          {
            status: 200,
          }
        );
      }

      return NextResponse.json(
        {
          active: false,

          error:
            "Amazon receipt verification failed.",

          amazonStatus:
            response.status,

          details:
            amazonData || null,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Check that Amazon says this is
     * actually a subscription.
     */
    if (
      amazonData?.productType !==
      "SUBSCRIPTION"
    ) {
      return NextResponse.json(
        {
          active: false,

          error:
            "Amazon receipt is not a subscription.",

          productType:
            amazonData?.productType ||
            null,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * If the request included our expected
     * term SKU, compare it against Amazon's
     * returned termSku/productId.
     *
     * App Tester may return the sandbox
     * term SKU, so don't reject simply because
     * Amazon has appended _term.
     */
    if (sku) {
      const amazonSku =
        amazonData?.termSku ||
        amazonData?.productId ||
        "";

      const acceptable =
        amazonSku === sku ||
        amazonSku ===
          "CartCue_monthly_term" ||
        amazonSku ===
          "CartCue_monthly_sub_term" ||
        amazonData?.parentProductId ===
          "CartCue_monthly_sub";

      if (!acceptable) {
        console.error(
          "Unexpected Amazon SKU:",
          amazonSku
        );

        return NextResponse.json(
          {
            active: false,

            error:
              "Amazon returned a different subscription SKU.",

            expectedSku: sku,

            returnedSku:
              amazonSku,
          },
          {
            status: 200,
          }
        );
      }
    }

    const active =
      isActiveSubscription(
        amazonData
      );

    return NextResponse.json(
      {
        active,

        receiptId:
          amazonData?.receiptId ||
          receiptId,

        productType:
          amazonData?.productType ||
          null,

        productId:
          amazonData?.productId ||
          null,

        parentProductId:
          amazonData?.parentProductId ||
          null,

        termSku:
          amazonData?.termSku ||
          null,

        autoRenewing:
          amazonData?.autoRenewing ??
          false,

        purchaseDate:
          amazonData?.purchaseDate ??
          null,

        renewalDate:
          amazonData?.renewalDate ??
          null,

        cancelDate:
          amazonData?.cancelDate ??
          null,

        freeTrialEndDate:
          amazonData?.freeTrialEndDate ??
          null,

        gracePeriodEndDate:
          amazonData?.gracePeriodEndDate ??
          null,

        testTransaction:
          amazonData?.testTransaction ??
          false,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Amazon RVS verification error:",
      error
    );

    return NextResponse.json(
      {
        active: false,

        error:
          "Amazon subscription verification server error.",
      },
      {
        status: 500,
      }
    );
  }
          }
