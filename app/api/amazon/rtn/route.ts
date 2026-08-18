import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("Amazon RTN received:", body);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Amazon RTN error:", error);

    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 400,
      }
    );
  }
}
