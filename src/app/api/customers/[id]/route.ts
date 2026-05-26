import { NextRequest, NextResponse } from "next/server";
import { getCustomerById, updateCustomer, deleteCustomer } from "@/lib/services/customer.service";
import type { UpdateCustomerInput } from "@/lib/types";
import { VALID_STATUSES, VALID_INTENT_LEVELS, VALID_SOURCES, VALID_CONTACT_TYPES } from "@/lib/types";

function parseId(params: { id: string }): number | null {
  const id = Number(params.id);
  if (Number.isNaN(id) || id <= 0) return null;
  return id;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const customer = await getCustomerById(id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseId(resolvedParams);
    if (id === null) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const input: UpdateCustomerInput = {};

    if (body.nickname !== undefined) {
      if (typeof body.nickname !== "string" || body.nickname.trim() === "") {
        return NextResponse.json({ error: "nickname cannot be empty" }, { status: 400 });
      }
      input.nickname = body.nickname.trim();
    }

    if (body.contactInfo !== undefined) input.contactInfo = body.contactInfo;
    if (body.notes !== undefined) input.notes = body.notes;
    if (body.nextFollowAt !== undefined) input.nextFollowAt = body.nextFollowAt;

    if (body.contactType !== undefined) {
      if (!VALID_CONTACT_TYPES.includes(body.contactType)) {
        return NextResponse.json({ error: `Invalid contactType: ${body.contactType}` }, { status: 400 });
      }
      input.contactType = body.contactType;
    }

    if (body.source !== undefined) {
      if (!VALID_SOURCES.includes(body.source)) {
        return NextResponse.json({ error: `Invalid source: ${body.source}` }, { status: 400 });
      }
      input.source = body.source;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
      }
      input.status = body.status;
    }

    if (body.intentLevel !== undefined) {
      if (!VALID_INTENT_LEVELS.includes(body.intentLevel)) {
        return NextResponse.json({ error: `Invalid intentLevel: ${body.intentLevel}` }, { status: 400 });
      }
      input.intentLevel = body.intentLevel;
    }

    if (body.remark !== undefined && typeof body.remark === "string") {
      input.remark = body.remark.trim() || undefined;
    }

    const customer = await updateCustomer(id, input);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("非法状态流转")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Invalid status")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Update customer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const deleted = await deleteCustomer(id);
  if (!deleted) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
