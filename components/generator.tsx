import { NextRequest, NextResponse } from "next/server";

async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    // Use GET with manual redirect to capture the Location header
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // If it's a redirect (301, 302, 307, 308), get the location header
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (location) return location;
    }
    
    // If no redirect, return the original URL
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

    // Resolve shortened URLs (amzn.to) to get the real Amazon URL
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

    return NextResponse.json({
      kit: {
        productName: productName || "Smartwatch",
        productImage: "https://m.media-amazon.com/images/I/61ZjlKoOpwL._AC_SL1500_.jpg",
        asin: asin,
        affiliateLink: resolvedUrl.includes("tag=") ? resolvedUrl : `${resolvedUrl}?tag=yourid-20`,
        captions: [
          `Check out this ${productName || "smartwatch"}! Perfect for tracking fitness. #TechFinds`,
          `Love this ${productName || "smartwatch"}! Great battery life and features. #SmartWatch`
        ],
        hashtags: ["#SmartWatch", "#FitnessTracker", "#AmazonFinds", "#TechDeals"]
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
