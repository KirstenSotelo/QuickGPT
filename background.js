// Default items (used only if none are saved)
const defaultBuiltins = [
  { id: "define", label: "Define this", template: 'Define the following clearly and simply:\n"*text*"' },
  { id: "reword", label: "Reword this", template: 'Reword this to be clearer and more natural:\n"*text*"' },
  { id: "summarize", label: "Summarize this", template: 'Summarize the following concisely:\n"*text*"' },
  { id: "explain5", label: "Explain like I’m 5", template: 'Explain this like I’m five years old:\n"*text*"' },
  { id: "formal", label: "Make this more formal", template: 'Rewrite this to sound more professional:\n"*text*"' },
  { id: "casual", label: "Make this more casual", template: 'Rewrite this in a casual tone:\n"*text*"' },
  { id: "grammar", label: "Fix grammar", template: 'Correct the grammar in this sentence:\n"*text*"' },
  { id: "continue", label: "Continue this", template: 'Continue the following passage:\n"*text*"' }
];

// Build context menus based on user settings
function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get(["builtin_context_items", "context_menu_items"], (data) => {
      const builtin = Array.isArray(data.builtin_context_items) ? data.builtin_context_items : defaultBuiltins;
      const enabled = Array.isArray(data.context_menu_items)
        ? data.context_menu_items
        : builtin.map(item => item.id);

      builtin.forEach(item => {
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

// Create menus on load
chrome.runtime.onInstalled.addListener(buildMenus);
chrome.runtime.onStartup.addListener(buildMenus);

// Respond to right-click action
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  const id = info.menuItemId;

  chrome.storage.local.get("builtin_context_items", (data) => {
    const builtin = Array.isArray(data.builtin_context_items) ? data.builtin_context_items : defaultBuiltins;
    const item = builtin.find(i => i.id === id);

    if (!item) return;

    const prompt = item.template.replace(/\*text\*/g, selectedText);

    chrome.tabs.sendMessage(tab.id, {
      type: "context_prompt",
      prompt
    });
  });
});

// Handle chatgpt_query requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "chatgpt_query") {
    chrome.storage.local.get(["openai_api_key", "openai_model"], (result) => {
      const apiKey = result.openai_api_key;
      const model = result.openai_model || "gpt-3.5-turbo";

      if (!apiKey) {
        sendResponse({
          success: false,
          errorType: "no_api_key"
        });
        return errorType;
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

    return true; // ✅ <-- CRUCIAL for keeping the message channel open!
  }

  if (message.type === "rebuild_context_menu") {
    buildMenus();
    sendResponse({ success: true });
  }
});

