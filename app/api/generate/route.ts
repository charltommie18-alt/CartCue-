// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

function extractASIN(url: string): string | null {
  const match = url.match(/(?:dp|gp\/product|exec\/obidos\/asin|dp\/)\/([A-Z0-9]{10})/i) || url.match(/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  try {
    const { productName, amazonUrl } = await req.json();

    if (!amazonUrl) {
      return NextResponse.json({ error: "Amazon URL is required" }, { status: 400 });
    }

    const asin = extractASIN(amazonUrl);
    if (!asin) {
      return NextResponse.json({ error: "Invalid Amazon URL. Could not find ASIN." }, { status: 400 });
    }

    // ==========================================================
    // TODO: Replace this mock with a real API call (e.g., Rainforest API)
    // For now, this mock ensures your UI works perfectly with the correct keys.
    // ==========================================================
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    return NextResponse.json({
      kit: {
        productName: productName || "USMECBL Fitness Tracker Smart Watch",
        // MUST BE "productImage" to match OutputTabs.tsx
        productImage: "https://m.media-amazon.com/images/I/61ZjlKoOpwL._AC_SL1500_.jpg", 
        asin: asin,
        affiliateLink: amazonUrl.includes("tag=") ? amazonUrl : `${amazonUrl}?tag=youraffiliateid-20`,
        captions: [
          "Level up your fitness game! 💪 Track every step, heart rate, and sleep cycle with the USMECBL Smart Watch. #FitnessTracker #SmartWatch",
          "Stay connected and healthy without the daily charging stress. ⌚️ 14-day battery life + IP68 waterproof! #TechEssentials #WearableTech"
        ],
        hashtags: ["#SmartWatch", "#FitnessTracker", "#HealthTech", "#AmazonFinds", "#WearableTech"]
      }
    });

  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
