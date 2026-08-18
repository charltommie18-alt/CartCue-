import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generatorInputSchema } from "@/lib/schema";
import { generateKit } from "@/lib/generate";

const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

const AFFILIATE_TAG = process.env.AMAZON_AFFILIATE_TAG || process.env.NEXT_PUBLIC_AMAZON_TAG || "cartcue-20";

function buildAffiliateLink(urlOrAsin: string): string {
  if (!urlOrAsin) return "";
  const asinMatch = urlOrAsin.match(/(?:dp|product)\/([A-Z0-9]{10})/i) || urlOrAsin.match(/\b([A-Z0-9]{10})\b/);
  const asin = asinMatch? asinMatch[1].toUpperCase() : null;
  if (!asin) {
    if (urlOrAsin.includes("amazon.com") && urlOrAsin.includes("tag=")) return urlOrAsin;
    return urlOrAsin;
  }
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }
  try {
    const raw = await req.json();
    const input = generatorInputSchema.parse(raw);

    if (!input.affiliateUrl && input.amazonUrl) {
      input.affiliateUrl = buildAffiliateLink(input.amazonUrl);
    } else if (input.affiliateUrl) {
      input.affiliateUrl = buildAffiliateLink(input.affiliateUrl);
    }

    const kit = await generateKit(input);

    return NextResponse.json({
      kit: {
       ...kit,
        affiliateLink: input.affiliateUrl,
        affiliateTag: AFFILIATE_TAG,
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
