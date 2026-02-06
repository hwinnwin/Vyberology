// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod agent;

use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use serde::{Deserialize, Serialize};

// Store for managing tab webviews
struct TabManager {
    tabs: HashMap<String, String>, // tab_id -> webview_label
}

impl TabManager {
    fn new() -> Self {
        Self {
            tabs: HashMap::new(),
        }
    }
}

// Store for browser agent instance
struct AgentManager {
    agent: Option<agent::BrowserAgent>,
}

impl AgentManager {
    fn new() -> Self {
        Self { agent: None }
    }
}

struct AppState {
    tab_manager: Mutex<TabManager>,
    agent_manager: Mutex<AgentManager>,
}

// ============================================
// Tab Management Commands
// ============================================

#[tauri::command]
async fn create_tab(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    let webview_label = format!("tab-{}", tab_id);

    // Skip internal URLs
    if url.starts_with("vyber://") {
        return Ok(());
    }

    // Parse URL
    let webview_url = if url.starts_with("http://") || url.starts_with("https://") {
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    } else {
        WebviewUrl::External(format!("https://{}", url).parse().map_err(|e| format!("Invalid URL: {}", e))?)
    };

    // Get main window
    let main_window = app.get_webview_window("main")
        .ok_or("Main window not found")?;

    // Create webview for this tab
    let _webview = WebviewWindowBuilder::new(
        &app,
        &webview_label,
        webview_url,
    )
    .title("Tab")
    .inner_size(800.0, 600.0)
    .parent(&main_window)
    .map_err(|e| format!("Failed to set parent: {}", e))?
    .build()
    .map_err(|e| format!("Failed to create webview: {}", e))?;

    // Store in tab manager
    let mut manager = state.tab_manager.lock().unwrap();
    manager.tabs.insert(tab_id, webview_label);

    Ok(())
}

#[tauri::command]
async fn navigate_tab(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    // Skip internal URLs
    if url.starts_with("vyber://") {
        return Ok(());
    }

    let manager = state.tab_manager.lock().unwrap();

    if let Some(label) = manager.tabs.get(&tab_id) {
        if let Some(webview) = app.get_webview_window(label) {
            let nav_url = if url.starts_with("http://") || url.starts_with("https://") {
                url
            } else {
                format!("https://{}", url)
            };

            webview.eval(&format!("window.location.href = '{}'", nav_url))
                .map_err(|e| format!("Failed to navigate: {}", e))?;
        }
    }

    Ok(())
}

#[tauri::command]
async fn close_tab(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    tab_id: String,
) -> Result<(), String> {
    let mut manager = state.tab_manager.lock().unwrap();

    if let Some(label) = manager.tabs.remove(&tab_id) {
        if let Some(webview) = app.get_webview_window(&label) {
            webview.close().map_err(|e| format!("Failed to close: {}", e))?;
        }
    }

    Ok(())
}

#[tauri::command]
async fn show_tab(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    tab_id: String,
) -> Result<(), String> {
    let manager = state.tab_manager.lock().unwrap();

    // Hide all tabs first
    for (_, label) in manager.tabs.iter() {
        if let Some(webview) = app.get_webview_window(label) {
            let _ = webview.hide();
        }
    }

    // Show the active tab
    if let Some(label) = manager.tabs.get(&tab_id) {
        if let Some(webview) = app.get_webview_window(label) {
            webview.show().map_err(|e| format!("Failed to show: {}", e))?;
        }
    }

    Ok(())
}

// ============================================
// Browser Agent Commands
// ============================================

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentToolResult {
    success: bool,
    data: Option<serde_json::Value>,
    error: Option<String>,
}

/// Start the browser agent (launches Chrome)
#[tauri::command]
async fn agent_start(
    state: tauri::State<'_, AppState>,
    headless: bool,
) -> Result<AgentToolResult, String> {
    let mut agent_manager = state.agent_manager.lock().unwrap();

    if agent_manager.agent.is_some() {
        return Ok(AgentToolResult {
            success: true,
            data: Some(serde_json::json!({ "message": "Agent already running" })),
            error: None,
        });
    }

    match agent::BrowserAgent::new(headless) {
        Ok(browser_agent) => {
            agent_manager.agent = Some(browser_agent);
            Ok(AgentToolResult {
                success: true,
                data: Some(serde_json::json!({ "message": "Agent started" })),
                error: None,
            })
        }
        Err(e) => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}

/// Stop the browser agent
#[tauri::command]
async fn agent_stop(
    state: tauri::State<'_, AppState>,
) -> Result<AgentToolResult, String> {
    let mut agent_manager = state.agent_manager.lock().unwrap();

    if let Some(agent) = agent_manager.agent.take() {
        let _ = agent.close();
    }

    Ok(AgentToolResult {
        success: true,
        data: Some(serde_json::json!({ "message": "Agent stopped" })),
        error: None,
    })
}

/// Navigate to a URL
#[tauri::command]
async fn agent_navigate(
    state: tauri::State<'_, AppState>,
    url: String,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.navigate(&url);
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started. Call agent_start first.".to_string()),
        }),
    }
}

