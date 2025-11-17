import type { ModelConfig } from "../types/chat";

interface SettingsPanelProps {
  config: ModelConfig;
  onChange: (partial: Partial<ModelConfig>) => void;
}

export function SettingsPanel({ config, onChange }: SettingsPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">模型设置</span>
      </div>

      <div className="settings-grid">
        <label className="field">
          Provider
          <select
            value={config.provider}
            onChange={(event) =>
              onChange({ provider: event.target.value as ModelConfig["provider"] })
            }
          >
            <option value="openai">OpenAI API 兼容</option>
            <option value="azure">Azure OpenAI</option>
            <option value="custom">自定义兼容</option>
          </select>
        </label>

        <label className="field">
          API Key
          <input
            type="password"
            placeholder="sk-..."
            value={config.apiKey}
            onChange={(event) => onChange({ apiKey: event.target.value })}
          />
        </label>

        <label className="field">
          Base URL
          <input
            type="url"
            placeholder="https://api.openai.com/v1"
            value={config.baseUrl}
            onChange={(event) => onChange({ baseUrl: event.target.value })}
          />
        </label>

        <label className="field">
          Model
          <input
            placeholder="gpt-4o-mini"
            value={config.model}
            onChange={(event) => onChange({ model: event.target.value })}
          />
        </label>

        <label className="field">
          Temperature ({config.temperature.toFixed(2)})
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.temperature}
            onChange={(event) =>
              onChange({ temperature: Number(event.target.value) })
            }
          />
        </label>

        <label className="field">
          Max Tokens
          <input
            type="number"
            min={1}
            max={4096}
            value={config.maxTokens}
            onChange={(event) => onChange({ maxTokens: Number(event.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}

