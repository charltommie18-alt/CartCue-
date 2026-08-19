import { NextRequest, NextResponse } from "next/server";

function cleanUrl(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .trim();
}

async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (response.url) {
      return response.url;
    }

    return shortUrl;
  } catch (error) {
    console.error("Failed to resolve Amazon short URL:", error);
    return shortUrl;
  }
}

function extractASIN(url: string): string | null {
  const decoded = decodeURIComponent(url);

  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?#&]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?#&]|$)/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?#&]|$)/i,
    /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})(?:[/?#&]|$)/i,
    /\/product\/([A-Z0-9]{10})(?:[/?#&]|$)/i,
    /(?:^|[?&])asin=([A-Z0-9]{10})(?:[&#]|$)/i,
    /(?:^|\/)([A-Z0-9]{10})(?:[/?#&]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);

    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  if (/^[A-Z0-9]{10}$/i.test(decoded.trim())) {
    return decoded.trim().toUpperCase();
  }

  return null;
}

function extractAmazonImageFromHtml(html: string): string | null {
  const candidates: string[] = [];

  function addCandidate(value: string | undefined) {
    if (!value) return;

    const cleaned = cleanUrl(value);

    if (
      cleaned.startsWith("https://m.media-amazon.com/") ||
      cleaned.startsWith("https://images-na.ssl-images-amazon.com/") ||
      cleaned.startsWith("https://images.amazon.com/")
    ) {
      candidates.push(cleaned);
    }
  }

  // 1. Open Graph image
  const ogImagePatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ];

  for (const pattern of ogImagePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) addCandidate(match[1]);
  }

  // 2. Twitter image
  const twitterImagePatterns = [
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];

  for (const pattern of twitterImagePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) addCandidate(match[1]);
  }

  // 3. Amazon landing image / high resolution image data
  const jsonPatterns = [
    /"landingImageUrl"\s*:\s*"([^"]+)"/i,
    /"hiRes"\s*:\s*"([^"]+)"/i,
    /"large"\s*:\s*"([^"]+)"/i,
    /"mainUrl"\s*:\s*"([^"]+)"/i,
    /"imageUrl"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of jsonPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) addCandidate(match[1]);
  }

  // 4. Amazon dynamic image data
  const dynamicImageMatches = html.matchAll(
    /data-a-dynamic-image=["']([^"']+)["']/gi
  );

  for (const match of dynamicImageMatches) {
    if (!match[1]) continue;

    try {
      const decoded = match[1]
        .replace(/&quot;/g, '"')
        .replace(/&#34;/g, '"')
        .replace(/&amp;/g, "&");

      const imageData = JSON.parse(decoded);

      if (imageData && typeof imageData === "object") {
        for (const imageUrl of Object.keys(imageData)) {
          addCandidate(imageUrl);
        }
      }
    } catch {
      // Ignore malformed dynamic-image data and continue.
    }
  }

  // 5. Search directly for Amazon image CDN URLs
  const directImageMatches = html.matchAll(
    /https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9._%-]+/gi
  );

  for (const match of directImageMatches) {
    if (match[0]) addCandidate(match[0]);
  }

  if (candidates.length === 0) {
    return null;
  }

  // Prefer larger-looking images.
  const preferred = candidates.find(
    (url) =>
      url.includes("_SL") ||
      url.includes("_AC_SL") ||
      url.includes(".jpg")
  );

  return preferred || candidates[0];
}

async function getAmazonProductImage(
  amazonUrl: string,
  asin: string
): Promise<string | null> {
  const productUrls = [
    amazonUrl,
    `https://www.amazon.com/dp/${asin}`,
    `https://www.amazon.com/gp/product/${asin}`,
  ];

  for (const productUrl of productUrls) {
    try {
      const response = await fetch(productUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();

      const image = extractAmazonImageFromHtml(html);

      if (image) {
        console.log("Amazon product image found:", image);
        return image;
      }
    } catch (error) {
      console.error("Amazon image lookup failed:", error);
    }
  }

  /*
   * Final ASIN-based fallback.
   *
   * Amazon commonly exposes the primary product image using this
   * legacy image endpoint. This is only used when the product page
   * does not expose an image directly.
   */
  const fallbackImages = [
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`,
    `https://images.amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`,
  ];

  for (const fallback of fallbackImages) {
    try {
      const response = await fetch(fallback, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
      });

      if (response.ok) {
        console.log("Using Amazon ASIN image fallback:", fallback);
        return fallback;
      }
    } catch {
      // Try the next fallback.
    }
  }

  return null;
}

