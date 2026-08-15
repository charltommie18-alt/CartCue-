import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generatorInputSchema } from "@/lib/schema";
import { generateKit } from "@/lib/generate";

export async function POST(req: Request) {
  try {
    const input = generatorInputSchema.parse(await req.json());
    const kit = await generateKit(input);
    return NextResponse.json({ kit });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
