console.log("ChatGPT content script loaded.")

// ===== Theme =====
chrome.storage.local.get("theme_mode", (data) => {
  document.documentElement.setAttribute("data-theme", data.theme_mode || "light")
})
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.theme_mode) {
    document.documentElement.setAttribute("data-theme", changes.theme_mode.newValue)
  }

  if (changes.openai_model) {
    updateSettingsLabel(changes.openai_model.newValue);
  }
})

// ===== Create UI =====
const button = document.createElement("button")
button.id = "chatgpt-float-btn"
button.textContent = "💬"
document.body.appendChild(button)

const popup = document.createElement("div")
popup.id = "chatgpt-popup"
popup.innerHTML = `
  <textarea id="chatgpt-input" rows="3" placeholder="Ask ChatGPT..."></textarea>
  <div style="display: flex; gap: 8px;">
  <button id="chatgpt-send" style="flex: 1;">Send</button>
  </div>
  <div id="chatgpt-response-wrapper">
    <div id="chatgpt-response">Response will appear here.</div>
      <div class="chatgpt-response-actions">
        <div class="response-right-buttons">
          <div class="left">
            <button id="chatgpt-settings" title="Settings">⚙️ Settings</button>
          </div>
          <div class="right">
            <button id="chatgpt-copy" title="⧉ Copy">⧉ Copy</button>
            <button id="chatgpt-clear" title="Clear">✖ Clear</button>
          </div>
    </div>
  </div>
</div>


  <div id="chatgpt-toast" style="display:none;" class="chatgpt-toast"></div>
  <div id="chatgpt-modal">
    <p>⚠️ <strong>ChatGPT Widget</strong><br><br>No API key is set.<br><br>Would you like to open settings?</p>
    <button id="modal-ok">🔧 Open Settings</button>
    <button id="modal-cancel">Cancel</button>
  </div>
`
document.body.appendChild(popup)

// Resize handles
;["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"].forEach((pos) => {
  const handle = document.createElement("div")
  handle.className = `resize-handle ${pos}`
  popup.appendChild(handle)
})

// ===== Positioning and Toggle =====
chrome.storage.local.get("btn_position", (data) => {
  const pos = data.btn_position || "bottom-right"
  setFloatingButtonPosition(pos)
})

function setFloatingButtonPosition(pos) {
  const btnStyle = button.style
  const popupStyle = popup.style

  btnStyle.position = "fixed"
  popupStyle.position = "fixed"

  // Reset all edges
  for (const el of [btnStyle, popupStyle]) {
    el.top = el.bottom = el.left = el.right = el.transform = ""
  }

  const spacing = 10 // gap between button and popup

  switch (pos) {
    case "top-left":
      btnStyle.top = "20px"
      btnStyle.left = "20px"

      popupStyle.top = "90px"
      popupStyle.left = "20px"
      break

    case "top-right":
      btnStyle.top = "20px"
      btnStyle.right = "20px"

      popupStyle.top = "90px"
      popupStyle.right = "20px"
      break

      case "middle-right": {
        const popupHeight = popup.offsetHeight || 400 // fallback value
        popup.style.setProperty("--popup-height", `${popupHeight}px`)
      
        btnStyle.top = "calc(50% - 28px)" // center button (fixed 56px tall)
        btnStyle.right = "20px"
      
        popupStyle.top = "calc(50% - calc(var(--popup-height) / 2))"
        popupStyle.right = "90px"
        break
      }
      
      case "middle-left": {
        const popupHeight = popup.offsetHeight || 400
        popup.style.setProperty("--popup-height", `${popupHeight}px`)
      
        btnStyle.top = "calc(50% - 28px)"
        btnStyle.left = "20px"
      
        popupStyle.top = "calc(50% - calc(var(--popup-height) / 2))"
        popupStyle.left = "90px"
        break
      }

    case "bottom-left":
      btnStyle.bottom = "20px"
      btnStyle.left = "20px"

      popupStyle.bottom = "90px"
      popupStyle.left = "20px"
      break

    case "bottom-right":
    default:
      btnStyle.bottom = "20px"
      btnStyle.right = "20px"

      popupStyle.bottom = "90px"
      popupStyle.right = "20px"
      break
  }

  // Reset popup transform if not middle
  if (!pos.includes("middle")) {
    popupStyle.transform = ""
  }
}


popup.style.display = "none"
button.addEventListener("click", () => {
  popup.style.display = popup.style.display === "none" ? "flex" : "none"
  if (popup.style.display === "flex") document.getElementById("chatgpt-input").focus()
})

const settingsBtn = document.getElementById("chatgpt-settings");

function updateSettingsLabel(model) {
  const friendlyName = model?.startsWith("gpt-") ? model.replace("gpt-", "") : (model || "Unknown");
  settingsBtn.textContent = `⚙️ Settings – ChatGPT ${friendlyName}`;
}


chrome.storage.local.get("openai_model", (data) => {
  updateSettingsLabel(data.openai_model);
});

settingsBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "open_options_page" });
});


// ===== Modal =====
function showApiKeyModal() {
  const modal = document.getElementById("chatgpt-modal")
  modal.style.display = "block"
  document.getElementById("modal-ok").onclick = () => {
    chrome.runtime.sendMessage({ type: "open_options_page" })
    modal.style.display = "none"
  }
  document.getElementById("modal-cancel").onclick = () => (modal.style.display = "none")
}

