import { NextRequest, NextResponse } from "next/server";

async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (location) return location;
    }
    
    return shortUrl;
  } catch (error) {
    console.error("Failed to resolve short URL:", error);
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
      return NextResponse.json(
        { error: "Amazon URL is required" }, 
        { status: 400 }
      );
    }

    const resolvedUrl = amazonUrl.includes('amzn.to') 
      ? await resolveShortUrl(amazonUrl)
      : amazonUrl;

    console.log("Original URL:", amazonUrl);
    console.log("Resolved URL:", resolvedUrl);

    const asin = extractASIN(resolvedUrl);
    
    if (!asin) {
      return NextResponse.json(
        { error: "Could not extract ASIN from URL. Please use a valid Amazon product link." }, 
        { status: 400 }
      );
    }

    // Generate better captions and hashtags based on product
    const productKeywords = productName?.toLowerCase() || "smartwatch";
    
    return NextResponse.json({
      kit: {
        productName: productName || "Smart Watch",
        // Use Amazon's image CDN format
        productImage: `https://m.media-amazon.com/images/I/61ZjlKoOpwL._AC_SL1500_.jpg`,
        asin: asin,
        affiliateLink: resolvedUrl.includes("tag=") ? resolvedUrl : `${resolvedUrl}?tag=yourid-20`,
        captions: [
          `Just found this ${productKeywords} on Amazon! 🎯 Perfect for ${productKeywords.includes('watch') ? 'tracking workouts and staying connected' : 'elevating your daily routine'}. Link in bio! #AmazonFinds #MustHave`,
          
          `This ${productKeywords} is a game changer! 💯 ${productKeywords.includes('watch') ? 'Battery lasts forever + tracks everything' : 'Worth every penny'}. Grab yours before it sells out! 🔥 #TechDeals #Amazon`,
          
          `POV: You found the perfect ${productKeywords} that doesn't break the bank 💸✨ ${productKeywords.includes('watch') ? 'Sleep tracking, heart rate, steps - it does it all' : 'Quality meets affordability'}. #SmartShopping #AmazonFinds`
        ],
        hashtags: [
          `#${productKeywords.replace(/\s/g, '')}`,
          "#AmazonFinds",
          "#TechDeals",
          "#MustHave",
          "#AmazonMustHaves",
          "#TikTokMadeMeBuyIt",
          "#ProductReview",
          "#OnlineShopping",
          "#DealAlert",
          "#SmartBuy"
        ]
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again." }, 
      { status: 500 }
    );
  }
      }
