import { create } from "zustand";
import type { ChatMessage, ModelConfig, PromptTemplate } from "../types/chat";
import {
  loadStoredConfig,
  loadStoredPrompts,
  persistConfig,
  persistPrompts
} from "../utils/promptStorage";

type ChatStatus = "idle" | "thinking" | "error";

const defaultPrompts: PromptTemplate[] = [
  {
    id: "writing-coach",
    name: "写作教练",
    description: "担任写作导师，输出结构化建议与示例。",
    content:
      "你是一名严谨的中文写作教练。分析我提供的主题、语气与受众，输出结构化的写作建议，并给出示范段落。",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "product-notes",
    name: "产品更新日志",
    description: "生成精炼的更新日志与高亮列表。",
    content:
      "根据输入的改动，生成面向用户的更新日志。包含摘要、高亮列表、升级提示，语言简洁明快。",
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const defaultConfig: ModelConfig = {
  provider: "openai",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  temperature: 0.35,
  maxTokens: 1024
};

const initialPrompts = loadStoredPrompts(defaultPrompts);
const initialConfig = loadStoredConfig(defaultConfig);

export interface ChatState {
  messages: ChatMessage[];
  prompts: PromptTemplate[];
  selectedPromptId?: string;
  status: ChatStatus;
  error?: string;
  config: ModelConfig;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, partial: Partial<ChatMessage>) => void;
  resetConversation: () => void;
  upsertPrompt: (prompt: PromptTemplate) => void;
  removePrompt: (id: string) => void;
  selectPrompt: (id?: string) => void;
  setStatus: (status: ChatStatus, error?: string) => void;
  setConfig: (partial: Partial<ModelConfig>) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  prompts: initialPrompts,
  selectedPromptId: initialPrompts[0]?.id,
  status: "idle",
  error: undefined,
  config: initialConfig,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message]
    })),
  updateMessage: (id, partial) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...partial } : msg
      )
    })),
  resetConversation: () => set({ messages: [], status: "idle", error: undefined }),
  upsertPrompt: (prompt) =>
    set((state) => {
      const exists = state.prompts.some((p) => p.id === prompt.id);
      const prompts = exists
        ? state.prompts.map((p) => (p.id === prompt.id ? prompt : p))
        : [...state.prompts, prompt];
      persistPrompts(prompts);
      const selectedPromptId = state.selectedPromptId ?? prompt.id;
      return { prompts, selectedPromptId };
    }),
  removePrompt: (id) =>
    set((state) => {
      const prompts = state.prompts.filter((p) => p.id !== id);
      persistPrompts(prompts);
      const selectedPromptId =
        state.selectedPromptId === id ? prompts[0]?.id : state.selectedPromptId;
      return { prompts, selectedPromptId };
    }),
  selectPrompt: (id) => set({ selectedPromptId: id }),
  setStatus: (status, error) => set({ status, error }),
  setConfig: (partial) =>
    set((state) => {
      const nextConfig = { ...state.config, ...partial };
      persistConfig(nextConfig);
      return { config: nextConfig };
    })
}));

