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

// Handle send click — send prompt to background.js securely
document.getElementById("chatgpt-send").addEventListener("click", () => {
  const input = document.getElementById("chatgpt-input").value.trim();
  const responseEl = document.getElementById("chatgpt-response");
  const sendButton = document.getElementById("chatgpt-send");

  if (!input) {
    responseEl.textContent = "Please enter a message.";
    return;
  }

  // Indicate loading state
  responseEl.textContent = "Thinking...";
  sendButton.disabled = true;

  // Send message to background script
  chrome.runtime.sendMessage({ type: "chatgpt_query", prompt: input }, (res) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError.message);
      responseEl.textContent = "Error: Could not reach ChatGPT.";
    } else if (res.success) {
      responseEl.textContent = res.reply;
    } else {
      responseEl.textContent = "Error: " + (res.error || "Unknown error.");
    }

    // Scroll to bottom and re-enable button
    responseEl.scrollTop = responseEl.scrollHeight;
    sendButton.disabled = false;
  });
});
