import { NextRequest, NextResponse } from "next/server";
import { handleAiChat } from "@/lib/services/ai.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();

    if (!body.message || typeof body.message !== "string" || body.message.trim() === "") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const result = await handleAiChat(id, body.message);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Customer not found") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "AI 接待暂时不可用，请人工确认" },
      { status: 500 }
    );
  }
}
