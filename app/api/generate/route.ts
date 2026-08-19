import { NextRequest, NextResponse } from "next/server";

async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
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
    const asin = extractASIN(resolvedUrl);
    
    if (!asin) {
      return NextResponse.json({ error: "Invalid Amazon URL. Could not find ASIN." }, { status: 400 });
    }

    // We will use a high-quality generic image for now to ensure the UI works perfectly.
    // (Amazon blocks direct scraping from serverless functions like Render without a paid proxy).
    const imageUrl = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=500&q=80";

    return NextResponse.json({
      kit: {
        productName: productName || "Amazon Product",
        productImage: imageUrl,
        asin: asin,
        affiliateLink: resolvedUrl.includes("tag=") ? resolvedUrl : `${resolvedUrl}?tag=yourtag-20`,
        captions: [
          `🚨 Amazon Find Alert! Just got my hands on this and I'm obsessed. 😍 Perfect for leveling up your daily routine. Link in bio to grab yours! 👇 #AmazonFinds #MustHave`,
          `POV: You finally found the perfect product that doesn't break the bank. ✨ 10/10 recommend. Tap the link to shop! 🛒 #TikTokMadeMeBuyIt #AmazonDeals`,
          `Stop scrolling! 🛑 This is the ultimate game-changer. I don't know how I lived without it.  Get yours before it sells out! #SmartShopping #Amazon`
        ],
        hashtags: [
          "#AmazonFinds", "#AmazonMustHaves", "#TikTokMadeMeBuyIt", 
          "#TechDeals", "#OnlineShopping", "#DealAlert", "#SmartBuy", 
          "#ProductReview", `#${asin}`
        ]
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
