import { useChatStore } from "../store/chatStore";
import type { ChatMessage } from "../types/chat";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const {
    selectedPrompts,
    togglePromptSelection,
    clearPromptSelection,
    saveSelectedPromptsAsLibrary
  } = useChatStore();

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <p>
          👋 欢迎来到 <strong>WriteStudio</strong>
        </p>
        <p>选择一个 Prompt 或直接开始输入，和模型对话。</p>
      </div>
    );
  }

  const hasSelected = selectedPrompts.length > 0;

  return (
    <div className="chat-scroll">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.role === "user" ? "user" : "assistant"}`}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {message.role === "user" && (
            <input
              type="checkbox"
              checked={selectedPrompts.includes(message.id)}
              onChange={() => togglePromptSelection(message.id)}
              style={{ marginRight: 8 }}
              title="选择此消息作为Prompt"
            />
          )}
          <div style={{ flex: 1 }}>
            {message.content}
            {message.usage && (
              <div className="usage-meta">
                {message.usage.totalTokens && (
                  <span>tokens: {message.usage.totalTokens}</span>
                )}
                {message.usage.promptTokens && (
                  <span>prompt: {message.usage.promptTokens}</span>
                )}
                {message.usage.completionTokens && (
                  <span>completion: {message.usage.completionTokens}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {hasSelected && (
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={saveSelectedPromptsAsLibrary}
          >
            批量保存为Prompt
          </button>
          <button className="btn" onClick={clearPromptSelection}>
            取消选择
          </button>
        </div>
      )}
    </div>
  );
}

