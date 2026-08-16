import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const raw = JSON.stringify(body);
  console.log("Amazon RTN received:", raw);

  const ev = (body.event ?? body) as Record<string, unknown>;
  const type = String(ev.type ?? "UNKNOWN");
  const eventType = String(ev.eventType ?? ev.notificationType ?? "");
  const sku = String(ev.sku ?? ev.termSku ?? body.sku ?? "");
  const user = String(ev.userId ?? ev.buyerId ?? "");

  const text = `Event: ${type} / ${eventType}\nSKU: ${sku}\nUser: ${user}\nTime: ${new Date().toISOString()}\n\nRaw: ${raw}`;

  if (/PURCHASED|SUBSCRIBED|RENEWED|INITIATED/i.test(`${type} ${eventType}`)) {
    await sendEmail("🎉 New CartCue subscriber (Amazon)!", text);
  } else if (/CANCEL|REVOKE|EXPIRE|REFUND/i.test(`${type} ${eventType}`)) {
    await sendEmail("⚠️ CartCue subscription update", text);
  }

  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return NextResponse.json({ ok: true });
                     }
