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
  <div id="chatgpt-modal" style="
    display: none;
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -30%);
    background: #222;
    color: #fff;
    padding: 20px;
    z-index: 99999;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    max-width: 300px;
    text-align: center;
    font-family: sans-serif;
  ">
    <p>⚠️ <strong>ChatGPT Widget</strong><br><br>No API key is set.<br><br>Would you like to open settings?</p>
    <button id="modal-ok" style="margin: 5px;">🔧 Open Settings</button>
    <button id="modal-cancel" style="margin: 5px;">Cancel</button>
  </div>
`;
document.body.appendChild(popup);

// Toggle popup visibility
popup.style.display = "none";
button.addEventListener("click", () => {
  popup.style.display = popup.style.display === "none" ? "block" : "none";
  if (popup.style.display === "block") {
    document.getElementById("chatgpt-input").focus();
  }
});

// Show custom modal
function showApiKeyModal() {
  const modal = document.getElementById("chatgpt-modal");
  modal.style.display = "block";

  document.getElementById("modal-ok").onclick = () => {
    chrome.runtime.sendMessage({ type: "open_options_page" });
    modal.style.display = "none";
  };

  document.getElementById("modal-cancel").onclick = () => {
    modal.style.display = "none";
  };
}

// Send prompt to background.js
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
      responseEl.textContent = "Extension error.";
    } else if (res.success) {
      responseEl.textContent = res.reply;
    } else {
      responseEl.textContent = "Error: " + (res.error || "Unknown error.");
      if ((res.error || "").includes("No API key")) {
        showApiKeyModal();
      }
    }

    sendButton.disabled = false;
    responseEl.scrollTop = responseEl.scrollHeight;
  });
}

// Manual send
document.getElementById("chatgpt-send").addEventListener("click", () => {
  const input = document.getElementById("chatgpt-input").value.trim();
  if (input) {
    sendPrompt(input);
  } else {
    document.getElementById("chatgpt-response").textContent = "Please enter a message.";
  }
});

// Support context menu injection
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "context_prompt") {
    popup.style.display = "block";
    document.getElementById("chatgpt-input").value = msg.prompt;
    sendPrompt(msg.prompt);
  }
});
