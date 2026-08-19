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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    return response.url || shortUrl;
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
    /(?:^|[?&])asin=([A-Z0-9]{10})(?:[&#]|$)/i,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = decoded.match(patterns[i]);

    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

function extractAmazonImageFromHtml(html: string): string | null {
  const candidates: string[] = [];

  function addCandidate(value: string | undefined) {
    if (!value) return;

    const cleaned = cleanUrl(value);

    if (
      cleaned.indexOf("https://m.media-amazon.com/") === 0 ||
      cleaned.indexOf("https://images-na.ssl-images-amazon.com/") === 0 ||
      cleaned.indexOf("https://images.amazon.com/") === 0
    ) {
      if (candidates.indexOf(cleaned) === -1) {
        candidates.push(cleaned);
      }
    }
  }

  // Open Graph image
  const ogPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ];

  for (let i = 0; i < ogPatterns.length; i++) {
    const match = html.match(ogPatterns[i]);

    if (match && match[1]) {
      addCandidate(match[1]);
    }
  }

  // Twitter image
  const twitterPatterns = [
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];

  for (let i = 0; i < twitterPatterns.length; i++) {
    const match = html.match(twitterPatterns[i]);

    if (match && match[1]) {
      addCandidate(match[1]);
    }
  }

  // Amazon image JSON fields
  const jsonPatterns = [
    /"landingImageUrl"\s*:\s*"([^"]+)"/i,
    /"hiRes"\s*:\s*"([^"]+)"/i,
    /"large"\s*:\s*"([^"]+)"/i,
    /"mainUrl"\s*:\s*"([^"]+)"/i,
    /"imageUrl"\s*:\s*"([^"]+)"/i,
  ];

  for (let i = 0; i < jsonPatterns.length; i++) {
    const match = html.match(jsonPatterns[i]);

    if (match && match[1]) {
      addCandidate(match[1]);
    }
  }

  /*
   * Amazon dynamic image data.
   *
   * IMPORTANT:
   * This uses RegExp.exec() instead of for...of/matchAll(),
   * because the CartCue project is compiled with an older
   * TypeScript target.
   */
  const dynamicImageRegex =
    /data-a-dynamic-image=["']([^"']+)["']/gi;

  let dynamicMatch: RegExpExecArray | null;

  while ((dynamicMatch = dynamicImageRegex.exec(html)) !== null) {
    if (!dynamicMatch[1]) continue;

    try {
      const decoded = dynamicMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/&#34;/g, '"')
        .replace(/&amp;/g, "&");

      const imageData = JSON.parse(decoded);

      if (imageData && typeof imageData === "object") {
        const imageUrls = Object.keys(imageData);

        for (let i = 0; i < imageUrls.length; i++) {
          addCandidate(imageUrls[i]);
        }
      }
    } catch {
      // Ignore malformed image data.
    }
  }

  // Direct Amazon image URLs
  const directImageRegex =
    /https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9._%~-]+/gi;

  let directMatch: RegExpExecArray | null;

  while ((directMatch = directImageRegex.exec(html)) !== null) {
    if (directMatch[0]) {
      addCandidate(directMatch[0]);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Prefer high-resolution Amazon images.
  for (let i = 0; i < candidates.length; i++) {
    if (
      candidates[i].indexOf("_SL") !== -1 ||
      candidates[i].indexOf("_AC_SL") !== -1
    ) {
      return candidates[i];
    }
  }

  return candidates[0];
}

async function getAmazonProductImage(
  amazonUrl: string,
  asin: string
): Promise<string | null> {
  const productUrls = [
    amazonUrl,
    "https://www.amazon.com/dp/" + asin,
    "https://www.amazon.com/gp/product/" + asin,
  ];

  for (let i = 0; i < productUrls.length; i++) {
    try {
      const response = await fetch(productUrls[i], {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
   * Final ASIN image fallback.
   */
  const fallbackImages = [
    "https://images-na.ssl-images-amazon.com/images/P/" +
      asin +
      ".01.LZZZZZZZ.jpg",

    "https://images.amazon.com/images/P/" +
      asin +
      ".01.LZZZZZZZ.jpg",
  ];

  for (let i = 0; i < fallbackImages.length; i++) {
    try {
      const response = await fetch(fallbackImages[i], {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
      });

      if (response.ok) {
        console.log(
          "Using Amazon ASIN image fallback:",
          fallbackImages[i]
        );

        return fallbackImages[i];
      }
    } catch {
      // Try next fallback.
    }
  }

  return null;
}

function buildAffiliateLink(
  resolvedUrl: string,
  asin: string
): string {
  const tag =
    process.env.AMAZON_AFFILIATE_TAG || "ctfun-20";

  try {
    const url = new URL(resolvedUrl);

    if (url.hostname.indexOf("amazon.") !== -1) {
      url.searchParams.set("tag", tag);
      return url.toString();
    }
  } catch {
    // Use ASIN URL below.
  }

  return (
    "https://www.amazon.com/dp/" +
    asin +
    "?tag=" +
    encodeURIComponent(tag)
  );
}

function createProductKeywords(
  productName: string
): string {
  return productName
    ? productName.trim().toLowerCase()
    : "amazon product";
}

function createCaptions(
  productKeywords: string
): string[] {
  const isWatch =
    productKeywords.indexOf("watch") !== -1 ||
    productKeywords.indexOf("smartwatch") !== -1;

  return [
    "Just found this " +
      productKeywords +
      " on Amazon! 🎯 Perfect for " +
      (isWatch
        ? "tracking workouts and staying connected"
        : "elevating your daily routine") +
      ". Link in bio! #AmazonFinds #MustHave",

    "This " +
      productKeywords +
      " is a game changer! 💯 " +
      (isWatch
        ? "Battery lasts forever + tracks everything"
        : "Worth checking out if you're looking for something useful and practical") +
      ". Grab yours before it sells out! 🔥 #TechDeals #Amazon",

    "POV: You found the perfect " +
      productKeywords +
      " that doesn't break the bank 💸✨ " +
      (isWatch
        ? "Sleep tracking, heart rate, steps - it does it all"
        : "Quality meets affordability") +
      ". #SmartShopping #AmazonFinds",
  ];
}

function createHashtags(
  productKeywords: string
): string[] {
  const cleanProductTag = productKeywords
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 50);

  return [
    cleanProductTag
      ? "#" + cleanProductTag
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
      typeof body.productName === "string"
        ? body.productName.trim()
        : "";

    const amazonUrl =
      typeof body.amazonUrl === "string"
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

    console.log(
      "Original Amazon URL:",
      amazonUrl
    );

    // Resolve amzn.to link.
    const resolvedUrl =
      await resolveShortUrl(amazonUrl);

    console.log(
      "Resolved Amazon URL:",
      resolvedUrl
    );

    // Get ASIN from resolved URL.
    let asin = extractASIN(resolvedUrl);

    // Try original URL as well.
    if (!asin) {
      asin = extractASIN(amazonUrl);
    }

    if (!asin) {
      return NextResponse.json(
        {
          error:
            "Could not find the Amazon product ASIN. Please use a valid Amazon product link.",
        },
        {
          status: 400,
        }
      );
    }

    console.log("Amazon ASIN:", asin);

    // Find the CORRECT image for this product.
    const productImage =
      await getAmazonProductImage(
        resolvedUrl,
        asin
      );

    if (!productImage) {
      console.warn(
        "No Amazon image found for ASIN:",
        asin
      );
    }

    const productKeywords =
      createProductKeywords(productName);

    const affiliateLink =
      buildAffiliateLink(
        resolvedUrl,
        asin
      );

    return NextResponse.json({
      kit: {
        productName:
          productName || "Amazon Product",

        productImage:
          productImage || "",

        asin: asin,

        affiliateLink:
          affiliateLink,

        captions:
          createCaptions(productKeywords),

        hashtags:
          createHashtags(productKeywords),
      },
    });
  } catch (error) {
    console.error(
      "CartCue generation API error:",
      error
    );

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
