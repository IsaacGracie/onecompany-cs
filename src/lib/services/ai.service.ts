import { prisma } from "@/lib/db";
import { MockAiProvider } from "@/lib/ai/mock";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { ChatMessage } from "@/lib/ai/provider";
import type { AiAnalysisResult } from "@/lib/types";
import { SUGGESTED_ACTIONS, AI_INTENTS, VALID_INTENT_LEVELS } from "@/lib/types";

function parseAiResponse(rawContent: string): { reply: string; analysis: AiAnalysisResult } {
  const separator = "---ANALYSIS---";
  const parts = rawContent.split(separator);

  const reply = parts[0]?.trim() || rawContent;

  let analysis: AiAnalysisResult = {
    intent: "other",
    intent_level: "unknown",
    is_effective_lead: false,
    need_human: false,
    suggested_action: "continue_collect",
    summary: null,
    missing_info: [],
    risk_flags: [],
  };

  if (parts.length > 1) {
    try {
      const parsed = JSON.parse(parts[1].trim());
      analysis = {
        intent: AI_INTENTS.includes(parsed.intent) ? parsed.intent : "other",
        intent_level: VALID_INTENT_LEVELS.includes(parsed.intent_level) ? parsed.intent_level : "unknown",
        is_effective_lead: Boolean(parsed.is_effective_lead),
        need_human: Boolean(parsed.need_human),
        suggested_action: SUGGESTED_ACTIONS.includes(parsed.suggested_action)
          ? parsed.suggested_action
          : "continue_collect",
        summary: typeof parsed.summary === "string" ? parsed.summary : null,
        missing_info: Array.isArray(parsed.missing_info) ? parsed.missing_info : [],
        risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
      };
    } catch {
      // 解析失败使用默认值
    }
  }

  return { reply, analysis };
}

export async function getActiveKnowledgeContext(): Promise<string> {
  const items = await prisma.knowledgeBase.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  if (items.length === 0) return "";

  const grouped: Record<string, string[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(`- ${item.title}：${item.content}`);
  }

  const categoryLabels: Record<string, string> = {
    service: "服务范围",
    price: "价格区间",
    process: "合作流程",
    faq: "常见问题",
    case: "案例说明",
  };

  return Object.entries(grouped)
    .map(([cat, entries]) => `【${categoryLabels[cat] || cat}】\n${entries.join("\n")}`)
    .join("\n\n");
}

export async function getConversationHistory(customerId: number): Promise<ChatMessage[]> {
  const conversations = await prisma.conversation.findMany({
    where: { customerId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  return conversations.map((c) => ({
    role: (c.senderType === "customer" ? "user" : "assistant") as "user" | "assistant",
    content: c.messageContent,
  }));
}

export interface AiChatResult {
  customerMessage: { id: number; content: string };
  aiMessage: { id: number; content: string };
  analysis: AiAnalysisResult;
  customer: { id: number; status: string; aiSummary: string | null };
  statusChanged: { from: string; to: string } | null;
  suggestConfirm: boolean;
}

export async function handleAiChat(
  customerId: number,
  customerMessageContent: string
): Promise<AiChatResult> {
  // 1. 获取客户信息
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Customer not found");

  // 2. 保存客户消息
  const customerMsg = await prisma.conversation.create({
    data: {
      customerId,
      senderType: "customer",
      messageContent: customerMessageContent.trim(),
    },
  });

  // 3. 构造 Prompt
  const ownerName = process.env.APP_OWNER_NAME || "我的工作室";
  const knowledgeContext = await getActiveKnowledgeContext();
  const systemPrompt = buildSystemPrompt(ownerName, knowledgeContext);
  const history = await getConversationHistory(customerId);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  // 4. 调用 Mock AI
  const provider = new MockAiProvider();
  const aiResponse = await provider.chat(messages);

  // 5. 解析 AI 响应
  const { reply, analysis } = parseAiResponse(aiResponse.content);

  // 6. 保存 AI 回复
  const aiMsg = await prisma.conversation.create({
    data: {
      customerId,
      senderType: "ai",
      messageContent: reply,
    },
  });

  // 7. 更新 lastContactAt
  const now = new Date();

  // 8. 处理业务逻辑
  const updateData: Record<string, unknown> = { lastContactAt: now };
  let statusChanged: { from: string; to: string } | null = null;
  let suggestConfirm = false;

  // 如果 suggested_action = collect_summary 且有摘要，更新 aiSummary
  if (analysis.suggested_action === "collect_summary" && analysis.summary) {
    updateData.aiSummary = analysis.summary;
    suggestConfirm = true;
  }

  // 如果客户状态是 new，AI 首次回复后自动转为 serving
  if (customer.status === "new") {
    updateData.status = "serving";
    statusChanged = { from: "new", to: "serving" };

    await prisma.statusLog.create({
      data: {
        customerId,
        fromStatus: "new",
        toStatus: "serving",
        changedBy: "ai",
        remark: "AI 首次接待，自动转为接待中",
      },
    });
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: updateData,
  });

  return {
    customerMessage: { id: customerMsg.id, content: customerMsg.messageContent },
    aiMessage: { id: aiMsg.id, content: aiMsg.messageContent },
    analysis,
    customer: {
      id: updatedCustomer.id,
      status: updatedCustomer.status,
      aiSummary: updatedCustomer.aiSummary,
    },
    statusChanged,
    suggestConfirm,
  };
}
