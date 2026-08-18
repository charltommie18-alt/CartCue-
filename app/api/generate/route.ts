import { NextResponse } from "next/server";
import { generateContent } from "@/lib/generate";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await generateContent(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generation error:", error);

    return NextResponse.json(
      {
        error: "Unable to generate content.",
      },
      {
        status: 500,
      }
    );
  }
}
