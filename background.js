// Default context menu items
const defaultBuiltins = [
  { id: "define", label: "Define this", template: 'Define clearly:\n"*text*"' },
  { id: "reword", label: "Reword this", template: 'Reword for clarity:\n"*text*"' },
  { id: "summarize", label: "Summarize this", template: 'Summarize:\n"*text*"' },
  { id: "explain5", label: "Explain like I’m 5", template: 'Explain like I’m five:\n"*text*"' },
  { id: "formal", label: "Make this formal", template: 'Make this more professional:\n"*text*"' },
  { id: "casual", label: "Make this casual", template: 'Make this casual:\n"*text*"' },
  { id: "grammar", label: "Fix grammar", template: 'Fix grammar:\n"*text*"' },
  { id: "continue", label: "Continue this", template: 'Continue:\n"*text*"' }
];

// Build context menus based on stored preferences
function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get(["builtin_context_items", "context_menu_items"], (data) => {
      const builtins = Array.isArray(data.builtin_context_items)
        ? data.builtin_context_items
        : defaultBuiltins;

      const enabled = Array.isArray(data.context_menu_items)
        ? data.context_menu_items
        : builtins.map(i => i.id);

      builtins.forEach(item => {
        if (enabled.includes(item.id)) {
          chrome.contextMenus.create({
            id: item.id,
            title: item.label,
            contexts: ["selection"]
          });
        }
      });
    });
  });
}

// Setup context menus on install/startup
chrome.runtime.onInstalled.addListener(buildMenus);
chrome.runtime.onStartup.addListener(buildMenus);

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const id = info.menuItemId;
  const selectedText = info.selectionText;

  chrome.storage.local.get("builtin_context_items", (data) => {
    const builtins = Array.isArray(data.builtin_context_items)
      ? data.builtin_context_items
      : defaultBuiltins;

    const item = builtins.find(i => i.id === id);
    if (!item) return;

    const prompt = item.template.replace(/\*text\*/g, selectedText);

    chrome.tabs.sendMessage(tab.id, {
      type: "context_prompt",
      prompt
    });
  });
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1. Handle query to OpenAI
  if (message.type === "chatgpt_query") {
    chrome.storage.local.get(["openai_api_key", "openai_model"], (result) => {
      const apiKey = result.openai_api_key;
      const model = result.openai_model || "gpt-3.5-turbo";

      if (!apiKey) {
        sendResponse({
          success: false,
          error: "No API key set. Please add one in the extension options."
        });
        return;
      }

      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: message.prompt }
          ]
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            sendResponse({ success: false, error: data.error.message });
          } else {
            const reply = data.choices?.[0]?.message?.content || "No response.";
            sendResponse({ success: true, reply });
          }
        })
        .catch(err => {
          console.error("OpenAI API error:", err);
          sendResponse({ success: false, error: "Request failed." });
        });
    });

    return true; // Keep message channel open
  }

  // 2. Rebuild context menu
  if (message.type === "rebuild_context_menu") {
    buildMenus();
    sendResponse({ success: true });
  }

  // 3. Open settings/options page
  if (message.type === "open_options_page") {
    chrome.runtime.openOptionsPage();
  }
});
