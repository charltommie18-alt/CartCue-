import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 3_600_000);
  if (arr.length >= 3) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    sku?: string;
    at?: string;
  };

  await sendEmail(
    "🎉 New CartCue subscriber!",
    `A user activated Pro via Amazon.\nSKU: ${body.sku ?? "CartCue_monthly_sub"}\nTime: ${body.at ?? new Date().toISOString()}`
  );

  return NextResponse.json({ ok: true });
}