/// Extract text from the current page
#[tauri::command]
async fn agent_extract_text(
    state: tauri::State<'_, AppState>,
    selector: Option<String>,
    max_length: Option<usize>,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.extract_text(
                selector.as_deref(),
                max_length.unwrap_or(8000),
            );
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started".to_string()),
        }),
    }
}

/// Extract links from the current page
#[tauri::command]
async fn agent_extract_links(
    state: tauri::State<'_, AppState>,
    selector: Option<String>,
    max_links: Option<usize>,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.extract_links(
                selector.as_deref(),
                max_links.unwrap_or(50),
            );
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started".to_string()),
        }),
    }
}

/// Click an element
#[tauri::command]
async fn agent_click(
    state: tauri::State<'_, AppState>,
    selector: Option<String>,
    text: Option<String>,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.click(selector.as_deref(), text.as_deref());
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started".to_string()),
        }),
    }
}

/// Fill a form field
#[tauri::command]
async fn agent_fill_form(
    state: tauri::State<'_, AppState>,
    selector: String,
    value: String,
    submit: bool,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.fill_form(&selector, &value, submit);
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started".to_string()),
        }),
    }
}

/// Take a screenshot
#[tauri::command]
async fn agent_screenshot(
    state: tauri::State<'_, AppState>,
    full_page: bool,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.screenshot(full_page);
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started".to_string()),
        }),
    }
}

/// Scroll the page
#[tauri::command]
async fn agent_scroll(
    state: tauri::State<'_, AppState>,
    direction: String,
    amount: Option<i32>,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.scroll(&direction, amount);
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started".to_string()),
        }),
    }
}

/// Wait for element or timeout
#[tauri::command]
async fn agent_wait(
    state: tauri::State<'_, AppState>,
    selector: Option<String>,
    timeout: Option<u64>,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.wait(selector.as_deref(), timeout.unwrap_or(5000));
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started".to_string()),
        }),
    }
}

/// Get page information
#[tauri::command]
async fn agent_get_page_info(
    state: tauri::State<'_, AppState>,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.get_page_info();
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started".to_string()),
        }),
    }
}

/// Execute arbitrary JavaScript
#[tauri::command]
async fn agent_evaluate_js(
    state: tauri::State<'_, AppState>,
    script: String,
) -> Result<AgentToolResult, String> {
    let agent_manager = state.agent_manager.lock().unwrap();

    match &agent_manager.agent {
        Some(agent) => {
            let result = agent.evaluate_js(&script);
            Ok(AgentToolResult {
                success: result.success,
                data: result.data,
                error: result.error,
            })
        }
        None => Ok(AgentToolResult {
            success: false,
            data: None,
            error: Some("Agent not started".to_string()),
        }),
    }
}

/// Simple HTTP fetch (no browser needed)
#[tauri::command]
async fn agent_fetch_page(
    url: String,
) -> Result<AgentToolResult, String> {
    let result = agent::fetch_page(&url).await;
    Ok(AgentToolResult {
        success: result.success,
        data: result.data,
        error: result.error,
    })
}

// ============================================
// Legacy Commands
// ============================================

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// ============================================
// App Entry Point
// ============================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            tab_manager: Mutex::new(TabManager::new()),
            agent_manager: Mutex::new(AgentManager::new()),
        })
        .invoke_handler(tauri::generate_handler![
            // Legacy
            greet,
            // Tab management
            create_tab,
            navigate_tab,
            close_tab,
            show_tab,
            // Browser agent
            agent_start,
            agent_stop,
            agent_navigate,
            agent_extract_text,
            agent_extract_links,
            agent_click,
            agent_fill_form,
            agent_screenshot,
            agent_scroll,
            agent_wait,
            agent_get_page_info,
            agent_evaluate_js,
            agent_fetch_page,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
