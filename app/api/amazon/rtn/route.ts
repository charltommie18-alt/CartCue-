import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

type AmazonNotification = {
  appPackageName?: string;
  notificationType?: string;
  appUserId?: string;
  receiptId?: string;
  relatedReceipts?: unknown;
  timestamp?: number;
  betaProductTransaction?: boolean;
};

function parseMessage(
  value: unknown
): AmazonNotification {
  if (
    typeof value !==
    "string"
  ) {
    return (
      value as AmazonNotification
    ) || {};
  }

  try {
    return JSON.parse(
      value
    ) as AmazonNotification;
  } catch {
    return {};
  }
}

export async function POST(
  request: Request
) {
  let envelope: Record<
    string,
    unknown
  > = {};

  try {
    envelope =
      (await request.json()) as Record<
        string,
        unknown
      >;
  } catch {
    return new NextResponse(
      "Invalid JSON",
      { status: 400 }
    );
  }

  /*
   * Amazon RTN uses an Amazon SNS notification
   * envelope. The actual IAP event is normally
   * inside the Message property.
   */
  const message =
    parseMessage(
      envelope.Message
    );

  const notificationType =
    String(
      message.notificationType ||
        ""
    );

  const receiptId =
    String(
      message.receiptId ||
        ""
    );

  const appUserId =
    String(
      message.appUserId ||
        ""
    );

  const appPackageName =
    String(
      message.appPackageName ||
        ""
    );

  console.log(
    "Amazon RTN:",
    JSON.stringify({
      notificationType,
      receiptId,
      appUserId,
      appPackageName,
      timestamp:
        message.timestamp ||
        null,
    })
  );

  /*
   * Never unlock or remove Pro access solely
   * because an RTN request reached this endpoint.
   *
   * The app/server should verify the receipt
   * through Amazon RVS.
   */

  if (
    /PURCHASED|RENEWED|SUBSCRIPTION/i.test(
      notificationType
    )
  ) {
    await sendEmail(
      "🎉 CartCue Amazon subscription update",
      `Amazon RTN received.

Notification:
${notificationType}

Receipt:
${receiptId}

Amazon user:
${appUserId}

Package:
${appPackageName}

Time:
${new Date().toISOString()}`
    );
  }

  if (
    /CANCEL|EXPIRE|REFUND|REVOKE/i.test(
      notificationType
    )
  ) {
    await sendEmail(
      "⚠️ CartCue Amazon subscription cancellation/update",
      `Amazon RTN received.

Notification:
${notificationType}

Receipt:
${receiptId}

Amazon user:
${appUserId}

Package:
${appPackageName}

Time:
${new Date().toISOString()}`
    );
  }

  /*
   * Amazon SNS expects a successful HTTP
   * response so the notification is acknowledged.
   */
  return new NextResponse(
    null,
    { status: 204 }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service:
      "CartCue Amazon RTN",
  });
}
