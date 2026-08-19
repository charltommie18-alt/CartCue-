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

    // 1. Resolve short links
    const resolvedUrl = amazonUrl.includes('amzn.to') ? await resolveShortUrl(amazonUrl) : amazonUrl;
    const asin = extractASIN(resolvedUrl) || "UNKNOWN";

    let finalProductName = productName || "This Amazon Find";
    let imageUrl = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=500&q=80"; // Default fallback

    // 2. 🚀 THE MAGIC FIX: Use Microlink to get the REAL image and title for ANY product
    try {
      const microlinkRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(resolvedUrl)}`);
      const microlinkData = await microlinkRes.json();
      
      if (microlinkData.status === 'success' && microlinkData.data) {
        // Get the real image
        if (microlinkData.data.image?.url) {
          imageUrl = microlinkData.data.image.url;
        }
        // Get the real title if user didn't type one
        if (!productName && microlinkData.data.title) {
          finalProductName = microlinkData.data.title;
        }
      }
    } catch (error) {
      console.error("Microlink failed, using fallback:", error);
    }

    // 3. Generate dynamic captions based on the ACTUAL product name
    return NextResponse.json({
      kit: {
        productName: finalProductName,
        productImage: imageUrl,
        asin: asin,
        affiliateLink: resolvedUrl.includes("tag=") ? resolvedUrl : `${resolvedUrl}?tag=yourtag-20`,
        captions: [
          `🚨 Amazon Find Alert! Just got my hands on this ${finalProductName} and I'm obsessed. 😍 Perfect for leveling up your daily routine. Link in bio to grab yours! 👇 #AmazonFinds #MustHave`,
          `POV: You finally found the perfect ${finalProductName} that doesn't break the bank. ✨ 10/10 recommend. Tap the link to shop! 🛒 #TikTokMadeMeBuyIt #AmazonDeals`,
          `Stop scrolling! 🛑 This ${finalProductName} is the ultimate game-changer. I don't know how I lived without it. Get yours before it sells out! #SmartShopping #Amazon`
        ],
        hashtags: [
          "#AmazonFinds", "#AmazonMustHaves", "#TikTokMadeMeBuyIt", 
          "#OnlineShopping", "#DealAlert", "#SmartBuy", 
          "#ProductReview", `#${asin}`
        ]
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
        }
