"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUSES } from "@/lib/types";
import { getStatusBadgeVariant, getLabelFromValue, formatDateShort } from "@/lib/utils";

interface DashboardCustomer {
  id: number;
  nickname: string;
  status: string;
  nextFollowAt?: string | null;
  aiSummary?: string | null;
  updatedAt?: string;
  intentLevel?: string;
}

interface DashboardData {
  stats: Record<string, number>;
  todayFollowUps: DashboardCustomer[];
  overdueFollowUps: DashboardCustomer[];
  aiNeedConfirm: DashboardCustomer[];
  quotedOverdue: DashboardCustomer[];
  wonNotDelivering: DashboardCustomer[];
  deliveredNeedAfterSales: DashboardCustomer[];
  afterSalesCustomers: DashboardCustomer[];
}

function getStatusLabel(status: string): string {
  return STATUSES.find((s) => s.value === status)?.label || status;
}

function daysAgo(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

/** 从 aiSummary 中提取关键信息，精简为两行 */
function summarizeAiSummary(raw: string | null | undefined): string {
  if (!raw) return "";
  // aiSummary 格式：客户表示"..."。已收集信息：项目类型：xxx；功能需求：xxx；预算：xxx；期望时间：xxx。
  const parts: string[] = [];
  const fields = [
    { key: "项目类型", label: "项目类型" },
    { key: "功能需求", label: "功能" },
    { key: "预算", label: "预算" },
    { key: "期望时间", label: "时间" },
  ];
  for (const f of fields) {
    const m = raw.match(new RegExp(`${f.key}[：:](.+?)(；|$|。)`));
    if (m) parts.push(`${f.label}：${m[1].trim()}`);
  }
  if (parts.length > 0) return parts.join(" · ");
  // fallback：截断原文
  return raw.length > 60 ? raw.slice(0, 60) + "..." : raw;
}

/** 结构化客户提醒卡片 */
function ReminderCard({
  customer,
  router,
  reminderType,
  description,
}: {
  customer: DashboardCustomer;
  router: ReturnType<typeof useRouter>;
  reminderType: string;
  description?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/customers/${customer.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/customers/${customer.id}`)}
      className="rounded-lg border bg-card px-3.5 py-3 transition-colors hover:bg-muted/60 cursor-pointer"
    >
      {/* 第一行：客户昵称 */}
      <div className="mb-1.5 font-medium text-sm">{customer.nickname}</div>
      {/* 第二行：状态 Badge + 提醒类型 */}
      <div className="mb-1.5 flex items-center gap-2">
        <Badge variant={getStatusBadgeVariant(customer.status)} className="text-[10px] px-1.5 py-0">
          {getStatusLabel(customer.status)}
        </Badge>
        <span className="text-xs text-muted-foreground">{reminderType}</span>
      </div>
      {/* 第三行：摘要/描述，最多两行省略 */}
      {description && (
        <div className="mb-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </div>
      )}
      {/* 第四行：查看客户 */}
      <div className="text-xs font-medium text-primary hover:underline mt-0.5">
        查看客户 →
      </div>
    </div>
  );
}

/** 带自定义空状态的卡片区块 */
function SectionCard({
  title,
  count,
  emptyText,
  accent,
  children,
}: {
  title: string;
  count: number;
  emptyText: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {title}
          {count > 0 && (
            <Badge variant="outline" className={`text-xs ${accent || ""}`}>
              {count}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {count === 0 ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-2.5">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

/** 统计概览中的小卡片 */
function StatCard({
  label,
  value,
  color,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border bg-card p-4 text-center transition-colors hover:bg-muted"
    >
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) {
          setError("加载看板失败");
          return;
        }
        setData(await res.json());
      } catch {
        setError("网络错误");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-destructive">
        {error || "加载失败"}
      </div>
    );
  }

  const s = data.stats;
  const urgentCount =
    data.overdueFollowUps.length +
    data.quotedOverdue.length +
    data.wonNotDelivering.length +
    data.deliveredNeedAfterSales.length;

  const goCustomers = () => router.push("/customers");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">客服看板</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        优先处理逾期未跟进、AI 建议需求确认和已报价未回复客户。
      </p>

      {/* 统计概览 */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard label="客户总数" value={s.total} color="" onClick={goCustomers} />
        <StatCard label="新线索" value={s.new} color="text-blue-600" onClick={goCustomers} />
        <StatCard label="接待中" value={s.serving} color="text-cyan-600" onClick={goCustomers} />
        <StatCard label="需求确认" value={s.need_confirm} color="text-yellow-600" onClick={goCustomers} />
        <StatCard label="已报价" value={s.quoted} color="text-orange-600" onClick={goCustomers} />
        <StatCard label="已成交" value={s.won} color="text-green-600" onClick={goCustomers} />
        <StatCard label="交付中" value={s.delivering} color="text-purple-600" onClick={goCustomers} />
        <StatCard label="售后中" value={s.after_sales} color="text-pink-600" onClick={goCustomers} />
      </div>

      {/* 紧急提醒横幅 */}
      {urgentCount > 0 && (
        <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
          有 {urgentCount} 项需要立即处理的事项
        </div>
      )}

      {/* 第一屏：今日待办 */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="今日待跟进"
          count={data.todayFollowUps.length}
          emptyText="今天没有需要跟进的客户"
        >
          {data.todayFollowUps.map((c) => (
            <ReminderCard
              key={c.id}
              customer={c}
              router={router}
              reminderType="今日待跟进"
              description={`计划跟进时间：${formatDateShort(c.nextFollowAt)}`}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="逾期未跟进"
          count={data.overdueFollowUps.length}
          emptyText="暂无逾期客户"
          accent="text-destructive"
        >
          {data.overdueFollowUps.map((c) => (
            <ReminderCard
              key={c.id}
              customer={c}
              router={router}
              reminderType={`逾期 ${daysAgo(c.nextFollowAt)} 天未跟进`}
              description={`计划跟进时间：${formatDateShort(c.nextFollowAt)}`}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="AI 建议需求确认"
          count={data.aiNeedConfirm.length}
          emptyText="暂无 AI 建议确认的客户"
        >
          {data.aiNeedConfirm.map((c) => (
            <ReminderCard
              key={c.id}
              customer={c}
              router={router}
              reminderType="AI 建议需求确认"
              description={summarizeAiSummary(c.aiSummary) || undefined}
            />
          ))}
        </SectionCard>
      </div>

      {/* 第二屏：阶段提醒 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <SectionCard
          title="已报价待跟进"
          count={data.quotedOverdue.length}
          emptyText="暂无报价超期客户"
          accent="text-orange-600"
        >
          {data.quotedOverdue.map((c) => (
            <ReminderCard
              key={c.id}
              customer={c}
              router={router}
              reminderType={`报价后 ${daysAgo(c.updatedAt)} 天未跟进`}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="已成交待交付"
          count={data.wonNotDelivering.length}
          emptyText="暂无待交付客户"
          accent="text-green-600"
        >
          {data.wonNotDelivering.map((c) => (
            <ReminderCard
              key={c.id}
              customer={c}
              router={router}
              reminderType={`成交后 ${daysAgo(c.updatedAt)} 天未开始交付`}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="已交付待确认售后"
          count={data.deliveredNeedAfterSales.length}
          emptyText="暂无待确认售后客户"
        >
          {data.deliveredNeedAfterSales.map((c) => (
            <ReminderCard
              key={c.id}
              customer={c}
              router={router}
              reminderType={`已交付 ${daysAgo(c.updatedAt)} 天，建议确认售后`}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="售后中"
          count={data.afterSalesCustomers.length}
          emptyText="暂无售后中客户"
        >
          {data.afterSalesCustomers.map((c) => (
            <ReminderCard
              key={c.id}
              customer={c}
              router={router}
              reminderType={`售后进行中，已 ${daysAgo(c.updatedAt)} 天`}
            />
          ))}
        </SectionCard>
      </div>
    </div>
  );
}
