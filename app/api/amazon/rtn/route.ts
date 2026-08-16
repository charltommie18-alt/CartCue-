import { NextResponse } from "next/server";

// Amazon Appstore Real-Time Notifications endpoint.
// Amazon POSTs events here (subscription changes, refunds).
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    console.log("Amazon RTN received:", JSON.stringify(body));
  } catch {
    // ignore malformed payloads
  }
  // Amazon expects a 204 to confirm receipt
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
