console.log("ChatGPT content script loaded.");

// Inject floating button
const button = document.createElement("button");
button.id = "chatgpt-float-btn";
button.textContent = "💬";
document.body.appendChild(button);

// Inject popup
const popup = document.createElement("div");
popup.id = "chatgpt-popup";
popup.innerHTML = `
  <textarea id="chatgpt-input" rows="3" placeholder="Ask ChatGPT..."></textarea>
  <button id="chatgpt-send">Send</button>
  <div id="chatgpt-response">Response will appear here.</div>
`;
document.body.appendChild(popup);

// Set initial display state
popup.style.display = "none";

// Toggle popup visibility
button.addEventListener("click", () => {
  popup.style.display = popup.style.display === "none" ? "block" : "none";
  if (popup.style.display === "block") {
    document.getElementById("chatgpt-input").focus();
  }
});

// Send prompt to background
function sendPrompt(promptText) {
  const input = document.getElementById("chatgpt-input");
  const responseEl = document.getElementById("chatgpt-response");
  const sendButton = document.getElementById("chatgpt-send");

  input.value = promptText;
  responseEl.textContent = "Thinking...";
  sendButton.disabled = true;

  chrome.runtime.sendMessage({ type: "chatgpt_query", prompt: promptText }, (res) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError.message);
      responseEl.textContent = "Error: Could not reach ChatGPT.";
    } else if (res.success) {
      responseEl.textContent = res.reply;
    } else {
      responseEl.textContent = "Error: " + (res.error || "Unknown error.");
    }

    responseEl.scrollTop = responseEl.scrollHeight;
    sendButton.disabled = false;
  });
}

// Manual send via button
document.getElementById("chatgpt-send").addEventListener("click", () => {
  const input = document.getElementById("chatgpt-input").value.trim();
  if (input) {
    sendPrompt(input);
  } else {
    document.getElementById("chatgpt-response").textContent = "Please enter a message.";
  }
});

// Listen for context menu prompts from background.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "context_prompt") {
    popup.style.display = "block";
    document.getElementById("chatgpt-input").value = msg.prompt;
    sendPrompt(msg.prompt);
  }
});
