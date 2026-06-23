"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  STATUSES,
  INTENT_LEVELS,
  SOURCES,
  CONTACT_TYPES,
  getNextStatuses,
} from "@/lib/types";
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
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StatusLog {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  remark: string | null;
  createdAt: string;
}

interface Conversation {
  id: number;
  customerId: number;
  senderType: string;
  messageContent: string;
  createdAt: string;
}

function getLabelFromValue(
  items: readonly { value: string; label: string }[],
  value: string
) {
  return items.find((i) => i.value === value)?.label || value;
}

// AI 分析字段中文映射
const AI_INTENT_LABELS: Record<string, string> = {
  inquiry_service: "咨询服务",
  inquiry_price: "询问价格",
  inquiry_process: "询问流程",
  inquiry_timeline: "询问时间",
  submit_requirement: "提交需求",
  follow_up: "主动跟进",
  complaint: "投诉",
  casual_chat: "闲聊",
  other: "其他",
};

const AI_INTENT_LEVEL_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
  unknown: "未判断",
};

const AI_ACTION_LABELS: Record<string, string> = {
  continue_collect: "继续收集信息",
  collect_summary: "生成需求摘要",
  quote_remind: "提醒人工报价",
  human_follow_up: "建议人工跟进",
  close_conversation: "可结束对话",
  escalate: "紧急需人工介入",
};

const AI_MISSING_INFO_LABELS: Record<string, string> = {
  project_type: "项目类型",
  budget_range: "预算范围",
  timeline: "期望时间",
  key_features: "关键功能",
  reference_examples: "参考案例",
  background_info: "客户背景",
  decision_maker: "决策人信息",
};

