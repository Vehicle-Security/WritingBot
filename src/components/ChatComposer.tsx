import type { KeyboardEvent } from "react";
import type { ChatMessage } from "../types/chat";

interface ChatComposerProps {
  value: string;
  disabled?: boolean;
  status: "idle" | "thinking" | "error";
  error?: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onReset: () => void;
  onApplySystemPrompt?: () => void;
  lastAssistantMessage?: ChatMessage;
}

export function ChatComposer({
  value,
  disabled,
  status,
  error,
  onChange,
  onSend,
  onReset,
  onApplySystemPrompt,
  lastAssistantMessage
}: ChatComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="composer">
      <div className="panel-header">
        <span className="panel-title">对话</span>
        <span className={`status-chip ${status}`}>
          {status === "thinking"
            ? "思考中..."
            : status === "error"
            ? "出错"
            : "待命"}
        </span>
      </div>

      {error && (
        <div className="panel" style={{ borderColor: "#f87171", color: "#fecaca" }}>
          {error}
        </div>
      )}

      <textarea
        placeholder="Cmd/Ctrl + Enter 快速发送"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      <div className="composer-actions">
        <button
          className="button secondary"
          type="button"
          onClick={onApplySystemPrompt}
          disabled={!onApplySystemPrompt}
        >
          引入系统 Prompt
        </button>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="button secondary"
            type="button"
            onClick={onReset}
            disabled={disabled}
          >
            清空
          </button>

          <button
            className="button primary"
            type="button"
            onClick={onSend}
            disabled={disabled || value.trim().length === 0}
          >
            发送
          </button>
        </div>
      </div>

      {lastAssistantMessage?.content && (
        <div className="panel" style={{ marginTop: "0.5rem" }}>
          <div className="panel-title">上次回复摘要</div>
          <div style={{ fontSize: "0.85rem", color: "#cbd5f5" }}>
            {lastAssistantMessage.content.slice(0, 220)}
            {lastAssistantMessage.content.length > 220 ? "…" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

