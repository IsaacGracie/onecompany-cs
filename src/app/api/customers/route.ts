import { NextRequest, NextResponse } from "next/server";
import { getCustomers, createCustomer } from "@/lib/services/customer.service";
import type { CustomerQueryParams, CreateCustomerInput } from "@/lib/types";
import { STATUSES, INTENT_LEVELS, SOURCES, CONTACT_TYPES } from "@/lib/types";

const validStatuses = STATUSES.map((s) => s.value);
const validIntentLevels = INTENT_LEVELS.map((i) => i.value);
const validSources = SOURCES.map((s) => s.value);
const validContactTypes = CONTACT_TYPES.map((c) => c.value);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const params: CustomerQueryParams = {
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 10,
  };

  const status = searchParams.get("status");
  if (status && validStatuses.includes(status as typeof validStatuses[number])) {
    params.status = status as CustomerQueryParams["status"];
  }

  const intentLevel = searchParams.get("intentLevel");
  if (intentLevel && validIntentLevels.includes(intentLevel as typeof validIntentLevels[number])) {
    params.intentLevel = intentLevel as CustomerQueryParams["intentLevel"];
  }

  const source = searchParams.get("source");
  if (source && validSources.includes(source as typeof validSources[number])) {
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

    if (body.contactType && !validContactTypes.includes(body.contactType)) {
      return NextResponse.json({ error: `Invalid contactType: ${body.contactType}` }, { status: 400 });
    }

    if (body.source && !validSources.includes(body.source)) {
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
