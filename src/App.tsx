import { useCallback, useMemo, useState } from "react";
import "./App.css";
import { useChatStore } from "./store/chatStore";
import { PromptLibrary } from "./components/PromptLibrary";
import { SettingsPanel } from "./components/SettingsPanel";
import { ChatMessageList } from "./components/ChatMessageList";
import { ChatComposer } from "./components/ChatComposer";
import { HeaderBar } from "./components/HeaderBar";
import { requestChatCompletion } from "./services/aiClient";
import type { ChatMessage, PromptTemplate } from "./types/chat";

function App() {
  const {
    messages,
    prompts,
    selectedPromptId,
    status,
    error,
    config,
    addMessage,
    resetConversation,
    removePrompt,
    selectPrompt,
    upsertPrompt,
    setStatus,
    setConfig
  } = useChatStore();

  const [composerValue, setComposerValue] = useState("");

  const activeSystemPrompt = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedPromptId),
    [prompts, selectedPromptId]
  );

  const lastAssistantMessage: ChatMessage | undefined = useMemo(() => {
    const reversed = [...messages].reverse();
    return reversed.find((msg) => msg.role === "assistant");
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const content = composerValue.trim();
    if (!content) return;

    const payloadMessages = [
      ...(activeSystemPrompt
        ? [{ role: "system" as const, content: activeSystemPrompt.content }]
        : []),
      ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: "user" as const, content }
    ];

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: Date.now()
    };

    addMessage(userMessage);
    setComposerValue("");
    setStatus("thinking");

    try {
      const response = await requestChatCompletion({
        provider: config.provider,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        messages: payloadMessages
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.content,
        createdAt: Date.now(),
        usage: response.usage
      };

      addMessage(assistantMessage);
      setStatus("idle");
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : String(err));
      // remove pending user message to keep timeline clean?
    }
  }, [
    composerValue,
    activeSystemPrompt,
    messages,
    addMessage,
    config.apiKey,
    config.baseUrl,
    config.model,
    config.temperature,
    config.maxTokens,
    setStatus
  ]);

  const handleApplyPrompt = (prompt: PromptTemplate) => {
    setComposerValue((prev) =>
      prev.trim().length > 0
        ? `${prompt.content}\n\n${prev}`.trim()
        : prompt.content
    );
  };

  const handleApplySystemPrompt = () => {
    if (!activeSystemPrompt) return;
    setComposerValue((prev) =>
      prev.trim().length > 0
        ? `${activeSystemPrompt.content}\n\n${prev}`.trim()
        : activeSystemPrompt.content
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <HeaderBar subtitle="Prompt 工作流 + 对话记忆" />
        <PromptLibrary
          prompts={prompts}
          selectedPromptId={selectedPromptId}
          onApply={handleApplyPrompt}
          onSelect={selectPrompt}
          onDelete={removePrompt}
          onSave={upsertPrompt}
        />
        <SettingsPanel config={config} onChange={setConfig} />
      </aside>

      <main className="chat-pane">
        <ChatMessageList messages={messages} />
        <ChatComposer
          value={composerValue}
          onChange={setComposerValue}
          onSend={sendMessage}
          onReset={resetConversation}
          status={status}
          error={error}
          disabled={status === "thinking"}
          onApplySystemPrompt={activeSystemPrompt ? handleApplySystemPrompt : undefined}
          lastAssistantMessage={lastAssistantMessage}
        />
      </main>
    </div>
  );
}

export default App;

