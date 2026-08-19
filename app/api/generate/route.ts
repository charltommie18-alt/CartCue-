import { NextRequest, NextResponse } from "next/server";

async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    return response.url;
  } catch (error) {
    return shortUrl;
  }
}

function extractASIN(url: string): string | null {
  const patterns = [
    /(?:dp|gp\/product|exec\/obidos\/asin)\/([A-Z0-9]{10})/i,
    /\/([A-Z0-9]{10})(?:\?|&|\/|$)/,
    /^([A-Z0-9]{10})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productName, amazonUrl } = body;

    if (!amazonUrl) {
      return NextResponse.json({ error: "Amazon URL is required" }, { status: 400 });
    }

    const resolvedUrl = amazonUrl.includes('amzn.to') ? await resolveShortUrl(amazonUrl) : amazonUrl;
    const asin = extractASIN(resolvedUrl) || "UNKNOWN";

    let finalProductName = productName || "This Amazon Find";
    let imageUrl = null; // NO FALLBACK IMAGE. If it fails, it stays null.

    // Try to get the real image
    try {
      const microlinkRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(resolvedUrl)}`);
      const microlinkData = await microlinkRes.json();
      
      if (microlinkData.status === 'success' && microlinkData.data?.image?.url) {
        imageUrl = microlinkData.data.image.url;
      }
      if (!productName && microlinkData.data?.title) {
        finalProductName = microlinkData.data.title;
      }
    } catch (error) {
      // Failed to get image. imageUrl remains null.
    }

    return NextResponse.json({
      kit: {
        productName: finalProductName,
        productImage: imageUrl, // Will be null if Amazon blocked it
        asin: asin,
        affiliateLink: resolvedUrl.includes("tag=") ? resolvedUrl : `${resolvedUrl}?tag=yourtag-20`,
        captions: [
          `🚨 Amazon Find Alert! Just got my hands on this ${finalProductName} and I'm obsessed. Link in bio!  #AmazonFinds`,
          `POV: You finally found the perfect ${finalProductName}. 10/10 recommend. Tap the link! 🛒 #AmazonDeals`,
          `Stop scrolling! This ${finalProductName} is a game-changer. Get yours before it sells out! #SmartShopping`
        ],
        hashtags: ["#AmazonFinds", "#AmazonMustHaves", "#TikTokMadeMeBuyIt", "#OnlineShopping", `#${asin}`]
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Generation failed." }, { status: 500 });
  }
}
