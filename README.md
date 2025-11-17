
参考：
https://github.com/ChatGPTNextWeb/NextChat/tree/main  



## WriteStudio (Tauri + React)

一个轻量级的 Tauri 桌面客户端，灵感来自 CherryStudio / LLM Studio，聚焦两个核心能力：

1. 高效的多轮聊天工作台
2. Prompt 模版的保存、选择与复用

### ✨ Feature Highlights

- React + Vite 前端，Zustand 管理对话、Prompt 与模型配置
- Prompt 库面板：保存/删除/设为系统 Prompt，一键插入编辑器
- 支持设置 API Provider（OpenAI / Azure / 自定义兼容），可配置 base URL、model、temperature、max tokens
- Tauri Rust 后端通过 `reqwest` 调用 OpenAI 兼容的 `/chat/completions` 接口，封装统一响应
- 本地存储 Prompt 与模型配置（API Key 默认不写入磁盘）
- Cmd/Ctrl + Enter 快速发送，聊天记录带用量统计

### 🏗️ Project Structure

```
├── index.html
├── package.json
├── src
│   ├── App.tsx / App.css / index.css
│   ├── components (PromptLibrary / ChatComposer / SettingsPanel …)
│   ├── services/aiClient.ts
│   ├── store/chatStore.ts
│   ├── types/chat.ts
│   └── utils/promptStorage.ts
└── src-tauri
    ├── Cargo.toml
    ├── src/main.rs
    └── tauri.conf.json
```

### 🚀 Getting Started

```bash
# 1. 安装依赖
npm install

# 2. 调试模式（Tauri + Vite 联动）
npm run tauri dev

# 3. 构建前端静态资源
npm run build

# 4. 打包桌面应用
npm run tauri build
```

首启后请在左侧「模型设置」中填写：

- Provider（OpenAI / Azure / 自定义）
- API Key（默认不会持久化，可自行修改逻辑）
- Base URL（OpenAI 默认为 `https://api.openai.com/v1`，程序会自动补全 `/chat/completions`）
- Model、Temperature、Max Tokens

### 🧩 下一步可扩展

- 支持多会话列表与搜索
- Prompt 标签与快速过滤
- SSE/流式输出、思维链可视化
- 本地模型（LLM/gguf）桥接
- Workspace 同步、团队 prompt 分享

欢迎在此基础上继续扩展 CherryStudio 风格的体验。