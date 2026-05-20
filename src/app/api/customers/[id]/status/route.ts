import { NextResponse } from "next/server";
import { getStatusLogs } from "@/lib/services/customer.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const logs = await getStatusLogs(id);
  return NextResponse.json(logs);
}
