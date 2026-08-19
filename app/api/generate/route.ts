import { NextRequest, NextResponse } from "next/server";

async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow', // ✅ Follows redirects automatically
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      }
    });
    return response.url;
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

async function fetchProductImage(asin: string, amazonUrl: string): Promise<string> {
  try {
    // Fetch the product page with proper headers
    const response = await fetch(amazonUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    });

    const html = await response.text();
    
    // Try multiple methods to extract image
    
    // Method 1: Look for og:image meta tag
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i) ||
                         html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"/i);
    if (ogImageMatch && ogImageMatch[1]) {
      return ogImageMatch[1];
    }

    // Method 2: Look for data-a-dynamic-image attribute
    const dynamicImageMatch = html.match(/data-a-dynamic-image='([^']*)'/i);
    if (dynamicImageMatch && dynamicImageMatch[1]) {
      try {
        const imageData = JSON.parse(dynamicImageMatch[1]);
        if (imageData && typeof imageData === 'object') {
          const urls = Object.keys(imageData);
          if (urls.length > 0) return urls[0];
        }
      } catch (e) {
        // JSON parse failed, continue to next method
      }
    }

    // Method 3: Look for #landingImage or #imgBlkFront
    const imgTagMatch = html.match(/<img[^>]*id=["'](landingImage|imgBlkFront)["'][^>]*src=["']([^"]*)["']/i);
    if (imgTagMatch && imgTagMatch[2]) {
      return imgTagMatch[2];
    }

    // Method 4: Fallback to Amazon CDN format
    return `https://m.media-amazon.com/images/I/61ZjlKoOpwL._AC_SL1500_.jpg`;

  } catch (error) {
    console.error("Failed to fetch product image:", error);
    // Return fallback image
    return `https://m.media-amazon.com/images/I/61ZjlKoOpwL._AC_SL1500_.jpg`;
  }
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

    // Resolve shortened URLs
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

    // Fetch the real product image
    const productImage = await fetchProductImage(asin, resolvedUrl);

    console.log("Extracted Image URL:", productImage);

    return NextResponse.json({
      kit: {
        productName: productName || "Amazon Product",
        productImage: productImage,
        asin: asin,
        affiliateLink: resolvedUrl.includes("tag=") ? resolvedUrl : `${resolvedUrl}?tag=yourid-20`,
        captions: [
          `🚨 Amazon Find Alert! Just found this amazing product and I'm obsessed. 😍 Perfect for leveling up your daily routine. Link in bio! 👇 #AmazonFinds #MustHave`,
          `POV: You finally found the perfect product that doesn't break the bank. 💸✨ 10/10 recommend. Tap the link to shop! 🛒 #TikTokMadeMeBuyIt #AmazonDeals`,
          `Stop scrolling! 🛑 This is the ultimate game-changer. I don't know how I lived without it. 🔥 Get yours before it sells out! #SmartShopping #Amazon`
        ],
        hashtags: [
          "#AmazonFinds",
          "#AmazonMustHaves",
          "#TikTokMadeMeBuyIt",
          "#TechDeals",
          "#OnlineShopping",
          "#DealAlert",
          "#SmartBuy",
          "#ProductReview",
          `#${asin}`
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
