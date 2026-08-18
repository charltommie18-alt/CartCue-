// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

// Helper to extract the 10-character ASIN from any Amazon URL
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
    // REAL API CALL (Uncomment and add your API key to .env.local)
    // Recommended: Rainforest API (https://www.rainforestapi.com/)
    // ==========================================================
    /*
    const apiKey = process.env.RAINFOREST_API_KEY;
    const res = await fetch(`https://api.rainforestapi.com/request?apikey=${apiKey}&type=product&amazon_domain=amazon.com&asin=${asin}`);
    const data = await res.json();
    
    const realImageUrl = data.product?.main_image?.link;
    const realTitle = data.product?.title || productName;
    */

    // ==========================================================
    // TEMPORARY MOCK (Delete this block once you add the real API above)
    // This ensures your frontend works while you set up the API key
    // ==========================================================
    const realImageUrl = "https://m.media-amazon.com/images/I/61ZjlKoOpwL._AC_SL1500_.jpg"; // Example valid Amazon image URL format
    const realTitle = productName || "USMECBL Fitness Tracker Smart Watch";

    // Simulate network delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return the data in the shape your OutputTabs component expects
    return NextResponse.json({
      kit: {
        productName: realTitle,
        imageUrl: realImageUrl, // <-- THIS IS WHAT FIXES YOUR BLANK IMAGE
        description: "1.47'' OLED Display, IP68 Waterproof, 25 Sports Modes, Heart Rate & Sleep Monitor.",
        features: ["24/7 Heart Rate & SpO2 Monitoring", "Up to 14 Days Battery Life", "IP68 Waterproof"],
        instagramCaptions: [
          "Level up your fitness game! 💪 Track every step and sleep cycle. #FitnessTracker #SmartWatch",
          "Stay connected, stay healthy. ⌚️ 14-day battery life means you never miss a beat. #TechEssentials"
        ]
      }
    });

  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
