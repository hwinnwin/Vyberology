/**
 * VybeR Browser Agent - Native Rust Implementation
 *
 * Provides full browser automation using headless_chrome (CDP protocol).
 * This enables unrestricted browser control without iframe limitations.
 */

use headless_chrome::{Browser, LaunchOptions, Tab};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct ToolResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PageInfo {
    pub url: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Link {
    pub text: String,
    pub href: String,
}

/// Browser automation agent using Chrome DevTools Protocol
pub struct BrowserAgent {
    browser: Browser,
    tab: Arc<Tab>,
}

impl BrowserAgent {
    /// Create a new browser agent instance
    pub fn new(headless: bool) -> Result<Self, String> {
        let options = LaunchOptions::default_builder()
            .headless(headless)
            .idle_browser_timeout(Duration::from_secs(300))
            .build()
            .map_err(|e| format!("Failed to build launch options: {}", e))?;

        let browser = Browser::new(options)
            .map_err(|e| format!("Failed to launch browser: {}", e))?;

        let tab = browser
            .new_tab()
            .map_err(|e| format!("Failed to create tab: {}", e))?;

        Ok(Self { browser, tab })
    }

    /// Navigate to a URL
    pub fn navigate(&self, url: &str) -> ToolResult {
        match self.tab.navigate_to(url) {
            Ok(_) => {
                // Wait for page to load
                let _ = self.tab.wait_until_navigated();
                ToolResult {
                    success: true,
                    data: Some(serde_json::json!({ "navigated_to": url })),
                    error: None,
                }
            }
            Err(e) => ToolResult {
                success: false,
                data: None,
                error: Some(format!("Navigation failed: {}", e)),
            },
        }
    }

    /// Extract text content from the page
    pub fn extract_text(&self, selector: Option<&str>, max_length: usize) -> ToolResult {
        match self.tab.get_content() {
            Ok(html) => {
                let document = Html::parse_document(&html);
                let text = if let Some(sel_str) = selector {
                    match Selector::parse(sel_str) {
                        Ok(sel) => document
                            .select(&sel)
                            .map(|el| el.text().collect::<String>())
                            .collect::<Vec<_>>()
                            .join(" "),
                        Err(_) => {
                            return ToolResult {
                                success: false,
                                data: None,
                                error: Some(format!("Invalid selector: {}", sel_str)),
                            }
                        }
                    }
                } else {
                    // Remove script and style content, get body text
                    let body_sel = Selector::parse("body").unwrap();
                    document
                        .select(&body_sel)
                        .map(|el| el.text().collect::<String>())
                        .collect::<Vec<_>>()
                        .join(" ")
                };

                // Clean up whitespace
                let cleaned: String = text
                    .split_whitespace()
                    .collect::<Vec<_>>()
                    .join(" ");

                let truncated = if cleaned.len() > max_length {
                    format!("{}... [truncated]", &cleaned[..max_length])
                } else {
                    cleaned
                };

                ToolResult {
                    success: true,
                    data: Some(serde_json::json!({
                        "text": truncated,
                        "length": truncated.len()
                    })),
                    error: None,
                }
            }
            Err(e) => ToolResult {
                success: false,
                data: None,
                error: Some(format!("Failed to get page content: {}", e)),
            },
        }
    }

    /// Extract links from the page
    pub fn extract_links(&self, selector: Option<&str>, max_links: usize) -> ToolResult {
        match self.tab.get_content() {
            Ok(html) => {
                let document = Html::parse_document(&html);
                let link_sel = Selector::parse("a[href]").unwrap();

                let base_url = self.tab.get_url();

                let container = if let Some(sel_str) = selector {
                    match Selector::parse(sel_str) {
                        Ok(sel) => document.select(&sel).next(),
                        Err(_) => None,
                    }
                } else {
                    document.select(&Selector::parse("body").unwrap()).next()
                };

                let links: Vec<Link> = if let Some(container_el) = container {
                    container_el
                        .select(&link_sel)
                        .take(max_links)
                        .filter_map(|el| {
                            let href = el.value().attr("href")?;
                            let text = el.text().collect::<String>().trim().to_string();

                            // Resolve relative URLs
                            let full_href = if href.starts_with("http") {
                                href.to_string()
                            } else if href.starts_with('/') {
                                if let Ok(base) = url::Url::parse(&base_url) {
                                    format!("{}://{}{}", base.scheme(), base.host_str().unwrap_or(""), href)
                                } else {
                                    href.to_string()
                                }
                            } else {
                                href.to_string()
                            };

                            Some(Link {
                                text,
                                href: full_href,
                            })
                        })
                        .collect()
                } else {
                    vec![]
                };

                ToolResult {
                    success: true,
                    data: Some(serde_json::json!({
                        "links": links,
                        "count": links.len()
                    })),
                    error: None,
                }
            }
            Err(e) => ToolResult {
                success: false,
                data: None,
                error: Some(format!("Failed to get page content: {}", e)),
            },
        }
    }

    /// Click an element on the page
    pub fn click(&self, selector: Option<&str>, text: Option<&str>) -> ToolResult {
        if let Some(sel) = selector {
            match self.tab.find_element(sel) {
                Ok(element) => match element.click() {
                    Ok(_) => {
                        std::thread::sleep(Duration::from_millis(500));
                        ToolResult {
                            success: true,
                            data: Some(serde_json::json!({ "clicked": sel })),
                            error: None,
                        }
                    }
                    Err(e) => ToolResult {
                        success: false,
                        data: None,
                        error: Some(format!("Click failed: {}", e)),
                    },
                },
                Err(e) => ToolResult {
                    success: false,
                    data: None,
                    error: Some(format!("Element not found: {}", e)),
                },
            }
        } else if let Some(txt) = text {
            // Find element by text content using XPath
            let xpath = format!("//*[contains(text(), '{}')]", txt);
            match self.tab.find_element_by_xpath(&xpath) {
                Ok(element) => match element.click() {
                    Ok(_) => {
                        std::thread::sleep(Duration::from_millis(500));
                        ToolResult {
                            success: true,
                            data: Some(serde_json::json!({ "clicked_text": txt })),
                            error: None,
                        }
                    }
                    Err(e) => ToolResult {
                        success: false,
                        data: None,
                        error: Some(format!("Click failed: {}", e)),
                    },
                },
                Err(e) => ToolResult {
                    success: false,
                    data: None,
                    error: Some(format!("Element with text '{}' not found: {}", txt, e)),
                },
            }
        } else {
            ToolResult {
                success: false,
                data: None,
                error: Some("Must provide selector or text".to_string()),
            }
        }
    }

    /// Fill a form field
    pub fn fill_form(&self, selector: &str, value: &str, submit: bool) -> ToolResult {
        match self.tab.find_element(selector) {
            Ok(element) => {
                // Clear and type the value
                if let Err(e) = element.click() {
                    return ToolResult {
                        success: false,
                        data: None,
                        error: Some(format!("Failed to focus input: {}", e)),
                    };
                }

                if let Err(e) = element.type_into(value) {
                    return ToolResult {
                        success: false,
                        data: None,
                        error: Some(format!("Failed to type: {}", e)),
                    };
                }

                if submit {
                    // Press Enter to submit
                    let _ = self.tab.press_key("Enter");
                    std::thread::sleep(Duration::from_millis(1000));
                }

                ToolResult {
                    success: true,
                    data: Some(serde_json::json!({
                        "filled": selector,
                        "value": value
                    })),
                    error: None,
                }
            }
            Err(e) => ToolResult {
                success: false,
                data: None,
                error: Some(format!("Input not found: {}", e)),
            },
        }
    }

    /// Take a screenshot of the page
    pub fn screenshot(&self, full_page: bool) -> ToolResult {
        let screenshot_result = if full_page {
            self.tab.capture_screenshot(
                headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Png,
                None,
                None,
                true,
            )
        } else {
            self.tab.capture_screenshot(
                headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Png,
                None,
                None,
                false,
            )
        };

        match screenshot_result {
            Ok(data) => {
                let base64_data = base64::Engine::encode(
                    &base64::engine::general_purpose::STANDARD,
                    &data,
                );
                ToolResult {
                    success: true,
                    data: Some(serde_json::json!({
                        "screenshot": format!("data:image/png;base64,{}", base64_data),
                        "size": data.len()
                    })),
                    error: None,
                }
            }
            Err(e) => ToolResult {
                success: false,
                data: None,
                error: Some(format!("Screenshot failed: {}", e)),
            },
        }
    }

    /// Scroll the page
    pub fn scroll(&self, direction: &str, amount: Option<i32>) -> ToolResult {
        let scroll_amount = amount.unwrap_or(500);

        let js = match direction {
            "up" => format!("window.scrollBy(0, -{})", scroll_amount),
            "down" => format!("window.scrollBy(0, {})", scroll_amount),
            "top" => "window.scrollTo(0, 0)".to_string(),
            "bottom" => "window.scrollTo(0, document.body.scrollHeight)".to_string(),
            _ => {
                return ToolResult {
                    success: false,
                    data: None,
                    error: Some(format!("Invalid direction: {}", direction)),
                }
            }
        };

        match self.tab.evaluate(&js, false) {
            Ok(_) => {
                std::thread::sleep(Duration::from_millis(300));
                ToolResult {
                    success: true,
                    data: Some(serde_json::json!({ "scrolled": direction })),
                    error: None,
                }
            }
            Err(e) => ToolResult {
                success: false,
                data: None,
                error: Some(format!("Scroll failed: {}", e)),
            },
        }
    }

    /// Wait for an element or timeout
    pub fn wait(&self, selector: Option<&str>, timeout_ms: u64) -> ToolResult {
        if let Some(sel) = selector {
            match self.tab.wait_for_element_with_custom_timeout(sel, Duration::from_millis(timeout_ms)) {
                Ok(_) => ToolResult {
                    success: true,
                    data: Some(serde_json::json!({ "found": sel })),
                    error: None,
                },
                Err(_) => ToolResult {
                    success: false,
                    data: None,
                    error: Some(format!("Timeout waiting for: {}", sel)),
                },
            }
        } else {
            std::thread::sleep(Duration::from_millis(timeout_ms));
            ToolResult {
                success: true,
                data: Some(serde_json::json!({ "waited_ms": timeout_ms })),
                error: None,
            }
        }
    }

    /// Get page information
    pub fn get_page_info(&self) -> ToolResult {
        let url = self.tab.get_url();

        let title = self
            .tab
            .evaluate("document.title", false)
            .map(|r| r.value.unwrap_or_default().to_string().replace('"', ""))
            .unwrap_or_else(|_| "Unknown".to_string());

        let description = self
            .tab
            .evaluate(
                "document.querySelector('meta[name=\"description\"]')?.getAttribute('content') || ''",
                false,
            )
            .map(|r| {
                let val = r.value.unwrap_or_default().to_string();
                if val == "\"\"" || val.is_empty() {
                    None
                } else {
                    Some(val.replace('"', ""))
                }
            })
            .unwrap_or(None);

        ToolResult {
            success: true,
            data: Some(serde_json::json!({
                "url": url,
                "title": title,
                "description": description
            })),
            error: None,
        }
    }

    /// Execute arbitrary JavaScript
    pub fn evaluate_js(&self, script: &str) -> ToolResult {
        match self.tab.evaluate(script, false) {
            Ok(result) => ToolResult {
                success: true,
                data: Some(serde_json::json!({
                    "result": result.value
                })),
                error: None,
            },
            Err(e) => ToolResult {
                success: false,
                data: None,
                error: Some(format!("JS evaluation failed: {}", e)),
            },
        }
    }

    /// Close the browser
    pub fn close(self) -> Result<(), String> {
        drop(self.tab);
        drop(self.browser);
        Ok(())
    }
}

/// Simple HTTP-based scraping (no browser needed)
pub async fn fetch_page(url: &str) -> ToolResult {
    let client = reqwest::Client::builder()
        .user_agent("VybeR Agent/1.0")
        .timeout(Duration::from_secs(30))
        .build();

    let client = match client {
        Ok(c) => c,
        Err(e) => {
            return ToolResult {
                success: false,
                data: None,
                error: Some(format!("Failed to create HTTP client: {}", e)),
            }
        }
    };

    match client.get(url).send().await {
        Ok(response) => {
            if !response.status().is_success() {
                return ToolResult {
                    success: false,
                    data: None,
                    error: Some(format!("HTTP error: {}", response.status())),
                };
            }

            match response.text().await {
                Ok(html) => {
                    let document = Html::parse_document(&html);

                    // Extract title
                    let title_sel = Selector::parse("title").unwrap();
                    let title = document
                        .select(&title_sel)
                        .next()
                        .map(|el| el.text().collect::<String>())
                        .unwrap_or_default();

                    // Extract text content
                    let body_sel = Selector::parse("body").unwrap();
                    let text: String = document
                        .select(&body_sel)
                        .map(|el| el.text().collect::<String>())
                        .collect::<Vec<_>>()
                        .join(" ")
                        .split_whitespace()
                        .take(2000)
                        .collect::<Vec<_>>()
                        .join(" ");

                    ToolResult {
                        success: true,
                        data: Some(serde_json::json!({
                            "url": url,
                            "title": title,
                            "text": text
                        })),
                        error: None,
                    }
                }
                Err(e) => ToolResult {
                    success: false,
                    data: None,
                    error: Some(format!("Failed to read response: {}", e)),
                },
            }
        }
        Err(e) => ToolResult {
            success: false,
            data: None,
            error: Some(format!("Request failed: {}", e)),
        },
    }
}
