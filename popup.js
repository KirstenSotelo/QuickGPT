document.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.getElementById("input");
  const sendBtn = document.getElementById("send");
  const outputEl = document.getElementById("output");

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

      if (res?.success) {
        outputEl.textContent = res.reply;
      } else {
        const errMsg = res?.error || "Unknown error.";
        outputEl.textContent = "Error: " + errMsg;
      
        if (errMsg.includes("No API key")) {
          const goToSettings = confirm("⚠️ No API key is set.\n\nWould you like to open the settings now?");
          if (goToSettings) {
            chrome.runtime.openOptionsPage();
          }
        }
      }
      
    });
  });
});
