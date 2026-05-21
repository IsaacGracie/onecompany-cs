import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeList, createKnowledge } from "@/lib/services/knowledge.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const category = searchParams.get("category") || undefined;
  const isActiveParam = searchParams.get("isActive");
  const isActive = isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;

  const list = await getKnowledgeList({ category, isActive });
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.category || typeof body.category !== "string") {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const item = await createKnowledge({
      category: body.category,
      title: body.title,
      content: body.content,
      sortOrder: body.sortOrder,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("Invalid category")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("cannot be empty")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("Create knowledge error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
