export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
}

export interface LLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
}
