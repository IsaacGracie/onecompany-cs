import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  LLMProvider,
} from "./provider";

interface OpenAICompatibleProviderConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

interface ChatCompletionsResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class OpenAICompatibleProvider implements LLMProvider {
  constructor(private readonly config: OpenAICompatibleProviderConfig) {}

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
        stream: false,
      }),
    });

    let data: ChatCompletionsResponse;
    try {
      data = (await response.json()) as ChatCompletionsResponse;
    } catch {
      throw new Error(
        `LLM request failed: ${response.status} ${response.statusText} (invalid JSON response)`
      );
    }

    if (!response.ok) {
      const detail = data.error?.message || response.statusText;
      throw new Error(`LLM request failed: ${response.status} ${detail}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new Error("LLM response did not contain message content");
    }

    return { content };
  }
}
