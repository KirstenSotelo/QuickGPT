document.addEventListener("DOMContentLoaded", () => {
  const BUILTIN_CONTEXT_KEY = "builtin_context_ITEMS"
  const ENABLED_CONTEXT_KEY = "context_menu_items"
  const container = document.getElementById("builtin-actions")
  const themeToggle = document.getElementById("theme")

  const defaultItems = [
    { id: "define", label: "Define this", template: 'Define the following clearly and simply:\n"*text*"' },
    { id: "reword", label: "Reword this", template: 'Reword this to be clearer and more natural:\n"*text*"' },
    { id: "summarize", label: "Summarize this", template: 'Summarize the following concisely:\n"*text*"' },
    { id: "explain5", label: "Explain like I'm 5", template: 'Explain this like I\'m five years old:\n"*text*"' },
    { id: "formal", label: "Make this more formal", template: 'Rewrite this to sound more professional:\n"*text*"' },
    { id: "casual", label: "Make this more casual", template: 'Rewrite this in a casual tone:\n"*text*"' },
    { id: "grammar", label: "Fix grammar", template: 'Correct the grammar in this sentence:\n"*text*"' },
    { id: "continue", label: "Continue this", template: 'Continue the following passage:\n"*text*"' },
  ]

  // Load settings and theme
  chrome.storage.local.get(
    ["openai_api_key", "openai_model", ENABLED_CONTEXT_KEY, BUILTIN_CONTEXT_KEY, "theme_mode"],
    (data) => {
      if (data.openai_api_key) document.getElementById("apikey").value = data.openai_api_key
      if (data.openai_model) document.getElementById("model").value = data.openai_model

      // Set theme
      const savedTheme = data.theme_mode || "light"
      themeToggle.value = savedTheme
      document.body.setAttribute("data-theme", savedTheme)

      const items = Array.isArray(data[BUILTIN_CONTEXT_KEY]) ? data[BUILTIN_CONTEXT_KEY] : defaultItems
      const enabled = Array.isArray(data[ENABLED_CONTEXT_KEY]) ? data[ENABLED_CONTEXT_KEY] : items.map((i) => i.id)
      renderMenuItems(items, enabled)
    },
  )

  // Theme toggle handler
  themeToggle.addEventListener("change", () => {
    const selectedTheme = themeToggle.value;
    document.body.setAttribute("data-theme", selectedTheme);
    chrome.storage.local.set({ theme_mode: selectedTheme }, () => {
      // ✅ Notify content script(s) via runtime message
      chrome.runtime.sendMessage({ type: "theme_changed", theme: selectedTheme });
    });
  });
  
  

  function renderMenuItems(items, enabledIds) {
    container.innerHTML = ""
    items.forEach((item, index) => {
      const block = document.createElement("div")
      block.className = "menu-block"
      block.dataset.index = index

      block.innerHTML = `
        <label>
          <input type="checkbox" class="enable-toggle" data-id="${item.id}" ${enabledIds.includes(item.id) ? "checked" : ""}>
          Enable
        </label>
        <label>Menu Label:</label>
        <input type="text" class="label-input" value="${item.label}" />
        <label>Prompt Template:</label>
        <textarea rows="2" class="template-input">${item.template}</textarea>
        <div class="menu-buttons">
          <button class="delete-btn">🗑 Delete</button>
        </div>
      `

      container.appendChild(block)
    })
  }

  document.getElementById("save-key").addEventListener("click", () => {
    const key = document.getElementById("apikey").value.trim()
    chrome.storage.local.set({ openai_api_key: key }, () => {
      showStatus("API key saved! ✅", "status-key")
    })
  })

  document.getElementById("save-model").addEventListener("click", () => {
    const model = document.getElementById("model").value;
    chrome.storage.local.set({ openai_model: model }, () => {
      showStatus("Saved to " + model, "status-model");
      // ✅ Notify content script immediately
      chrome.runtime.sendMessage({ type: "model_changed", model });
    });
  });
  

  document.getElementById("save-settings").addEventListener("click", () => {
    const key = document.getElementById("apikey").value.trim()
    const model = document.getElementById("model").value
    chrome.storage.local.set({ openai_api_key: key, openai_model: model }, () => {
      showStatus("All settings saved ✅", "status-settings")
    })
  })

  document.getElementById("save-context").addEventListener("click", () => {
    const blocks = document.querySelectorAll(".menu-block")
    const updatedItems = []
    const enabledIds = []

    blocks.forEach((block, index) => {
      const label = block.querySelector(".label-input").value.trim()
      const template = block.querySelector(".template-input").value.trim()
      const id = block.querySelector(".enable-toggle").dataset.id || `custom_${index}`
      const isEnabled = block.querySelector(".enable-toggle").checked
      if (isEnabled) enabledIds.push(id)
      updatedItems.push({ id, label, template })
    })

    chrome.storage.local.set(
      {
        [BUILTIN_CONTEXT_KEY]: updatedItems,
        [ENABLED_CONTEXT_KEY]: enabledIds,
      },
      () => {
        showStatus("Menu actions saved ✅", "status-context")
        chrome.runtime.sendMessage({ type: "rebuild_context_menu" })
      },
    )
  })

  document.getElementById("add-new").addEventListener("click", () => {
    const newId = "custom_" + Date.now()
    const newItem = {
      id: newId,
      label: "New Action",
      template: "Write a response to: *text*",
    }
    chrome.storage.local.get(BUILTIN_CONTEXT_KEY, (data) => {
      const items = Array.isArray(data[BUILTIN_CONTEXT_KEY]) ? data[BUILTIN_CONTEXT_KEY] : []
      items.push(newItem)
      renderMenuItems(items, [...items.map((i) => i.id), newId])
    })
  })

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const block = e.target.closest(".menu-block")
      block.remove()
    }
  })

  function showStatus(msg, id) {
    const el = document.getElementById(id)
    el.innerHTML = `<span style="color: var(--accent-color);">✔️ ${msg}</span>`
    setTimeout(() => (el.innerHTML = ""), 3000)
  }
})

// Save position
document.getElementById("btn-position").addEventListener("change", (e) => {
  chrome.storage.local.set({ btn_position: e.target.value })
})

// Load position on page load
chrome.storage.local.get("btn_position", (data) => {
  document.getElementById("btn-position").value = data.btn_position || "bottom-right"
})
