import { NextRequest, NextResponse } from "next/server";
import { getConversations, createConversation } from "@/lib/services/chat.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const conversations = await getConversations(id);
  return NextResponse.json(conversations);
}

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

    if (!body.senderType || typeof body.senderType !== "string") {
      return NextResponse.json({ error: "senderType is required" }, { status: 400 });
    }

    if (!body.messageContent || typeof body.messageContent !== "string") {
      return NextResponse.json({ error: "messageContent is required" }, { status: 400 });
    }

    const conversation = await createConversation(
      id,
      body.senderType,
      body.messageContent
    );

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Customer not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.startsWith("Invalid senderType") || error.message === "messageContent cannot be empty") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