function buildAffiliateLink(
  resolvedUrl: string,
  asin: string
): string {
  const tag = process.env.AMAZON_AFFILIATE_TAG || "ctfun-20";

  try {
    const url = new URL(resolvedUrl);

    // Make sure the product remains the same while adding the
    // user's Amazon Associates tracking tag.
    if (url.hostname.includes("amazon.")) {
      url.searchParams.set("tag", tag);
      return url.toString();
    }
  } catch {
    // Fall through to the ASIN URL below.
  }

  return `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(
    tag
  )}`;
}

function createProductKeywords(productName: string): string {
  return productName?.trim().toLowerCase() || "amazon product";
}

function createCaptions(productKeywords: string): string[] {
  const isWatch =
    productKeywords.includes("watch") ||
    productKeywords.includes("smartwatch");

  return [
    `Just found this ${productKeywords} on Amazon! 🎯 Perfect for ${
      isWatch
        ? "tracking workouts and staying connected"
        : "elevating your daily routine"
    }. Link in bio! #AmazonFinds #MustHave`,

    `This ${productKeywords} is a game changer! 💯 ${
      isWatch
        ? "Battery lasts forever + tracks everything"
        : "Worth checking out if you're looking for something useful and practical"
    }. Grab yours before it sells out! 🔥 #TechDeals #Amazon`,

    `POV: You found the perfect ${productKeywords} that doesn't break the bank 💸✨ ${
      isWatch
        ? "Sleep tracking, heart rate, steps - it does it all"
        : "Quality meets affordability"
    }. #SmartShopping #AmazonFinds`,
  ];
}

function createHashtags(productKeywords: string): string[] {
  const cleanProductTag = productKeywords
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 50);

  return [
    cleanProductTag
      ? `#${cleanProductTag}`
      : "#AmazonProduct",
    "#AmazonFinds",
    "#TechDeals",
    "#MustHave",
    "#AmazonMustHaves",
    "#TikTokMadeMeBuyIt",
    "#ProductReview",
    "#OnlineShopping",
    "#DealAlert",
    "#SmartBuy",
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const productName =
      typeof body?.productName === "string"
        ? body.productName.trim()
        : "";

    const amazonUrl =
      typeof body?.amazonUrl === "string"
        ? body.amazonUrl.trim()
        : "";

    if (!amazonUrl) {
      return NextResponse.json(
        {
          error: "Amazon URL is required",
        },
        {
          status: 400,
        }
      );
    }

    console.log("Original Amazon URL:", amazonUrl);

    // Resolve amzn.to and other Amazon redirects.
    const resolvedUrl = await resolveShortUrl(amazonUrl);

    console.log("Resolved Amazon URL:", resolvedUrl);

    // Extract the real ASIN from the final Amazon URL.
    let asin = extractASIN(resolvedUrl);

    // If the redirect did not expose the ASIN, also try the
    // original URL.
    if (!asin) {
      asin = extractASIN(amazonUrl);
    }

    if (!asin) {
      return NextResponse.json(
        {
          error:
            "Could not extract the Amazon ASIN from this link. Please use a valid Amazon product link or amzn.to product link.",
        },
        {
          status: 400,
        }
      );
    }

    console.log("Amazon ASIN:", asin);

    // Get the ACTUAL image belonging to this ASIN.
    const productImage = await getAmazonProductImage(
      resolvedUrl,
      asin
    );

    if (!productImage) {
      console.warn(
        `No Amazon image could be found for ASIN ${asin}`
      );
    }

    const productKeywords =
      createProductKeywords(productName);

    const affiliateLink = buildAffiliateLink(
      resolvedUrl,
      asin
    );

    return NextResponse.json({
      kit: {
        productName:
          productName || "Amazon Product",

        /*
         * IMPORTANT:
         * This is now the actual image found for the ASIN.
         * The old hard-coded image has been completely removed.
         */
        productImage: productImage || "",

        asin,

        affiliateLink,

        captions:
          createCaptions(productKeywords),

        hashtags:
          createHashtags(productKeywords),
      },
    });
  } catch (error) {
    console.error("CartCue generation API error:", error);

    return NextResponse.json(
      {
        error:
          "Generation failed. Please check the Amazon link and try again.",
      },
      {
        status: 500,
      }
    );
  }
}
