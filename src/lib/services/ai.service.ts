import { prisma } from "@/lib/db";
import { getLLMProvider, getLLMProviderMode } from "@/lib/ai/factory";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { parseAIResponse } from "@/lib/ai/response";
import { retrieveKnowledgeContext } from "@/lib/services/knowledge.service";
import type { ChatMessage } from "@/lib/ai/provider";
import type { LLMProviderMode } from "@/lib/ai/factory";
import type { AiAnalysisResult } from "@/lib/types";

export async function getConversationHistory(
  customerId: number,
  limit = 20
): Promise<ChatMessage[]> {
  const conversations = await prisma.conversation.findMany({
    where: { customerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return conversations
    .reverse()
    .map((conversation) => ({
      role: conversation.senderType === "customer" ? "user" : "assistant",
      content: conversation.messageContent,
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
  customerMessageContent: string,
  providerMode?: LLMProviderMode
): Promise<AiChatResult> {
  // 1. 获取客户信息
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Customer not found");

  // 在写入客户消息前验证所选 Provider 配置。
  const effectiveProviderMode = providerMode ?? getLLMProviderMode();
  const provider = getLLMProvider(effectiveProviderMode);

  // 2. 保存客户消息
  const customerMsg = await prisma.conversation.create({
    data: {
      customerId,
      senderType: "customer",
      messageContent: customerMessageContent.trim(),
    },
  });

  // 3. 真实 Provider 使用知识库和历史；Mock 仅接收当前消息。
  const ownerName = process.env.APP_OWNER_NAME || "我的工作室";
  const usesModelContext = effectiveProviderMode === "openai-compatible";
  const knowledgeContext = usesModelContext
    ? await retrieveKnowledgeContext(customerMessageContent, 3)
    : "";
  const systemPrompt = buildSystemPrompt(ownerName, knowledgeContext);
  const history = usesModelContext
    ? await getConversationHistory(customerId)
    : [{ role: "user" as const, content: customerMessageContent.trim() }];
  const customerContext = [
    `客户昵称：${customer.nickname}`,
    `当前状态：${customer.status}`,
    `当前意向等级：${customer.intentLevel}`,
    customer.notes ? `人工备注：${customer.notes}` : null,
    customer.aiSummary ? `已有 AI 摘要：${customer.aiSummary}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `## 当前客户信息\n${customerContext}` },
    ...history,
  ];

  // 4. 根据环境变量选择 Mock 或 OpenAI-compatible Provider
  const aiResponse = await provider.chat(messages);

  // 5. 解析 AI 响应
  const { reply, analysis } = parseAIResponse(aiResponse.content);

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

  if (analysis.intent_level !== "unknown") {
    updateData.intentLevel = analysis.intent_level;
  }

  if (analysis.summary) {
    updateData.aiSummary = analysis.summary;
  }

  suggestConfirm =
    analysis.suggested_action === "collect_summary" ||
    analysis.suggested_action === "human_follow_up" ||
    analysis.need_human;

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
