#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "lowercase")]
enum Provider {
    Openai,
    Azure,
    Custom,
}

impl Default for Provider {
    fn default() -> Self {
        Self::Openai
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatRequest {
    provider: Provider,
    api_key: String,
    base_url: String,
    model: String,
    temperature: f32,
    max_tokens: u32,
    messages: Vec<ChatMessage>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AiUsage {
    prompt_tokens: Option<u32>,
    completion_tokens: Option<u32>,
    total_tokens: Option<u32>,
}

#[derive(Debug, Serialize)]
struct AiResponse {
    content: String,
    finish_reason: Option<String>,
    model: Option<String>,
    usage: Option<AiUsage>,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoice {
    finish_reason: Option<String>,
    message: ChatMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAiResponse {
    id: Option<String>,
    model: Option<String>,
    usage: Option<AiUsage>,
    choices: Vec<OpenAiChoice>,
}

struct HttpClient(reqwest::Client);

#[tauri::command]
async fn chat_with_model(
    request: ChatRequest,
    client: State<'_, HttpClient>,
) -> Result<AiResponse, String> {
    if request.api_key.trim().is_empty() {
        return Err("缺少 API Key，请在设置中填写。".into());
    }

    if request.messages.is_empty() {
        return Err("至少需要一条对话消息。".into());
    }

    let endpoint = build_endpoint(&request);
    let mut headers = HeaderMap::new();

    match request.provider {
        Provider::Azure => {
            headers.insert(
                "api-key",
                HeaderValue::from_str(request.api_key.trim())
                    .map_err(|_| "非法的 API Key")?,
            );
        }
        _ => {
            let token = format!("Bearer {}", request.api_key.trim());
            headers.insert(
                AUTHORIZATION,
                HeaderValue::from_str(&token).map_err(|_| "非法的 API Key")?,
            );
        }
    }

    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let payload = serde_json::json!({
        "model": request.model,
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "messages": request.messages,
    });

    let response = client
        .0
        .post(endpoint)
        .headers(headers)
        .json(&payload)
        .send()
        .await
        .map_err(|err| format!("网络请求失败: {err}"))?;

    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("模型返回错误: {}", err_text));
    }

    let parsed: OpenAiResponse = response
        .json()
        .await
        .map_err(|err| format!("解析响应失败: {err}"))?;

    let choice = parsed
        .choices
        .into_iter()
        .next()
        .ok_or_else(|| "模型没有返回任何内容".to_string())?;

    Ok(AiResponse {
        content: choice.message.content,
        finish_reason: choice.finish_reason,
        model: parsed.model,
        usage: parsed.usage,
    })
}

fn build_endpoint(request: &ChatRequest) -> String {
    let trimmed = request.base_url.trim().trim_end_matches('/');
    match request.provider {
        Provider::Azure | Provider::Custom => trimmed.to_string(),
        Provider::Openai => format!("{trimmed}/chat/completions"),
    }
}

fn main() {
    let client = HttpClient(reqwest::Client::new());

    tauri::Builder::default()
        .manage(client)
        .invoke_handler(tauri::generate_handler![chat_with_model])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

