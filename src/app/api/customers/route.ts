import { NextRequest, NextResponse } from "next/server";
import { getCustomers, createCustomer } from "@/lib/services/customer.service";
import type { CustomerQueryParams, CreateCustomerInput } from "@/lib/types";
import { VALID_STATUSES, VALID_INTENT_LEVELS, VALID_SOURCES, VALID_CONTACT_TYPES } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const params: CustomerQueryParams = {
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 10,
  };

  const status = searchParams.get("status");
  if (status && VALID_STATUSES.includes(status)) {
    params.status = status as CustomerQueryParams["status"];
  }

  const intentLevel = searchParams.get("intentLevel");
  if (intentLevel && VALID_INTENT_LEVELS.includes(intentLevel)) {
    params.intentLevel = intentLevel as CustomerQueryParams["intentLevel"];
  }

  const source = searchParams.get("source");
  if (source && VALID_SOURCES.includes(source)) {
    params.source = source as CustomerQueryParams["source"];
  }

  const keyword = searchParams.get("keyword");
  if (keyword) params.keyword = keyword;

  const result = await getCustomers(params);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nickname || typeof body.nickname !== "string" || body.nickname.trim() === "") {
      return NextResponse.json({ error: "nickname is required" }, { status: 400 });
    }

    if (body.contactType && !VALID_CONTACT_TYPES.includes(body.contactType)) {
      return NextResponse.json({ error: `Invalid contactType: ${body.contactType}` }, { status: 400 });
    }

    if (body.source && !VALID_SOURCES.includes(body.source)) {
      return NextResponse.json({ error: `Invalid source: ${body.source}` }, { status: 400 });
    }

    const input: CreateCustomerInput = {
      nickname: body.nickname.trim(),
      contactInfo: body.contactInfo,
      contactType: body.contactType,
      source: body.source,
      notes: body.notes,
    };

    const customer = await createCustomer(input);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
