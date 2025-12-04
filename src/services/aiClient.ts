import { invoke } from "@tauri-apps/api/tauri";
import type { AiResponse, ChatCommandPayload } from "../types/chat";

const isTauri = () =>
  typeof window !== "undefined" && Boolean((window as any).__TAURI_IPC__);

export async function requestChatCompletion(
  payload: ChatCommandPayload
): Promise<AiResponse> {
  if (!payload.apiKey) {
    throw new Error("请先在设置中填写 API Key。");
  }

  if (!isTauri()) {
    throw new Error("AI 调用需要在 Tauri 桌面环境中运行。");
  }

  return invoke<AiResponse>("chat_with_model", { request: payload });
}

