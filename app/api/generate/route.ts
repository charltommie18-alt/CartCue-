// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

async function expandShortUrl(url: string): Promise<string> {
  if (!url.includes('amzn.to')) return url;
  try {
    // HEAD follows redirect and gives us the real amazon url
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return res.url || url;
  } catch {
    return url;
  }
}

function extractASIN(url: string): string {
  const patterns = [
    /dp\/([A-Z0-9]{10})/i,
    /gp\/product\/([A-Z0-9]{10})/i,
    /\/([A-Z0-9]{10})(?:[/?]|$)/i,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1].toUpperCase();
  }
  // If still amzn.to (couldn't expand), try to find ASIN in original if it has it
  const any = url.match(/([A-Z0-9]{10})/i);
  return any ? any[1].toUpperCase() : 'B0GVNFJGZC';
}

export async function POST(req: NextRequest) {
  const { productName, amazonUrl } = await req.json();

  // 1. Expand amzn.to -> https://www.amazon.com/dp/B0XXXX...
  const expanded = await expandShortUrl(amazonUrl || '');
  const urlToUse = expanded.includes('amazon') ? expanded : amazonUrl;
  
  // 2. Get ASIN
  const asin = extractASIN(urlToUse);
  const TAG = 'cartcue-20';

  // 3. Dynamic image from ASIN - not hardcoded
  const productImage = `https://m.media-amazon.com/images/P/${asin}.01._SL500_.jpg`;
  const affiliateLink = `https://www.amazon.com/dp/${asin}?tag=${TAG}`;

  return NextResponse.json({
    kit: {
      productName: productName || "Smartwatch",
      productImage, // dynamic, matches ASIN
      productImages: [
        `https://m.media-amazon.com/images/P/${asin}.01._SL500_.jpg`,
        `https://m.media-amazon.com/images/P/${asin}.jpg`,
      ],
      asin,
      affiliateLink,
      resolvedUrl: urlToUse,
      captions: [
        `This ${productName} replaced my $300 watch. Heart rate, sleep, notifications - battery lasts 7 days.`,
        `If you track workouts but hate charging daily, the ${productName} is the Amazon find that actually delivers. Link in bio!`
      ],
      hashtags: ["#SmartWatch", "#AmazonFinds", "#FitnessTracker"]
    }
  });
      }
