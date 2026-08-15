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
Affiliate URL: ${input.affiliateUrl || "Not provided"}
Price: ${input.price || "Not provided"}
Category: ${input.category || "Not provided"}
Description: ${input.description || "Not provided"}
Target audience: ${input.targetAudience || "General Amazon shoppers"}
Main benefit: ${input.mainBenefit || "Not provided"}
Content style: ${input.style}
Tone: ${input.tone}
Include affiliate disclosure: ${input.includeDisclosure ? "yes" : "no"}

Return JSON with this exact structure:
{
  "captions": string[3],
  "hashtags": string[20],
  "reelHooks": string[3],
  "reelScript": string,
  "storySlides": [{ "slide": number, "text": string }] (5 items),
  "carouselSlides": [{ "slide": number, "title": string, "body": string }] (5 items),
  "cta": string,
  "disclosure": string
}

Rules:
- Sound like a real creator, not an ad.
- Match the requested style and tone.
- No fake reviews, fake discounts, or misleading claims.
- If include disclosure is "no", set disclosure to "".
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

  return instagramKitSchema.parse(JSON.parse(content));
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

  return generateFallback(input);
}
