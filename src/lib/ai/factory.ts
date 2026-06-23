import { MockAiProvider } from "./mock";
import { OpenAICompatibleProvider } from "./openai-compatible";
import type { LLMProvider } from "./provider";

export type LLMProviderMode = "mock" | "openai-compatible";

export function getLLMModelName(): string | null {
  return process.env.LLM_MODEL || null;
}

export function getLLMProviderMode(): LLMProviderMode {
  const provider = process.env.LLM_PROVIDER || "mock";
  if (provider === "mock") return "mock";

  if (provider !== "openai-compatible") {
    throw new Error(
      `Unsupported LLM_PROVIDER: ${provider}. Expected "mock" or "openai-compatible".`
    );
  }

  return process.env.LLM_API_URL && process.env.LLM_API_KEY && process.env.LLM_MODEL
    ? "openai-compatible"
    : "mock";
}

function parseOptionalNumber(name: string): number | undefined {
  const value = process.env[name];
  if (!value) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    console.warn(`[LLM] ${name} is not a valid number; using the provider default.`);
    return undefined;
  }

  return parsed;
}

export function getLLMProvider(mode?: LLMProviderMode): LLMProvider {
  const provider = mode || process.env.LLM_PROVIDER || "mock";

  if (provider === "mock") {
    return new MockAiProvider();
  }

  if (provider !== "openai-compatible") {
    throw new Error(
      `Unsupported LLM_PROVIDER: ${provider}. Expected "mock" or "openai-compatible".`
    );
  }

  const apiUrl = process.env.LLM_API_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  const missing = [
    !apiUrl && "LLM_API_URL",
    !apiKey && "LLM_API_KEY",
    !model && "LLM_MODEL",
  ].filter(Boolean);

  if (!apiUrl || !apiKey || !model) {
    if (mode === "openai-compatible") {
      throw new Error(
        `OpenAI-compatible provider is missing ${missing.join(", ")}.`
      );
    }

    console.warn(
      `[LLM] openai-compatible provider is missing ${missing.join(
        ", "
      )}; falling back to MockAiProvider.`
    );
    return new MockAiProvider();
  }

  return new OpenAICompatibleProvider({
    apiUrl,
    apiKey,
    model,
    temperature: parseOptionalNumber("LLM_TEMPERATURE"),
    maxTokens: parseOptionalNumber("LLM_MAX_TOKENS"),
  });
}
