#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use reqwest::StatusCode;
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
#[serde(rename_all = "camelCase")]
struct ChatRequest {
    provider: Provider,
    model: String,
    #[serde(rename = "temperature")]
    temperature: f32,
    messages: Vec<ChatMessage>,
    #[serde(rename = "apiKey")]  // 关键：指定 JSON 中的字段名为 apiKey
    api_key: String,
    #[serde(rename = "baseUrl")]  // 同理处理 baseUrl
    base_url: String,
    #[serde(rename = "maxTokens")]  // 处理 maxTokens
    max_tokens: u32,
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

    // Debug: print request summary (mask api key)
    let masked_key = if request.api_key.len() > 4 {
        format!("{}****", &request.api_key[..4])
    } else {
        "****".to_string()
    };
    println!(
        "[chat_with_model] endpoint={} provider={:?} model={} api_key={} messages={}",
        endpoint,
        request.provider,
        request.model,
        masked_key,
        request.messages.len()
    );

    // Debug: print payload JSON
    let payload_json = serde_json::to_string(&serde_json::json!({
        "model": request.model,
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "messages": request.messages,
    }))
    .unwrap_or_else(|_| "<payload serialize error>".to_string());
    println!("[chat_with_model] payload: {}", payload_json);

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
        .post(endpoint.clone())
        .headers(headers.clone())
        .json(&payload)
        .send()
        .await
        .map_err(|err| format!("网络请求失败: {err}"))?;

    if !response.status().is_success() {
        // 如果是 Custom provider 并且返回 404，则尝试追加 `/chat/completions` 重试一次（兼容部分 OpenAI-like endpoints）
        if response.status() == StatusCode::NOT_FOUND {
            println!(
                "[chat_with_model] primary endpoint returned 404, attempting alternate endpoint with /chat/completions"
            );
            let trimmed = request.base_url.trim().trim_end_matches('/');
            let alt_endpoint = format!("{}/chat/completions", trimmed);
            println!("[chat_with_model] retry endpoint={}", alt_endpoint);

            let retry_resp = client
                .0
                .post(alt_endpoint.clone())
                .headers(headers.clone())
                .json(&payload)
                .send()
                .await
                .map_err(|err| format!("网络请求失败: {err}"))?;

            if retry_resp.status().is_success() {
                let parsed: OpenAiResponse = retry_resp
                    .json()
                    .await
                    .map_err(|err| format!("解析响应失败: {err}"))?;

                let choice = parsed
                    .choices
                    .into_iter()
                    .next()
                    .ok_or_else(|| "模型没有返回任何内容".to_string())?;

                return Ok(AiResponse {
                    content: choice.message.content,
                    finish_reason: choice.finish_reason,
                    model: parsed.model,
                    usage: parsed.usage,
                });
            } else {
                let status2 = retry_resp.status();
                let headers_debug2 = format!("{:?}", retry_resp.headers());
                let err_text2 = retry_resp.text().await.unwrap_or_default();
                println!(
                    "[chat_with_model] retry model error -> status={} headers={} body={}",
                    status2, headers_debug2, err_text2
                );
                return Err(format!("模型返回错误: {}", err_text2));
            }
        }

        // 捕获并打印响应头与响应体以便排查（注意：可能包含服务端错误信息）
        let status = response.status();
        let headers_debug = format!("{:?}", response.headers());
        let err_text = response.text().await.unwrap_or_default();
        println!(
            "[chat_with_model] model error -> status={} headers={} body={}",
            status, headers_debug, err_text
        );
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

