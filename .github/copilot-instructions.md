**Project Overview**
- **Stack**: React + Vite frontend, Tauri (Rust) backend. Frontend lives in `src/`, backend in `src-tauri/`.
- **Purpose**: 本项目是一个轻量级的桌面 Chat/Prompt 管理客户端（多轮对话、Prompt 库、模型配置），前端通过 Tauri `invoke` 调用后端模型代理。

**Key Files**
- **Frontend AI call**: `src/services/aiClient.ts` — 使用 `invoke('chat_with_model', { request })`，并在非 Tauri 环境抛错。
- **Tauri backend**: `src-tauri/src/main.rs` — 导出 `tauri::command` 函数 `chat_with_model`，处理 Provider (Openai/Azure/Custom)、headers 和响应解析。
- **State & prompts**: `src/store/chatStore.ts` — 使用 `zustand` 管理对话、prompt 和模型配置，调用 `utils/promptStorage.ts` 做本地持久化（注意：API Key 默认不持久化）。
- **项目说明**: `README.md` — 包含开发/打包命令与功能概览，是首要参考文档。

**How To Run / Debug**
- **Start frontend dev**: `npm run dev` (Vite).
- **Start Tauri dev (dev UI + Rust backend)**: `npm run tauri:dev`。
- **Build**: `npm run build` then `npm run tauri:build` to produce native packages.

Example commands (copyable):
```
npm install
npm run dev
npm run tauri:dev
```

**Important Conventions & Patterns (project-specific)**
- **Tauri-only AI calls**: `src/services/aiClient.ts` will throw when not running under Tauri — many dev flows depend on `invoke` and will fail in a plain browser environment. Use `npm run tauri:dev` to test AI flows.
- **JSON field name mapping**: Rust `ChatRequest` uses `serde` renames: e.g. frontend uses `apiKey` / `baseUrl` / `maxTokens` while Rust maps them to `api_key` / `base_url` / `max_tokens`. When changing request payloads, update both sides.
- **Provider behavior**: In Rust `build_endpoint`:
  - `Provider::Openai` ⇒ append `/chat/completions` to `baseUrl`.
  - `Provider::Azure` / `Custom` ⇒ use `baseUrl` as-is.
  Ensure frontend `baseUrl` values match these expectations.
- **Auth handling**: For `Azure` the backend sends `api-key` header; for others it sends `Authorization: Bearer <apiKey>`.
- **Prompt persistence**: Prompt templates are loaded/persisted via `utils/promptStorage.ts`. `chatStore` calls `persistPrompts` / `persistConfig` on updates.

**Common Tasks for AI Agents**
- **If adding/modifying AI request fields**: update `src/services/aiClient.ts` (TS type `ChatCommandPayload`), `src/types/chat.ts` (shared types), and `src-tauri/src/main.rs` (`ChatRequest` + `serde` renames). Run `npm run tauri:dev` to validate end-to-end.
- **If changing provider-specific logic**: check header construction and `build_endpoint` in `src-tauri/src/main.rs` first.
- **If debugging empty responses**: inspect Tauri terminal (Rust logs) and Vite console. Backend returns detailed error strings on failure — capture those from the running `tauri dev` session.

**Files To Edit For Common Changes**
- Change model defaults: `src/store/chatStore.ts` (`defaultConfig.model`, `temperature`, `maxTokens`).
- Add new prompt presets: `src/store/chatStore.ts` (`defaultPrompts`) or via UI that calls `upsertPrompt`.
- Persist API Key (if you choose): update `utils/promptStorage.ts` and `chatStore` — note current deliberate choice not to persist keys by default.

**Examples (payload shape & call)**
- Frontend calls:
```
invoke('chat_with_model', { request: {
  provider: 'openai',
  apiKey: 'sk-xxx',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  temperature: 0.35,
  maxTokens: 1024,
  messages: [{ role: 'user', content: '...'}]
}})
```
- Rust expects JSON fields `api_key`, `base_url`, `max_tokens` (see `serde(rename = "...")` in `src-tauri/src/main.rs`).

**Notes / Do not assume**
- **Do not assume browser-only behavior**: many flows require the native backend; tests in plain browser will hit the Tauri guard in `aiClient.ts`.
- **Do not modify generated `src-tauri/target` files**; they are build artifacts.

请审阅这份说明并指出需要补充或不够明确的地方（例如：缺少某些类型定义、希望包含更详细的 API 字段示例或 CI/发布流程说明）。
