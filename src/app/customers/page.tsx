"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, INTENT_LEVELS, SOURCES } from "@/lib/types";
import { getStatusBadgeVariant, getLabelFromValue, formatDate } from "@/lib/utils";

interface Customer {
  id: number;
  nickname: string;
  contactInfo: string | null;
  contactType: string;
  source: string;
  status: string;
  intentLevel: string;
  nextFollowAt: string | null;
  lastContactAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerListResponse {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [intentFilter, setIntentFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "10");
    if (keyword) params.set("keyword", keyword);
    if (statusFilter) params.set("status", statusFilter);
    if (intentFilter) params.set("intentLevel", intentFilter);
    if (sourceFilter) params.set("source", sourceFilter);

    try {
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data: CustomerListResponse = await res.json();
      setCustomers(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, statusFilter, intentFilter, sourceFilter]);

  /* eslint-disable react-hooks/set-state-in-effect -- This callback synchronizes list state with the customer API. */
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  }

  function clearFilters() {
    setKeyword("");
    setStatusFilter("");
    setIntentFilter("");
    setSourceFilter("");
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">客户列表</h1>
        <Link href="/customers/new">
          <Button>新增客户</Button>
        </Link>
      </div>

      {/* 筛选区 */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            placeholder="搜索昵称/联系方式/备注"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-60"
          />
          <Button type="submit" variant="secondary" size="sm">
            搜索
          </Button>
        </form>

        <Select
          value={statusFilter || undefined}
          onValueChange={(v) => {
            setStatusFilter(!v || v === "__all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">全部状态</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={intentFilter || undefined}
          onValueChange={(v) => {
            setIntentFilter(!v || v === "__all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="意向" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">全部意向</SelectItem>
            {INTENT_LEVELS.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sourceFilter || undefined}
          onValueChange={(v) => {
            setSourceFilter(!v || v === "__all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="来源" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">全部来源</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(statusFilter || intentFilter || sourceFilter || keyword) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            清除筛选
          </Button>
        )}
      </div>

      {/* 客户表格 */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">加载中...</div>
      ) : customers.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          暂无客户，点击右上角「新增客户」开始
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium">客户</th>
                  <th className="px-4 py-3 font-medium">联系方式</th>
                  <th className="px-4 py-3 font-medium">来源</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">意向</th>
                  <th className="px-4 py-3 font-medium">最近沟通</th>
                  <th className="px-4 py-3 font-medium">更新时间</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.nickname}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.contactInfo || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {getLabelFromValue(SOURCES, c.source)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(c.status)}>
                        {getLabelFromValue(STATUSES, c.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {getLabelFromValue(INTENT_LEVELS, c.intentLevel)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(c.lastContactAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(c.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>共 {total} 条记录</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <span>
                第 {page} / {totalPages || 1} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
