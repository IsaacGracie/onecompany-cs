// ============================================
// 选项列表（用于下拉框、筛选器、应用层校验）
// ============================================

export const CONTACT_TYPES = [
  { value: "wechat", label: "微信" },
  { value: "phone", label: "手机号" },
  { value: "email", label: "邮箱" },
  { value: "other", label: "其他" },
] as const;

export const SOURCES = [
  { value: "xiaohongshu", label: "小红书" },
  { value: "douyin", label: "抖音" },
  { value: "wechat", label: "微信" },
  { value: "community", label: "社群" },
  { value: "friend", label: "朋友推荐" },
  { value: "other", label: "其他" },
] as const;

export const STATUSES = [
  { value: "new", label: "新线索", color: "blue" },
  { value: "serving", label: "接待中", color: "cyan" },
  { value: "need_confirm", label: "需求确认", color: "yellow" },
  { value: "quoted", label: "已报价", color: "orange" },
  { value: "won", label: "已成交", color: "green" },
  { value: "delivering", label: "交付中", color: "purple" },
  { value: "delivered", label: "已交付", color: "green" },
  { value: "after_sales", label: "售后中", color: "pink" },
  { value: "completed", label: "已完结", color: "gray" },
  { value: "lost", label: "已丢失", color: "red" },
] as const;

// ============================================
// 状态流转规则
// ============================================

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ["serving", "lost"],
  serving: ["need_confirm", "lost"],
  need_confirm: ["quoted", "lost"],
  quoted: ["won", "lost"],
  won: ["delivering", "lost"],
  delivering: ["delivered", "lost"],
  delivered: ["after_sales", "lost"],
  after_sales: ["completed"],
  completed: [],
  lost: [],
};

export function getNextStatuses(currentStatus: string): string[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

export function isValidTransition(fromStatus: string, toStatus: string): boolean {
  return getNextStatuses(fromStatus).includes(toStatus);
}

export const INTENT_LEVELS = [
  { value: "high", label: "高意向", color: "red" },
  { value: "medium", label: "中意向", color: "yellow" },
  { value: "low", label: "低意向", color: "gray" },
  { value: "unknown", label: "未判断", color: "default" },
] as const;

export const KNOWLEDGE_CATEGORIES = [
  { value: "service", label: "服务范围" },
  { value: "price", label: "价格区间" },
  { value: "process", label: "合作流程" },
  { value: "faq", label: "常见问题" },
  { value: "case", label: "案例说明" },
] as const;

// ============================================
// 类型推导
// ============================================

export type ContactType = (typeof CONTACT_TYPES)[number]["value"];
export type Source = (typeof SOURCES)[number]["value"];
export type Status = (typeof STATUSES)[number]["value"];
export type IntentLevel = (typeof INTENT_LEVELS)[number]["value"];
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number]["value"];
export type SenderType = "customer" | "ai" | "human";

// ============================================
// 预计算验证数组（用于 API/Service 层校验）
// ============================================

export const VALID_STATUSES: string[] = STATUSES.map((s) => s.value);
export const VALID_INTENT_LEVELS: string[] = INTENT_LEVELS.map((i) => i.value);
export const VALID_SOURCES: string[] = SOURCES.map((s) => s.value);
export const VALID_CONTACT_TYPES: string[] = CONTACT_TYPES.map((c) => c.value);
export const VALID_KNOWLEDGE_CATEGORIES: string[] = KNOWLEDGE_CATEGORIES.map((c) => c.value);
export const VALID_SENDER_TYPES: string[] = ["customer", "ai", "human"];

// ============================================
// API 请求/响应类型
// ============================================

export interface Customer {
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

export interface CreateCustomerInput {
  nickname: string;
  contactInfo?: string;
  contactType?: ContactType;
  source?: Source;
  notes?: string;
}

export interface UpdateCustomerInput {
  nickname?: string;
  contactInfo?: string;
  contactType?: ContactType;
  source?: Source;
  status?: Status;
  intentLevel?: IntentLevel;
  nextFollowAt?: string | null;
  notes?: string;
  remark?: string;
}

export interface CreateKnowledgeInput {
  category: KnowledgeCategory;
  title: string;
  content: string;
  sortOrder?: number;
}

export interface UpdateKnowledgeInput {
  category?: KnowledgeCategory;
  title?: string;
  content?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CustomerQueryParams {
  page?: number;
  pageSize?: number;
  status?: Status;
  intentLevel?: IntentLevel;
  source?: Source;
  keyword?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// AI 相关类型（snake_case JSON）
// ============================================

export const SUGGESTED_ACTIONS = [
  "continue_collect",
  "collect_summary",
  "quote_remind",
  "human_follow_up",
  "close_conversation",
  "escalate",
] as const;

export type SuggestedAction = (typeof SUGGESTED_ACTIONS)[number];

export const AI_INTENTS = [
  "inquiry_service",
  "inquiry_price",
  "inquiry_process",
  "inquiry_timeline",
  "submit_requirement",
  "follow_up",
  "complaint",
  "casual_chat",
  "other",
] as const;

export type AiIntent = (typeof AI_INTENTS)[number];

export const MISSING_INFO_KEYS = [
  "project_type",
  "budget_range",
  "timeline",
  "key_features",
  "reference_examples",
  "background_info",
  "decision_maker",
] as const;

export type MissingInfoKey = (typeof MISSING_INFO_KEYS)[number];

export interface AiAnalysisResult {
  intent: AiIntent;
  intent_level: IntentLevel;
  is_effective_lead: boolean;
  need_human: boolean;
  suggested_action: SuggestedAction;
  summary: string | null;
  missing_info: MissingInfoKey[];
  risk_flags: string[];
}

