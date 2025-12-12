import { useMemo, useState } from "react";
import { useChatStore } from "../store/chatStore";
import type { PromptTemplate } from "../types/chat";

interface PromptLibraryProps {
  prompts: PromptTemplate[];
  selectedPromptId?: string;
  onSelect: (promptId: string) => void;
  onApply: (prompt: PromptTemplate) => void;
  onDelete: (promptId: string) => void;
  onSave: (prompt: PromptTemplate) => void;
}

export function PromptLibrary({
  prompts,
  selectedPromptId,
  onSelect,
  onApply,
  onDelete,
  onSave
}: PromptLibraryProps) {
  const { startAutoConversation } = useChatStore();
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");

  const canCreate = useMemo(
    () => name.trim().length > 0 && content.trim().length > 0,
    [name, content]
  );

  const handleCreatePrompt = () => {
    if (!canCreate) return;
    const now = Date.now();
    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() || undefined,
      content: content.trim(),
      createdAt: now,
      updatedAt: now
    });
    setName("");
    setContent("");
    setDescription("");
  };

  return (
    <section className="panel">
      <div className="panel-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="panel-title">Prompt 库</span>
        <span className="status-chip idle">{prompts.length}</span>
        <button className="btn btn-sm" onClick={() => {
          setMultiSelect((v) => !v);
          setSelectedPromptIds([]);
        }}>
          {multiSelect ? "退出多选" : "批量导入对话"}
        </button>
      </div>

      <div className="prompts-list">
        {prompts.map((prompt) => (
          <article
            key={prompt.id}
            className={`prompt-card ${prompt.id === selectedPromptId ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {multiSelect && (
              <input
                type="checkbox"
                checked={selectedPromptIds.includes(prompt.id)}
                onChange={() => {
                  setSelectedPromptIds((ids) =>
                    ids.includes(prompt.id)
                      ? ids.filter((id) => id !== prompt.id)
                      : [...ids, prompt.id]
                  );
                }}
                style={{ marginRight: 8 }}
                title="选择此Prompt"
              />
            )}
            <div style={{ flex: 1 }}>
              <div className="prompt-name">{prompt.name}</div>
              <div className="prompt-preview">
                {prompt.description || prompt.content}
              </div>
            </div>
            {!multiSelect && (
              <div className="prompt-actions">
                <button onClick={() => onApply(prompt)}>插入</button>
                <button onClick={() => onSelect(prompt.id)}>设为系统</button>
                <button onClick={() => onDelete(prompt.id)}>删除</button>
              </div>
            )}
          </article>
        ))}
      </div>

      {multiSelect && (
        <div style={{ margin: "8px 0", display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary"
            disabled={selectedPromptIds.length === 0}
            onClick={() => {
              startAutoConversation(selectedPromptIds);
              setMultiSelect(false);
              setSelectedPromptIds([]);
            }}
          >
            新建对话（批量导入）
          </button>
          <button className="btn" onClick={() => setSelectedPromptIds([])}>
            清空选择
          </button>
        </div>
      )}

      <div className="panel-header" style={{ marginTop: "1rem" }}>
        <span className="panel-title">新增 Prompt</span>
      </div>
      <div className="prompt-form">
        <label className="field">
          名称
          <input
            placeholder="例如：品牌 Story Prompt"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          描述
          <input
            placeholder="一句话描述用途（可选）"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="field">
          Prompt 正文
          <textarea
            rows={4}
            placeholder="贴上你想重复使用的指令……"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
        <button disabled={!canCreate} onClick={handleCreatePrompt}>
          保存 Prompt
        </button>
      </div>
    </section>
  );
}

