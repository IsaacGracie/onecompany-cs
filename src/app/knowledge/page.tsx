"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KNOWLEDGE_CATEGORIES } from "@/lib/types";
import { getLabelFromValue, formatDate } from "@/lib/utils";

interface KnowledgeItem {
  id: number;
  category: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState("");

  // 表单状态
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "service",
    title: "",
    content: "",
    sortOrder: 0,
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(`/api/knowledge?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    let ignore = false;

    async function loadItems() {
      await Promise.resolve();
      if (ignore) return;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryFilter) params.set("category", categoryFilter);

        const res = await fetch(`/api/knowledge?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setItems(data);
        }
      } catch {
        if (!ignore) setError("鍔犺浇澶辫触");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadItems();

    return () => {
      ignore = true;
    };
  }, [categoryFilter]);

  function openNewForm() {
    setEditingId(null);
    setForm({ category: "service", title: "", content: "", sortOrder: 0 });
    setShowForm(true);
    setError("");
  }

  function openEditForm(item: KnowledgeItem) {
    setEditingId(item.id);
    setForm({
      category: item.category,
      title: item.title,
      content: item.content,
      sortOrder: item.sortOrder,
    });
    setShowForm(true);
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("标题和内容不能为空");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = editingId ? `/api/knowledge/${editingId}` : "/api/knowledge";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          title: form.title.trim(),
          content: form.content.trim(),
          sortOrder: form.sortOrder,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存失败");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      fetchItems();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: KnowledgeItem) {
    try {
      const res = await fetch(`/api/knowledge/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (res.ok) fetchItems();
    } catch {
      setError("操作失败");
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (res.ok) fetchItems();
    } catch {
      setError("删除失败");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">知识库管理</h1>
        <Button onClick={openNewForm}>新增条目</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 筛选 */}
      <div className="mb-6">
        <Select
          value={categoryFilter || undefined}
          onValueChange={(v) => setCategoryFilter(!v || v === "__all" ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">全部分类</SelectItem>
            {KNOWLEDGE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 新增/编辑表单 */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? "编辑条目" : "新增条目"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>分类</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => v && setForm({ ...form, category: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KNOWLEDGE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>排序权重</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>标题</Label>
                <Input
                  placeholder="例如：我能做什么、合作流程说明"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>内容</Label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="知识库内容，AI 接待时会使用这些内容来回答客户"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setError("");
                  }}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">加载中...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          暂无知识库条目，点击右上角「新增条目」开始
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className={!item.isActive ? "opacity-50" : ""}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getLabelFromValue(KNOWLEDGE_CATEGORIES, item.category)}
                    </Badge>
                    <span className="font-medium">{item.title}</span>
                    {!item.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        已停用
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {item.content}
                  </p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    排序: {item.sortOrder} · 更新于 {formatDate(item.updatedAt)}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditForm(item)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant={item.isActive ? "secondary" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(item)}
                  >
                    {item.isActive ? "停用" : "启用"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
