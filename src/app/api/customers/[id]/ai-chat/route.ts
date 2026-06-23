import { NextRequest, NextResponse } from "next/server";
import { handleAiChat } from "@/lib/services/ai.service";
import type { LLMProviderMode } from "@/lib/ai/factory";

const VALID_PROVIDER_MODES: LLMProviderMode[] = ["mock", "openai-compatible"];

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

    if (
      !body.providerMode ||
      !VALID_PROVIDER_MODES.includes(body.providerMode as LLMProviderMode)
    ) {
      return NextResponse.json({ error: "请选择有效的 AI 模型模式" }, { status: 400 });
    }

    const result = await handleAiChat(
      id,
      body.message,
      body.providerMode as LLMProviderMode
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Customer not found") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    if (
      error instanceof Error &&
      error.message.startsWith("OpenAI-compatible provider is missing")
    ) {
      return NextResponse.json(
        { error: "真实模型配置不完整，请检查服务端环境变量" },
        { status: 503 }
      );
    }
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "AI 接待暂时不可用，请人工确认" },
      { status: 500 }
    );
  }
}
