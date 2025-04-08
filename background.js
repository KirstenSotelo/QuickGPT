function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get(["context_menu_items"], (data) => {
      const enabledIds = Array.isArray(data.context_menu_items) ? data.context_menu_items : [];

      chrome.storage.local.get(["builtin_context_items"], (data2) => {
        const allItems = Array.isArray(data2.builtin_context_items) ? data2.builtin_context_items : [];

        allItems.forEach(item => {
          if (enabledIds.includes(item.id)) {
            chrome.contextMenus.create({
              id: item.id,
              title: item.label,
              contexts: ["selection"]
            });
          }
        });
      });
    });
  });
}

// 🔧 Initialize default menu items on first install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["builtin_context_items"], (data) => {
    if (!Array.isArray(data.builtin_context_items)) {
      const defaultItems = [
        { id: "define", label: "Define this", template: 'Define clearly:\n"*text*"' },
        { id: "reword", label: "Reword this", template: 'Reword for clarity:\n"*text*"' },
        { id: "summarize", label: "Summarize this", template: 'Summarize:\n"*text*"' },
        { id: "explain5", label: "Explain like I’m 5", template: 'Explain like I’m five:\n"*text*"' },
        { id: "formal", label: "Make this formal", template: 'Make this more professional:\n"*text*"' },
        { id: "casual", label: "Make this casual", template: 'Make this casual:\n"*text*"' },
        { id: "grammar", label: "Fix grammar", template: 'Fix grammar:\n"*text*"' },
        { id: "continue", label: "Continue this", template: 'Continue:\n"*text*"' }
      ];

      chrome.storage.local.set({
        builtin_context_items: defaultItems,
        context_menu_items: defaultItems.map(i => i.id)
      }, buildMenus);
    } else {
      buildMenus();
    }
  });
});

chrome.runtime.onStartup.addListener(buildMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.storage.local.get(["builtin_context_items"], (data) => {
    const items = Array.isArray(data.builtin_context_items) ? data.builtin_context_items : [];
    const item = items.find(i => i.id === info.menuItemId);
    if (!item) return;

    const prompt = item.template.replace(/\*text\*/g, info.selectionText);

    chrome.tabs.sendMessage(tab.id, {
      type: "context_prompt",
      prompt
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "rebuild_context_menu":
      buildMenus();
      sendResponse({ success: true });
      break;

    case "chatgpt_query":
      chrome.storage.local.get(["openai_api_key", "openai_model"], (result) => {
        const apiKey = result.openai_api_key;
        const model = result.openai_model || "gpt-3.5-turbo";

        if (!apiKey) {
          sendResponse({ success: false, error: "No API key set." });
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
        .catch(() => sendResponse({ success: false, error: "Request failed." }));
      });

      return true;

    case "open_options_page":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.create({
          url: chrome.runtime.getURL("options.html"),
          index: tabs[0].index + 1
        });
      });
      break;
  }
});

// ✅ Ensure menus are present on manual reload too
buildMenus();
