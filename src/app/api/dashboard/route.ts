import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { STATUSES } from "@/lib/types";

export async function GET() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // 并行查询所有数据
  const [
    total,
    statsRows,
    todayFollowUps,
    overdueFollowUps,
    aiSummaryCustomers,
    quotedStale,
    wonStale,
    deliveredStale,
    afterSalesCustomers,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // 今日待跟进：nextFollowAt 在今天范围内，且状态非终态
    prisma.customer.findMany({
      where: {
        nextFollowAt: { gte: todayStart, lt: todayEnd },
        status: { notIn: ["completed", "lost"] },
      },
      orderBy: { nextFollowAt: "asc" },
      select: { id: true, nickname: true, status: true, nextFollowAt: true, intentLevel: true },
    }),
    // 逾期未跟进：nextFollowAt 早于今天，且状态非终态
    prisma.customer.findMany({
      where: {
        nextFollowAt: { lt: todayStart },
        status: { notIn: ["completed", "lost"] },
      },
      orderBy: { nextFollowAt: "asc" },
      select: { id: true, nickname: true, status: true, nextFollowAt: true, intentLevel: true },
    }),
    // 待人工确认信息：serving 且已有 AI 摘要
    prisma.customer.findMany({
      where: {
        status: "serving",
        aiSummary: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, nickname: true, status: true, aiSummary: true, updatedAt: true },
    }),
    // 已报价且最近 7 天未更新
    prisma.customer.findMany({
      where: {
        status: "quoted",
        updatedAt: { lt: sevenDaysAgo },
      },
      orderBy: { updatedAt: "asc" },
      select: { id: true, nickname: true, status: true, updatedAt: true },
    }),
    // 已成交且最近 3 天未更新
    prisma.customer.findMany({
      where: {
        status: "won",
        updatedAt: { lt: threeDaysAgo },
      },
      orderBy: { updatedAt: "asc" },
      select: { id: true, nickname: true, status: true, updatedAt: true },
    }),
    // 已交付且最近 7 天未更新
    prisma.customer.findMany({
      where: {
        status: "delivered",
        updatedAt: { lt: sevenDaysAgo },
      },
      orderBy: { updatedAt: "asc" },
      select: { id: true, nickname: true, status: true, updatedAt: true },
    }),
    // 售后中客户
    prisma.customer.findMany({
      where: { status: "after_sales" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, nickname: true, status: true, updatedAt: true },
    }),
  ]);

  // 构造 stats 对象
  const statusMap: Record<string, number> = {};
  for (const row of statsRows) {
    statusMap[row.status] = row._count.id;
  }
  const allStatusValues = STATUSES.map((s) => s.value);
  const stats: Record<string, number> = { total };
  for (const sv of allStatusValues) {
    stats[sv] = statusMap[sv] || 0;
  }

  return NextResponse.json({
    stats,
    todayFollowUps,
    overdueFollowUps,
    aiSummaryCustomers,
    quotedStale,
    wonStale,
    deliveredStale,
    afterSalesCustomers,
  });
}
