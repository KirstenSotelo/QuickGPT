console.log("ChatGPT content script loaded.");

// Create floating button
const button = document.createElement("button");
button.id = "chatgpt-float-btn";
button.textContent = "💬";
document.body.appendChild(button);

// Create popup
const popup = document.createElement("div");
popup.id = "chatgpt-popup";
popup.innerHTML = `
  <textarea id="chatgpt-input" rows="3" placeholder="Ask ChatGPT..."></textarea>
  <button id="chatgpt-send">Send</button>
  <div id="chatgpt-response">Response will appear here.</div>
  <div id="chatgpt-modal">
    <p>⚠️ <strong>ChatGPT Widget</strong><br><br>No API key is set.<br><br>Would you like to open settings?</p>
    <button id="modal-ok">🔧 Open Settings</button>
    <button id="modal-cancel">Cancel</button>
  </div>
`;
document.body.appendChild(popup);

// Add resize handles
const edges = ["top", "bottom", "left", "right"];
const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
[...edges, ...corners].forEach(pos => {
  const handle = document.createElement("div");
  handle.className = `resize-handle ${pos}`;
  popup.appendChild(handle);
});

// Position popup
function positionPopupNearButton() {
  const rect = button.getBoundingClientRect();
  const popupWidth = 380;
  const popupHeight = 300;
  let left = rect.left + button.offsetWidth - popupWidth;
  let top = rect.bottom + 10;

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  left = Math.max(10, Math.min(left, screenW - popupWidth - 10));
  top = Math.max(10, Math.min(top, screenH - popupHeight - 90));

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}
positionPopupNearButton();

// Toggle popup
popup.style.display = "none";
button.addEventListener("click", () => {
  popup.style.display = popup.style.display === "none" ? "flex" : "none";
  if (popup.style.display === "flex") {
    document.getElementById("chatgpt-input").focus();
  }
});

// Modal for API key
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

// Send prompt
function sendPrompt(promptText) {
  const input = document.getElementById("chatgpt-input");
  const response = document.getElementById("chatgpt-response");
  const sendBtn = document.getElementById("chatgpt-send");

  input.value = promptText;
  response.textContent = "Thinking...";
  sendBtn.disabled = true;

  chrome.runtime.sendMessage({ type: "chatgpt_query", prompt: promptText }, (res) => {
    if (chrome.runtime.lastError) {
      response.textContent = "Extension error.";
    } else if (res.success) {
      response.textContent = res.reply;
    } else {
      response.textContent = "Error: " + (res.error || "Unknown error.");
      if ((res.error || "").includes("No API key")) {
        showApiKeyModal();
      }
    }

    sendBtn.disabled = false;
    response.scrollTop = response.scrollHeight;
  });
}

// Manual send
document.getElementById("chatgpt-send").addEventListener("click", () => {
  const val = document.getElementById("chatgpt-input").value.trim();
  if (val) {
    sendPrompt(val);
  } else {
    document.getElementById("chatgpt-response").textContent = "Please enter a message.";
  }
});

// Handle context menu prompt
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "context_prompt") {
    popup.style.display = "flex";
    document.getElementById("chatgpt-input").value = msg.prompt;
    sendPrompt(msg.prompt);
  }
});

// Draggable logic (except on handles and input)
let isDragging = false;
let offsetX, offsetY;
popup.addEventListener("mousedown", (e) => {
  if (e.target.classList.contains("resize-handle") || e.target.closest(".resize-handle")) return;
  if (["TEXTAREA", "BUTTON"].includes(e.target.tagName)) return;

  isDragging = true;
  offsetX = e.clientX - popup.offsetLeft;
  offsetY = e.clientY - popup.offsetTop;
});
document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  popup.style.left = `${e.clientX - offsetX}px`;
  popup.style.top = `${e.clientY - offsetY}px`;
});
document.addEventListener("mouseup", () => { isDragging = false; });

// Corner + edge resize logic
let resizing = false;
let currentHandle = null;
let startX, startY, startW, startH, startLeft, startTop;

popup.querySelectorAll(".resize-handle").forEach(handle => {
  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    resizing = true;
    currentHandle = handle;
    const rect = popup.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startW = rect.width;
    startH = rect.height;
    startLeft = rect.left;
    startTop = rect.top;
  });
});

document.addEventListener("mousemove", (e) => {
  if (!resizing || !currentHandle) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  let newW = startW;
  let newH = startH;
  let newLeft = startLeft;
  let newTop = startTop;

  const cls = currentHandle.classList;

  // Corner Resizing
  if (cls.contains("top-left")) {
    newW = startW - dx;
    newLeft = startLeft + dx;
    newH = startH - dy;
    newTop = startTop + dy;
  } else if (cls.contains("top-right")) {
    newW = startW + dx;
    newH = startH - dy;
    newTop = startTop + dy;
  } else if (cls.contains("bottom-left")) {
    newW = startW - dx;
    newLeft = startLeft + dx;
    newH = startH + dy;
  } else if (cls.contains("bottom-right")) {
    newW = startW + dx;
    newH = startH + dy;
  }
  // Edge resizing
  else {
    if (cls.contains("right")) newW = startW + dx;
    if (cls.contains("left")) {
      newW = startW - dx;
      newLeft = startLeft + dx;
    }
    if (cls.contains("bottom")) newH = startH + dy;
    if (cls.contains("top")) {
      newH = startH - dy;
      newTop = startTop + dy;
    }
  }

  // Enforce minimum size
  newW = Math.max(280, newW);
  newH = Math.max(200, newH);

  popup.style.width = `${newW}px`;
  popup.style.height = `${newH}px`;
  popup.style.left = `${newLeft}px`;
  popup.style.top = `${newTop}px`;
});


document.addEventListener("mouseup", () => {
  resizing = false;
  currentHandle = null;
});

// Floating button dragging
let draggingBtn = false;
let btnOffsetX = 0, btnOffsetY = 0;
button.addEventListener("mousedown", (e) => {
  draggingBtn = true;
  btnOffsetX = e.clientX - button.offsetLeft;
  btnOffsetY = e.clientY - button.offsetTop;
});
document.addEventListener("mousemove", (e) => {
  if (!draggingBtn) return;
  button.style.left = `${e.clientX - btnOffsetX}px`;
  button.style.top = `${e.clientY - btnOffsetY}px`;
  button.style.position = "fixed";
});
document.addEventListener("mouseup", () => {
  draggingBtn = false;
});
