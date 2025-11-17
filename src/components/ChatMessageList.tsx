import type { ChatMessage } from "../types/chat";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <p>
          👋 欢迎来到 <strong>CherryStudio Local</strong>
        </p>
        <p>选择一个 Prompt 或直接开始输入，和模型对话。</p>
      </div>
    );
  }

  return (
    <div className="chat-scroll">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.role === "user" ? "user" : "assistant"}`}
        >
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
      ))}
    </div>
  );
}

