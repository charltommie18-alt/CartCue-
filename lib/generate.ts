import { instagramKitSchema } from "./schema";
import { generateFallback } from "./fallback";
import type { GeneratorInput, InstagramKit } from "./types";

const SYSTEM_PROMPT = `
You are an expert Instagram affiliate marketing copywriter.
You create high-converting organic Instagram content for Amazon products.
You never make false, misleading, or income-related claims.
You always return valid JSON only, with no markdown.
`;

function buildUserPrompt(input: GeneratorInput): string {
  return `
Create an Instagram content kit for this Amazon product.

Product name: ${input.productName}
Amazon URL: ${input.amazonUrl || "Not provided"}
Affiliate URL: ${input.affiliateUrl || "Not provided"} - KEEP THIS LINK EXACT IN OUTPUT AS affiliateLink
Price: ${input.price || "Not provided"}
Category: ${input.category || "Not provided"}
Description: ${input.description || "Not provided"}
Target audience: ${input.targetAudience || "General Amazon shoppers"}
Main benefit: ${input.mainBenefit || "Not provided"}
Content style: ${input.style}
Tone: ${input.tone}
Include affiliate disclosure: ${input.includeDisclosure? "yes" : "no"}

Return JSON with this exact structure:
{
  "captions": string[3],
  "hashtags": string[20],
  "reelHooks": string[3],
  "reelScript": string,
  "storySlides": [{ "slide": number, "text": string }] (5 items),
  "carouselSlides": [{ "slide": number, "title": string, "body": string }] (5 items),
  "cta": string,
  "disclosure": string,
  "productName": "${input.productName}",
  "affiliateLink": "${input.affiliateUrl || input.amazonUrl || ""}",
  "amazonUrl": "${input.amazonUrl || ""}"
}

Rules:
- Sound like a real creator, not an ad.
- Match the requested style and tone.
- No fake reviews, fake discounts, or misleading claims.
- If include disclosure is "no", set disclosure to "".
- MUST include affiliateLink and productName in JSON.
`;
}

async function generateWithAI(
  input: GeneratorInput,
  key: string
): Promise<InstagramKit> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");

  const parsed = JSON.parse(content);

  // FORCE keep payment link and product name even if AI forgets
  const kit = instagramKitSchema.parse(parsed) as any;
  kit.affiliateLink = input.affiliateUrl || input.amazonUrl || parsed.affiliateLink || "";
  kit.amazonUrl = input.amazonUrl || parsed.amazonUrl || "";
  kit.productName = input.productName || parsed.productName || "Amazon Product";
  kit.price = input.price || parsed.price || "";

  return kit as InstagramKit;
}

export async function generateKit(input: GeneratorInput): Promise<InstagramKit> {
  const key = process.env.OPENAI_API_KEY;

  if (key) {
    try {
      return await generateWithAI(input, key);
    } catch (err) {
      console.error("AI generation failed, using fallback:", err);
    }
  }

  // Fallback MUST keep payment link
  const fallback = generateFallback(input) as any;
  fallback.affiliateLink = input.affiliateUrl || input.amazonUrl || "";
  fallback.amazonUrl = input.amazonUrl || "";
  fallback.productName = input.productName || fallback.productName || "Amazon Product";
  fallback.price = input.price || "";

  return fallback as InstagramKit;
      }
