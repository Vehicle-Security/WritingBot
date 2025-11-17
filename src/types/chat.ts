export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  promptId?: string;
  usage?: AiUsage;
}

export interface AiUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface ModelConfig {
  provider: "openai" | "azure" | "custom";
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatCommandPayload {
  provider: ModelConfig["provider"];
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  messages: Array<{
    role: ChatRole;
    content: string;
  }>;
}

export interface AiResponse {
  content: string;
  finishReason?: string;
  model?: string;
  usage?: AiUsage;
}