// ===== Typing & Scroll Logic =====
let typingCancelled = false
function typeResponse(text, element, speed = 20) {
  element.textContent = ""
  let i = 0
  typingCancelled = false
  let userScrolledUp = false

  const onScroll = () => {
    const atBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10
    userScrolledUp = !atBottom
  }
  element.addEventListener("scroll", onScroll)

  function type() {
    if (typingCancelled) return element.removeEventListener("scroll", onScroll)
    if (i < text.length) {
      element.textContent += text.charAt(i++)
      if (!userScrolledUp) element.scrollTop = element.scrollHeight
      setTimeout(type, speed)
    } else {
      element.removeEventListener("scroll", onScroll)
    }
  }
  type()
}

// ===== Chat Logic =====
function sendPrompt(promptText) {
  const input = document.getElementById("chatgpt-input")
  const response = document.getElementById("chatgpt-response")
  const sendBtn = document.getElementById("chatgpt-send")

  input.value = promptText
  response.textContent = "Thinking..."
  sendBtn.disabled = true

  chrome.runtime.sendMessage({ type: "chatgpt_query", prompt: promptText }, (res) => {
    if (chrome.runtime.lastError) {
      response.textContent = "Extension error."
    } else if (res.success) {
      typeResponse(res.reply, response)
    } else {
      response.textContent = "Error: " + (res.error || "Unknown error.")
      if ((res.error || "").includes("No API key")) showApiKeyModal()
    }
    sendBtn.disabled = false
  })
}

document.getElementById("chatgpt-send").addEventListener("click", () => {
  const val = document.getElementById("chatgpt-input").value.trim()
  if (val) sendPrompt(val)
  else document.getElementById("chatgpt-response").textContent = "Please enter a message."
})
document.getElementById("chatgpt-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    document.getElementById("chatgpt-send").click()
  }
})
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "context_prompt") {
    popup.style.display = "flex"
    document.getElementById("chatgpt-input").value = msg.prompt
    sendPrompt(msg.prompt)
  }
})

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "model_changed") {
    updateSettingsLabel(msg.model);
  }
});


// ===== Clear & Copy Buttons =====
document.getElementById("chatgpt-clear").addEventListener("click", () => {
  typingCancelled = true
  document.getElementById("chatgpt-input").value = ""
  document.getElementById("chatgpt-response").textContent = "Response will appear here."
})

const copyBtn = document.getElementById("chatgpt-copy")
copyBtn.addEventListener("click", () => {
  const text = document.getElementById("chatgpt-response").textContent.trim()
  if (!text || text === "Response will appear here.") return

  navigator.clipboard.writeText(text).then(() => {
    const originalText = copyBtn.innerHTML
    copyBtn.innerHTML = "✅ Copied"
    copyBtn.disabled = true

    setTimeout(() => {
      copyBtn.innerHTML = originalText
      copyBtn.disabled = false
    }, 1500)
  })
})


// ===== Dragging, Resizing, Floating Button =====
let isDragging = false,
  offsetX = 0,
  offsetY = 0
popup.addEventListener("mousedown", (e) => {
  if (
    e.target.closest(".resize-handle") ||
    ["TEXTAREA", "BUTTON"].includes(e.target.tagName) ||
    e.target.closest("#chatgpt-response")
  ) return
  
  isDragging = true
  offsetX = e.clientX - popup.offsetLeft
  offsetY = e.clientY - popup.offsetTop
})
document.addEventListener("mousemove", (e) => {
  if (!isDragging) return
  popup.style.left = `${e.clientX - offsetX}px`
  popup.style.top = `${e.clientY - offsetY}px`
})
document.addEventListener("mouseup", () => (isDragging = false))

let resizing = false,
  currentHandle = null,
  startX,
  startY,
  startW,
  startH,
  startLeft,
  startTop
popup.querySelectorAll(".resize-handle").forEach((handle) => {
  handle.addEventListener("mousedown", (e) => {
    e.preventDefault()
    resizing = true
    currentHandle = handle
    const rect = popup.getBoundingClientRect()
    startX = e.clientX
    startY = e.clientY
    startW = rect.width
    startH = rect.height
    startLeft = rect.left
    startTop = rect.top
  })
})
document.addEventListener("mousemove", (e) => {
  if (!resizing || !currentHandle) return
  const dx = e.clientX - startX,
    dy = e.clientY - startY
  let newW = startW,
    newH = startH,
    newLeft = startLeft,
    newTop = startTop
  const cls = currentHandle.classList
  if (cls.contains("top-left")) {
    newW -= dx
    newLeft += dx
    newH -= dy
    newTop += dy
  } else if (cls.contains("top-right")) {
    newW += dx
    newH -= dy
    newTop += dy
  } else if (cls.contains("bottom-left")) {
    newW -= dx
    newLeft += dx
    newH += dy
  } else if (cls.contains("bottom-right")) {
    newW += dx
    newH += dy
  } else if (cls.contains("right")) newW += dx
  else if (cls.contains("left")) {
    newW -= dx
    newLeft += dx
  } else if (cls.contains("bottom")) newH += dy
  else if (cls.contains("top")) {
    newH -= dy
    newTop += dy
  }

  popup.style.width = `${Math.max(280, newW)}px`
  popup.style.height = `${Math.max(200, newH)}px`
  popup.style.left = `${newLeft}px`
  popup.style.top = `${newTop}px`
})
document.addEventListener("mouseup", () => {
  resizing = false
  currentHandle = null
})

let draggingBtn = false,
  btnOffsetX = 0,
  btnOffsetY = 0
button.addEventListener("mousedown", (e) => {
  draggingBtn = true
  btnOffsetX = e.clientX - button.offsetLeft
  btnOffsetY = e.clientY - button.offsetTop
})
document.addEventListener("mousemove", (e) => {
  if (!draggingBtn) return
  button.style.left = `${e.clientX - btnOffsetX}px`
  button.style.top = `${e.clientY - btnOffsetY}px`
  button.style.position = "fixed"
})
document.addEventListener("mouseup", () => (draggingBtn = false))

