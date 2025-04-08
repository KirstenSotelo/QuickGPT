function buildMenus() {
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
}

chrome.runtime.onInstalled.addListener(buildMenus);
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

      return true; // Keep channel open

    case "open_options_page":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.create({
          url: chrome.runtime.getURL("options.html"),
          index: tabs[0].index + 1
        });
      });
      break;

    default:
      break;
  }
});
