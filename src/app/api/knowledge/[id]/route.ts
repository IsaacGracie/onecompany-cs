import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeById, updateKnowledge, deleteKnowledge } from "@/lib/services/knowledge.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const item = await getKnowledgeById(id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(
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
    const updateData: Record<string, unknown> = {};

    if (body.category !== undefined) updateData.category = body.category;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const item = await updateKnowledge(id, updateData);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("Invalid category") || error.message.includes("cannot be empty")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("Update knowledge error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const deleted = await deleteKnowledge(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