function getAiLabel(map: Record<string, string>, value: string): string {
  return map[value] || value;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getStatusBadgeVariant(status: string) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    new: "default",
    serving: "default",
    need_confirm: "outline",
    quoted: "outline",
    won: "secondary",
    delivering: "secondary",
    delivered: "secondary",
    after_sales: "outline",
    completed: "secondary",
    lost: "destructive",
  };
  return map[status] || "default";
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = Number(params.id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLostConfirm, setShowLostConfirm] = useState(false);
  const [lostRemark, setLostRemark] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newSenderType, setNewSenderType] = useState("human");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [providerMode, setProviderMode] = useState<"mock" | "openai-compatible">("mock");
  const [providerModel, setProviderModel] = useState("");
  const providerModeInitialized = useRef(false);
  const [aiResult, setAiResult] = useState<{
    reply: string;
    analysis: Record<string, unknown>;
    suggestConfirm: boolean;
    statusChanged: { from: string; to: string } | null;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    nickname: "",
    contactInfo: "",
    contactType: "",
    source: "",
    intentLevel: "",
    nextFollowAt: "",
    notes: "",
  });

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) {
        setError("客户不存在");
        return;
      }
      const data = await res.json();
      setCustomer(data);
      if (!providerModeInitialized.current) {
        setProviderMode(data.providerMode === "openai-compatible" ? "openai-compatible" : "mock");
        setProviderModel(
          typeof data.providerModel === "string" ? data.providerModel : ""
        );
        providerModeInitialized.current = true;
      }
      setEditForm({
        nickname: data.nickname,
        contactInfo: data.contactInfo || "",
        contactType: data.contactType,
        source: data.source,
        intentLevel: data.intentLevel,
        nextFollowAt: data.nextFollowAt
          ? data.nextFollowAt.slice(0, 16)
          : "",
        notes: data.notes || "",
      });
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchStatusLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatusLogs(data);
      }
    } catch {
      // 日志加载失败不影响主流程
    }
  }, [customerId]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}/chats`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // 对话加载失败不影响主流程
    }
  }, [customerId]);

  /* eslint-disable react-hooks/set-state-in-effect -- These callbacks synchronize page state with API responses. */
  useEffect(() => {
    fetchCustomer();
    fetchStatusLogs();
    fetchConversations();
  }, [fetchCustomer, fetchStatusLogs, fetchConversations]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSaveInfo() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: editForm.nickname.trim(),
          contactInfo: editForm.contactInfo.trim() || null,
          contactType: editForm.contactType,
          source: editForm.source,
          intentLevel: editForm.intentLevel,
          nextFollowAt: editForm.nextFollowAt || null,
          notes: editForm.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存失败");
        return;
      }

      setEditing(false);
      fetchCustomer();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string, remark?: string) {
    try {
      const body: Record<string, string> = { status: newStatus };
      if (remark) body.remark = remark;

      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchCustomer();
        fetchStatusLogs();
      } else {
        const data = await res.json();
        setError(data.error || "状态更新失败");
      }
    } catch {
      setError("状态更新失败");
    }
  }

  async function handleConfirmLost() {
    const remark = lostRemark.trim() || "人工标记为已丢失";
    setShowLostConfirm(false);
    setLostRemark("");
    await handleStatusChange("lost", remark);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderType: newSenderType,
          messageContent: newMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchConversations();
        fetchCustomer();
      } else {
        const data = await res.json();
        setError(data.error || "发送失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleAiChat(e: React.FormEvent) {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setAiLoading(true);
    setAiResult(null);
    setError("");

    try {
      const res = await fetch(`/api/customers/${customerId}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: aiInput.trim(),
          providerMode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "AI 接待失败");
        return;
      }

      const data = await res.json();
      setAiResult({
        reply: data.aiMessage.content,
        analysis: data.analysis,
        suggestConfirm: data.suggestConfirm,
        statusChanged: data.statusChanged,
      });
      setAiInput("");
      fetchConversations();
      fetchCustomer();
      fetchStatusLogs();
    } catch {
      setError("AI 接待暂时不可用，请人工确认");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/customers");
      }
    } catch {
      setError("删除失败");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted-foreground">
        {error || "客户不存在"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 顶部导航 */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/customers")}>
          ← 返回列表
        </Button>
        <div className="flex gap-2">
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              编辑信息
            </Button>
          )}
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              删除
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">确认删除？</span>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                确认
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 客户基本信息 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {customer.nickname}
              <Badge variant={getStatusBadgeVariant(customer.status)}>
                {getLabelFromValue(STATUSES, customer.status)}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>昵称/姓名</Label>
                  <Input
                    value={editForm.nickname}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nickname: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>联系方式类型</Label>
                  <Select
                    value={editForm.contactType}
                    onValueChange={(v) =>
                      v && setEditForm({ ...editForm, contactType: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TYPES.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>
                          {ct.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>联系方式</Label>
                  <Input
                    value={editForm.contactInfo}
                    onChange={(e) =>
                      setEditForm({ ...editForm, contactInfo: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>来源渠道</Label>
                  <Select
                    value={editForm.source}
                    onValueChange={(v) =>
                      v && setEditForm({ ...editForm, source: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>意向等级</Label>
                  <Select
                    value={editForm.intentLevel}
                    onValueChange={(v) =>
                      v && setEditForm({ ...editForm, intentLevel: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTENT_LEVELS.map((i) => (
                        <SelectItem key={i.value} value={i.value}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>下次跟进时间</Label>
                  <Input
                    type="datetime-local"
                    value={editForm.nextFollowAt}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nextFollowAt: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>备注</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveInfo} disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                    // 恢复原始值
                    setEditForm({
                      nickname: customer.nickname,
                      contactInfo: customer.contactInfo || "",
                      contactType: customer.contactType,
                      source: customer.source,
                      intentLevel: customer.intentLevel,
                      nextFollowAt: customer.nextFollowAt
                        ? customer.nextFollowAt.slice(0, 16)
                        : "",
                      notes: customer.notes || "",
                    });
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">联系方式：</span>
                <span>
                  {getLabelFromValue(CONTACT_TYPES, customer.contactType)}
                  {customer.contactInfo ? ` · ${customer.contactInfo}` : ""}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">来源渠道：</span>
                <span>{getLabelFromValue(SOURCES, customer.source)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">意向等级：</span>
                <span>{getLabelFromValue(INTENT_LEVELS, customer.intentLevel)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">下次跟进：</span>
                <span>{formatDate(customer.nextFollowAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">最近沟通：</span>
                <span>{formatDate(customer.lastContactAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">创建时间：</span>
                <span>{formatDate(customer.createdAt)}</span>
              </div>
              {customer.notes && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">备注：</span>
                  <span>{customer.notes}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 状态流转 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>状态流转</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">当前状态：</span>
            <Badge variant={getStatusBadgeVariant(customer.status)}>
              {getLabelFromValue(STATUSES, customer.status)}
            </Badge>
          </div>
          {(() => {
            const nextStatuses = getNextStatuses(customer.status);
            if (nextStatuses.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">
                  该状态为终态，不可继续流转
                </p>
              );
            }
            return (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">可流转到：</p>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((s) => {
                    const statusInfo = STATUSES.find((st) => st.value === s);
                    return (
                      <Button
                        key={s}
                        variant={s === "lost" ? "destructive" : "default"}
                        size="sm"
                        onClick={() => {
                          if (s === "lost") {
                            setShowLostConfirm(true);
                          } else {
                            handleStatusChange(s);
                          }
                        }}
                      >
                        {statusInfo?.label || s}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* AI 接待 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI 接待
            <Badge variant="outline" className="text-xs font-normal">
              {providerMode === "openai-compatible"
                ? providerModel || "未配置"
                : "Mock 规则演示"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAiChat} className="mb-4 space-y-3">
            <div className="flex items-center gap-3">
              <Label htmlFor="provider-mode" className="shrink-0">
                本次使用
              </Label>
              <Select
                value={providerMode}
                onValueChange={(value) =>
                  value &&
                  setProviderMode(value as "mock" | "openai-compatible")
                }
                disabled={aiLoading}
              >
                <SelectTrigger id="provider-mode" className="w-48">
                  <SelectValue>
                    {providerMode === "openai-compatible"
                      ? providerModel || "未配置"
                      : "Mock 规则演示"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai-compatible">
                    {providerModel || "未配置"}
                  </SelectItem>
                  <SelectItem value="mock">Mock 规则演示</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {providerMode === "mock"
                  ? "仅分析本次输入，不使用历史对话或知识库"
                  : "使用最近对话与知识库检索上下文"}
              </span>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="输入客户消息，点击 AI 接待..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="flex-1"
                disabled={aiLoading}
              />
              <Button type="submit" disabled={aiLoading || !aiInput.trim()}>
                {aiLoading ? "处理中..." : "AI 接待"}
              </Button>
            </div>
          </form>

          {aiResult && (
            <div className="space-y-4">
              {/* 状态变更提示 */}
              {aiResult.statusChanged && (
                <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  状态已自动变更：{getLabelFromValue(STATUSES, aiResult.statusChanged.from)} → {getLabelFromValue(STATUSES, aiResult.statusChanged.to)}
                </div>
              )}

              {/* collect_summary 提示 */}
              {aiResult.suggestConfirm && (
                <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm dark:bg-yellow-950">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    AI 建议转入需求确认
                  </p>
                  <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                    AI 已收集到足够信息，建议您查看需求摘要后决定是否将状态转为「需求确认」。
                  </p>
                </div>
              )}

              {/* AI 回复 */}
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">AI 回复</p>
                <div className="whitespace-pre-wrap rounded-lg bg-muted px-4 py-3 text-sm">
                  {aiResult.reply}
                </div>
              </div>

              {/* 结构化分析 */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">结构化分析</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">意图：</span>
                    <span>{getAiLabel(AI_INTENT_LABELS, String(aiResult.analysis.intent))}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">意向等级：</span>
                    <span>{getAiLabel(AI_INTENT_LEVEL_LABELS, String(aiResult.analysis.intent_level))}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">有效线索：</span>
                    <span>{aiResult.analysis.is_effective_lead ? "是" : "否"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">建议人工：</span>
                    <span>{aiResult.analysis.need_human ? "是" : "否"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">建议动作：</span>
                    <span>{getAiLabel(AI_ACTION_LABELS, String(aiResult.analysis.suggested_action))}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">项目类型：</span>
                    <span>{typeof aiResult.analysis.project_type === "string" && aiResult.analysis.project_type ? aiResult.analysis.project_type : "未识别"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">预算：</span>
                    <span>{typeof aiResult.analysis.budget_range === "string" && aiResult.analysis.budget_range ? aiResult.analysis.budget_range : "未识别"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">期望时间：</span>
                    <span>{typeof aiResult.analysis.timeline === "string" && aiResult.analysis.timeline ? aiResult.analysis.timeline : "未识别"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">已确认需求：</span>
                    <span>{Array.isArray(aiResult.analysis.requirements) && (aiResult.analysis.requirements as string[]).length > 0 ? (aiResult.analysis.requirements as string[]).join("、") : "暂无"}</span>
                  </div>
                  {typeof aiResult.analysis.summary === "string" && aiResult.analysis.summary && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">摘要：</span>
                      <span>{String(aiResult.analysis.summary)}</span>
                    </div>
                  )}
                  {Array.isArray(aiResult.analysis.missing_info) && (aiResult.analysis.missing_info as string[]).length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">缺少信息：</span>
                      <span>{(aiResult.analysis.missing_info as string[]).map((k) => getAiLabel(AI_MISSING_INFO_LABELS, k)).join("、")}</span>
                    </div>
                  )}
                  {Array.isArray(aiResult.analysis.risk_flags) && (aiResult.analysis.risk_flags as string[]).length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">风险标记：</span>
                      <span className="text-destructive">{(aiResult.analysis.risk_flags as string[]).join("、")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 对话记录 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>对话记录 ({conversations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 对话时间线 */}
          {conversations.length === 0 ? (
            <p className="mb-4 text-sm text-muted-foreground">暂无对话记录</p>
          ) : (
            <div className="mb-6 space-y-4">
              {conversations.map((msg) => {
                const isCustomer = msg.senderType === "customer";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                        isCustomer
                          ? "bg-muted text-foreground"
                          : msg.senderType === "ai"
                          ? "bg-blue-50 text-foreground ring-1 ring-blue-200 dark:bg-blue-950 dark:ring-blue-800"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <Badge
                          variant={isCustomer ? "outline" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {msg.senderType === "customer"
                            ? "客户"
                            : msg.senderType === "ai"
                            ? "AI"
                            : "人工"}
                        </Badge>
                        <span className="text-[11px] opacity-60">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.messageContent}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 录入对话表单 */}
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex gap-3">
              <Select
                value={newSenderType}
                onValueChange={(v) => v && setNewSenderType(v)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="human">人工</SelectItem>
                  <SelectItem value="customer">客户</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="输入对话内容..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                {sendingMessage ? "发送中" : "发送"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 状态变更日志 */}
      <Card>
        <CardHeader>
          <CardTitle>状态变更记录</CardTitle>
        </CardHeader>
        <CardContent>
          {statusLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无状态变更记录</p>
          ) : (
            <div className="space-y-3">
              {statusLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <span className="text-muted-foreground whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </span>
                  <div>
                    {log.fromStatus ? (
                      <span>
                        <Badge variant="outline" className="text-xs">
                          {getLabelFromValue(STATUSES, log.fromStatus)}
                        </Badge>
                        {" → "}
                        <Badge variant="outline" className="text-xs">
                          {getLabelFromValue(STATUSES, log.toStatus)}
                        </Badge>
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {getLabelFromValue(STATUSES, log.toStatus)}
                      </Badge>
                    )}
                    <span className="ml-2 text-muted-foreground">
                      ({log.changedBy === "ai" ? "AI" : "人工"})
                    </span>
                    {log.remark && (
                      <span className="ml-2 text-muted-foreground">
                        {log.remark}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 已丢失确认弹窗 */}
      {showLostConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg ring-1 ring-foreground/10">
            <h2 className="mb-2 text-lg font-semibold">确认标记为已丢失？</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              该客户标记为已丢失后将作为终态，不能继续流转。请确认是否继续。
            </p>
            <div className="mb-4 space-y-2">
              <Label htmlFor="lost-remark">丢失原因（选填）</Label>
              <textarea
                id="lost-remark"
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="例如：客户无预算、需求不匹配、客户已找到其他供应商"
                value={lostRemark}
                onChange={(e) => setLostRemark(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLostConfirm(false);
                  setLostRemark("");
                }}
              >
                取消
              </Button>
              <Button variant="destructive" onClick={handleConfirmLost}>
                确认标记为已丢失
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
