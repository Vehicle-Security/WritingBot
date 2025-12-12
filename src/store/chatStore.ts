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
  selectedPrompts: string[]; // 存储被选中的消息id
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, partial: Partial<ChatMessage>) => void;
  resetConversation: () => void;
  upsertPrompt: (prompt: PromptTemplate) => void;
  removePrompt: (id: string) => void;
  selectPrompt: (id?: string) => void;
  setStatus: (status: ChatStatus, error?: string) => void;
  setConfig: (partial: Partial<ModelConfig>) => void;
  togglePromptSelection: (id: string) => void;
  clearPromptSelection: () => void;
  saveSelectedPromptsAsLibrary: () => void;
  startConversationWithPrompts: (promptIds: string[]) => void;
  pendingPromptQueue: string[];
  autoConversationActive: boolean;
  startAutoConversation: (promptIds: string[]) => void;
  popNextAutoPrompt: () => string | undefined;
  stopAutoConversation: () => void;
}


export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  prompts: initialPrompts,
  selectedPromptId: initialPrompts[0]?.id,
  status: "idle",
  error: undefined,
  config: initialConfig,
  selectedPrompts: [],
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
  resetConversation: () => set({ messages: [], status: "idle", error: undefined, selectedPrompts: [] }),
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
    }),
  togglePromptSelection: (id) =>
    set((state) => {
      const selected = state.selectedPrompts.includes(id)
        ? state.selectedPrompts.filter((pid) => pid !== id)
        : [...state.selectedPrompts, id];
      return { selectedPrompts: selected };
    }),
  clearPromptSelection: () => set({ selectedPrompts: [] }),
  saveSelectedPromptsAsLibrary: () => {
    const { messages, selectedPrompts, prompts } = get();
    const selectedMessages = messages.filter(
      (msg) => selectedPrompts.includes(msg.id) && msg.role === "user"
    );
    if (selectedMessages.length === 0) return;
    // 生成 PromptTemplate
    const now = Date.now();
    const newPrompts: PromptTemplate[] = selectedMessages.map((msg) => ({
      id: `from-msg-${msg.id}`,
      name: msg.content.slice(0, 16) || "用户消息",
      description: "来自历史对话的用户消息",
      content: msg.content,
      createdAt: now,
      updatedAt: now
    }));
    const mergedPrompts = [...prompts, ...newPrompts];
    persistPrompts(mergedPrompts);
    set({ prompts: mergedPrompts, selectedPrompts: [] });
  },
  pendingPromptQueue: [],
  autoConversationActive: false,
  startAutoConversation: (promptIds) => {
    set({
      messages: [],
      status: "idle",
      error: undefined,
      selectedPrompts: [],
      pendingPromptQueue: promptIds,
      autoConversationActive: true
    });
  },
  popNextAutoPrompt: () => {
    const { pendingPromptQueue } = get();
    if (!pendingPromptQueue.length) return undefined;
    const [next, ...rest] = pendingPromptQueue;
    set({ pendingPromptQueue: rest });
    return next;
  },
  stopAutoConversation: () => {
    set({ autoConversationActive: false, pendingPromptQueue: [] });
  },
  startConversationWithPrompts: (promptIds) => {
    const { prompts } = get();
    const now = Date.now();
    // 找到对应的prompt内容，依次生成user消息
    const promptMessages = promptIds
      .map((pid) => prompts.find((p) => p.id === pid))
      .filter(Boolean)
      .map((prompt) => ({
        id: crypto.randomUUID(),
        role: "user" as const,
        content: prompt!.content,
        createdAt: now
      }));
    set({ messages: promptMessages, status: "idle", error: undefined, selectedPrompts: [] });
  },
}));

