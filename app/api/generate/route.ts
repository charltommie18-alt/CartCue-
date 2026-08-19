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

    console.log("🔍 Received request:", { productName, amazonUrl });

    if (!amazonUrl) {
      return NextResponse.json({ error: "Amazon URL is required" }, { status: 400 });
    }

    // 1. Resolve short links
    const resolvedUrl = amazonUrl.includes('amzn.to') ? await resolveShortUrl(amazonUrl) : amazonUrl;
    console.log("✅ Resolved URL:", resolvedUrl);
    
    const asin = extractASIN(resolvedUrl);
    console.log("️ Extracted ASIN:", asin);
    
    if (!asin) {
      return NextResponse.json({ error: "Could not extract ASIN from URL" }, { status: 400 });
    }

    let finalProductName = productName || `Product ${asin}`;
    
    // 2. 🎯 CONSTRUCT AMAZON IMAGE URL DIRECTLY FROM ASIN
    // This is the most reliable method - Amazon's CDN uses this format
    const imageUrl = `https://m.media-amazon.com/images/I/${asin}._AC_SL1500_.jpg`;
    
    console.log("️ Generated Image URL:", imageUrl);

    // 3. Try to fetch the actual product title if not provided
    try {
      const pageRes = await fetch(resolvedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await pageRes.text();
      
      // Extract title from og:title meta tag
      const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i);
      if (ogTitleMatch && ogTitleMatch[1] && !productName) {
        finalProductName = ogTitleMatch[1];
        console.log(" Extracted product name:", finalProductName);
      }
    } catch (error) {
      console.log("⚠️ Could not fetch product title, using default");
    }

    return NextResponse.json({
      kit: {
        productName: finalProductName,
        productImage: imageUrl,
        asin: asin,
        affiliateLink: resolvedUrl.includes("tag=") ? resolvedUrl : `${resolvedUrl}?tag=yourtag-20`,
        captions: [
          `🚨 Amazon Find Alert! Just got my hands on this ${finalProductName} and I'm obsessed.  Perfect for leveling up your daily routine. Link in bio! 👇 #AmazonFinds #MustHave`,
          `POV: You finally found the perfect ${finalProductName} that doesn't break the bank. ✨ 10/10 recommend. Tap the link to shop! 🛒 #TikTokMadeMeBuyIt #AmazonDeals`,
          `Stop scrolling!  This ${finalProductName} is the ultimate game-changer. Get yours before it sells out! #SmartShopping #Amazon`
        ],
        hashtags: [
          "#AmazonFinds", "#AmazonMustHaves", "#TikTokMadeMeBuyIt", 
          "#OnlineShopping", "#DealAlert", "#SmartBuy", 
          "#ProductReview", `#${asin}`
        ]
      }
    });

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
  }
