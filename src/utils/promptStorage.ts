import type { ModelConfig, PromptTemplate } from "../types/chat";

const PROMPT_STORAGE_KEY = "chatwriting.promptLibrary";
const CONFIG_STORAGE_KEY = "chatwriting.modelConfig";

const isClient = () => typeof window !== "undefined";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadStoredPrompts(defaultPrompts: PromptTemplate[]): PromptTemplate[] {
  if (!isClient()) return defaultPrompts;
  const raw = window.localStorage.getItem(PROMPT_STORAGE_KEY);
  const parsed = safeParse<PromptTemplate[]>(raw, defaultPrompts);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return defaultPrompts;
  }
  return parsed;
}

export function persistPrompts(prompts: PromptTemplate[]) {
  if (!isClient()) return;
  window.localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(prompts));
}

export function loadStoredConfig(defaultConfig: ModelConfig): ModelConfig {
  if (!isClient()) return defaultConfig;
  const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
  const parsed = safeParse<Partial<ModelConfig>>(raw, {});
  return {
    ...defaultConfig,
    ...parsed,
    apiKey: ""
  };
}

export function persistConfig(config: ModelConfig) {
  if (!isClient()) return;
  const { apiKey, ...rest } = config;
  window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(rest));
}

