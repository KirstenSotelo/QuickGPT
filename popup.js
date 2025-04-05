document.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.getElementById("input");
  const sendBtn = document.getElementById("send");
  const outputEl = document.getElementById("output");

  // Check if a quick prompt was passed in
  chrome.storage.local.get("quick_prompt", (data) => {
    if (data.quick_prompt) {
      inputEl.value = data.quick_prompt;
      chrome.storage.local.remove("quick_prompt");
    }
  });

  sendBtn.addEventListener("click", () => {
    const prompt = inputEl.value.trim();
    if (!prompt) {
      outputEl.textContent = "Please enter a prompt.";
      return;
    }

    outputEl.textContent = "Thinking...";

    chrome.runtime.sendMessage({ type: "chatgpt_query", prompt }, (res) => {
      if (chrome.runtime.lastError) {
        outputEl.textContent = "Extension error: " + chrome.runtime.lastError.message;
        return;
      }

      if (res.success) {
        outputEl.textContent = res.reply;
      } else {
        if (res.errorType === "no_api_key") {
          outputEl.innerHTML = `
            ⚠️ <strong>No API key is set.</strong><br><br>
            Would you like to open the settings to add one?<br><br>
            <button id="open-settings-btn">🔧 Open Settings</button>
          `;
      
          const openBtn = document.getElementById("open-settings-btn");
          if (openBtn) {
            openBtn.addEventListener("click", () => {
              chrome.runtime.openOptionsPage();
            });
          }
        } else {
          outputEl.textContent = res.error || "Unknown error.";
        }
      }
      
      
    });
  });
});
