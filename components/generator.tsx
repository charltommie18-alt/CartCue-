import { NextRequest, NextResponse } from "next/server";

async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    // Follow redirects to get the final URL
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
    });
    return response.url; // This will be the final Amazon URL after redirect
  } catch (error) {
    console.error("Failed to resolve short URL:", error);
    return shortUrl; // Return original if resolution fails
  }
}

function extractASIN(url: string): string | null {
  // First try to extract from standard Amazon URLs
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

    // Return mock data (replace with real API later)
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
