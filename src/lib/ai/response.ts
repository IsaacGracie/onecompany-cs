import {
  AI_INTENTS,
  INTENT_LEVELS,
  MISSING_INFO_KEYS,
  SUGGESTED_ACTIONS,
  type AiAnalysisResult,
  type AiIntent,
  type IntentLevel,
  type MissingInfoKey,
  type SuggestedAction,
} from "@/lib/types";

interface AiChatResponse {
  reply: string;
  analysis: AiAnalysisResult;
}

const VALID_INTENTS = new Set<string>(AI_INTENTS);
const VALID_INTENT_LEVELS = new Set<string>(INTENT_LEVELS.map((item) => item.value));
const VALID_SUGGESTED_ACTIONS = new Set<string>(SUGGESTED_ACTIONS);
const VALID_MISSING_INFO = new Set<string>(MISSING_INFO_KEYS);

export function createDefaultAIAnalysis(): AiAnalysisResult {
  return {
    intent: "other",
    intent_level: "unknown",
    is_effective_lead: false,
    need_human: false,
    project_type: null,
    budget_range: null,
    timeline: null,
    requirements: [],
    suggested_action: "continue_collect",
    summary: null,
    missing_info: [],
    risk_flags: [],
  };
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeAnalysis(value: unknown): AiAnalysisResult {
  const defaults = createDefaultAIAnalysis();
  if (!value || typeof value !== "object") return defaults;

  const analysis = value as Record<string, unknown>;
  const intent = typeof analysis.intent === "string" && VALID_INTENTS.has(analysis.intent)
    ? (analysis.intent as AiIntent)
    : defaults.intent;
  const intentLevel =
    typeof analysis.intent_level === "string" &&
    VALID_INTENT_LEVELS.has(analysis.intent_level)
      ? (analysis.intent_level as IntentLevel)
      : defaults.intent_level;
  const suggestedAction =
    typeof analysis.suggested_action === "string" &&
    VALID_SUGGESTED_ACTIONS.has(analysis.suggested_action)
      ? (analysis.suggested_action as SuggestedAction)
      : defaults.suggested_action;
  const missingInfo = asStringArray(analysis.missing_info).filter(
    (item): item is MissingInfoKey => VALID_MISSING_INFO.has(item)
  );

  return {
    intent,
    intent_level: intentLevel,
    is_effective_lead: analysis.is_effective_lead === true,
    need_human: analysis.need_human === true,
    project_type: asNullableString(analysis.project_type),
    budget_range: asNullableString(analysis.budget_range),
    timeline: asNullableString(analysis.timeline),
    requirements: asStringArray(analysis.requirements),
    suggested_action: suggestedAction,
    summary: asNullableString(analysis.summary),
    missing_info: missingInfo,
    risk_flags: asStringArray(analysis.risk_flags),
  };
}

function stripJsonFence(content: string): string {
  const match = content.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1] : content.trim();
}

function parseStructuredJson(content: string): AiChatResponse | null {
  const parsed = JSON.parse(stripJsonFence(content)) as unknown;
  if (!parsed || typeof parsed !== "object") return null;

  const value = parsed as Record<string, unknown>;
  if (typeof value.reply !== "string" || !value.reply.trim()) return null;

  return {
    reply: value.reply.trim(),
    analysis: normalizeAnalysis(value.analysis),
  };
}

function parseLegacyResponse(content: string): AiChatResponse | null {
  const separator = "---ANALYSIS---";
  const separatorIndex = content.indexOf(separator);
  if (separatorIndex < 0) return null;

  const reply = content.slice(0, separatorIndex).trim();
  const analysisContent = content.slice(separatorIndex + separator.length).trim();
  if (!reply) return null;

  return {
    reply,
    analysis: normalizeAnalysis(JSON.parse(stripJsonFence(analysisContent))),
  };
}

export function parseAIResponse(rawContent: string): AiChatResponse {
  const content = rawContent.trim();
  if (!content) {
    console.warn("[AI] Empty model response; using fallback response.");
    return {
      reply: "抱歉，AI 暂时无法生成回复，请转人工处理。",
      analysis: createDefaultAIAnalysis(),
    };
  }

  try {
    const legacy = parseLegacyResponse(content);
    if (legacy) return legacy;

    const structured = parseStructuredJson(content);
    if (structured) return structured;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(
      `[AI] Failed to parse structured response; using raw text fallback. ${detail}`
    );
    return {
      reply: content,
      analysis: createDefaultAIAnalysis(),
    };
  }

  console.warn("[AI] Model response was not valid structured JSON; using raw text fallback.");
  return {
    reply: content,
    analysis: createDefaultAIAnalysis(),
  };
}
