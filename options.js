document.addEventListener("DOMContentLoaded", () => {
  const BUILTIN_CONTEXT_KEY = "builtin_context_items";
  const ENABLED_CONTEXT_KEY = "context_menu_items";
  const container = document.getElementById("builtin-actions");
  const themeToggle = document.getElementById("theme");
  const positionSelector = document.getElementById("btn-position");
  const deleteButton = document.getElementById("delete-action");

  const defaultItems = [
    { id: "define", label: "Define this", template: 'Define clearly:\n"*text*"' },
    { id: "reword", label: "Reword this", template: 'Reword for clarity:\n"*text*"' },
    { id: "summarize", label: "Summarize this", template: 'Summarize:\n"*text*"' },
    { id: "explain5", label: "Explain like I’m 5", template: 'Explain like I’m five:\n"*text*"' },
    { id: "formal", label: "Make this formal", template: 'Make this more professional:\n"*text*"' },
    { id: "casual", label: "Make this casual", template: 'Make this casual:\n"*text*"' },
    { id: "grammar", label: "Fix grammar", template: 'Fix grammar:\n"*text*"' },
    { id: "continue", label: "Continue this", template: 'Continue:\n"*text*"' },
  ];

  let currentItems = [];
  let currentEnabledIds = [];
  let selectedActionId = null;

  chrome.storage.local.get(
    ["openai_api_key", "openai_model", ENABLED_CONTEXT_KEY, BUILTIN_CONTEXT_KEY, "theme_mode", "btn_position"],
    (data) => {
      if (data.openai_api_key) document.getElementById("apikey").value = data.openai_api_key;
      if (data.openai_model) document.getElementById("model").value = data.openai_model;

      themeToggle.value = data.theme_mode || "dark";
      document.body.setAttribute("data-theme", themeToggle.value);

      positionSelector.value = data.btn_position || "bottom-right";

      currentItems = Array.isArray(data[BUILTIN_CONTEXT_KEY]) ? data[BUILTIN_CONTEXT_KEY] : defaultItems;
      currentEnabledIds = Array.isArray(data[ENABLED_CONTEXT_KEY])
        ? data[ENABLED_CONTEXT_KEY]
        : currentItems.map(i => i.id);

      renderActionDropdown(currentItems, currentEnabledIds);

      if (currentItems.length > 0) {
        selectedActionId = currentItems[0].id;
        document.getElementById("action-selector").value = selectedActionId;
        renderSelectedAction(selectedActionId);
      }

      updateDeleteButtonState();
    }
  );

  themeToggle.addEventListener("change", () => {
    const selectedTheme = themeToggle.value;
    document.body.setAttribute("data-theme", selectedTheme);
    chrome.storage.local.set({ theme_mode: selectedTheme });
    chrome.runtime.sendMessage({ type: "theme_changed", theme: selectedTheme });
    showStatus("Theme updated ✅", "status-theme");
  });

  positionSelector.addEventListener("change", () => {
    chrome.storage.local.set({ btn_position: positionSelector.value });
    showStatus("Button position saved ✅", "status-position");
  });

  function renderActionDropdown(items, enabledIds) {
    container.innerHTML = "";

    const dropdownContainer = document.createElement("div");
    dropdownContainer.className = "action-dropdown-container";

    const dropdown = document.createElement("select");
    dropdown.id = "action-selector";
    dropdown.className = "action-selector";

    items.forEach(item => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = `${item.label} (${enabledIds.includes(item.id) ? "Enabled" : "Disabled"})`;
      dropdown.appendChild(option);
    });

    dropdown.addEventListener("change", (e) => {
      selectedActionId = e.target.value;
      renderSelectedAction(selectedActionId);
    });

    const enableContainer = document.createElement("div");
    enableContainer.className = "enable-container";
    enableContainer.innerHTML = `
      <label class="checkbox-label">
        <input type="checkbox" id="enable-toggle">
        <span>Enable</span>
      </label>
    `;

    dropdownContainer.appendChild(dropdown);
    dropdownContainer.appendChild(enableContainer);

    container.appendChild(dropdownContainer);
    container.appendChild(document.createElement("div")).id = "action-editor";

    document.getElementById("enable-toggle").addEventListener("change", () => {
      updateCurrentAction();
      updateDropdownOption();
    });
  }

  function renderSelectedAction(actionId) {
    const actionEditor = document.getElementById("action-editor");
    const item = currentItems.find(item => item.id === actionId);
    if (!item) return;

    document.getElementById("enable-toggle").checked = currentEnabledIds.includes(item.id);

    actionEditor.innerHTML = `
      <label>Menu Label:<input id="action-label" value="${item.label}"></label>
      <label>Prompt Template:<textarea id="action-template">${item.template}</textarea></label>
    `;

    document.getElementById("action-label").addEventListener("input", updateCurrentAction);
    document.getElementById("action-template").addEventListener("input", updateCurrentAction);
  }

  function updateCurrentAction() {
    const idx = currentItems.findIndex(i => i.id === selectedActionId);
    if (idx === -1) return;

    currentItems[idx].label = document.getElementById("action-label").value.trim();
    currentItems[idx].template = document.getElementById("action-template").value.trim();

    const enabled = document.getElementById("enable-toggle").checked;
    currentEnabledIds = enabled
      ? [...new Set([...currentEnabledIds, selectedActionId])]
      : currentEnabledIds.filter(id => id !== selectedActionId);
  }

  function updateDropdownOption() {
    const dropdown = document.getElementById("action-selector");
    const option = Array.from(dropdown.options).find(opt => opt.value === selectedActionId);
    const enabled = currentEnabledIds.includes(selectedActionId);
    option.textContent = `${currentItems.find(i => i.id === selectedActionId).label} (${enabled ? "Enabled" : "Disabled"})`;
  }

  function deleteCurrentAction() {
    const currentIndex = currentItems.findIndex(i => i.id === selectedActionId);

    currentItems = currentItems.filter(i => i.id !== selectedActionId);
    currentEnabledIds = currentEnabledIds.filter(id => id !== selectedActionId);

    renderActionDropdown(currentItems, currentEnabledIds);

    if (currentItems.length > 0) {
      const nextIndex = Math.min(currentIndex, currentItems.length - 1);
      selectedActionId = currentItems[nextIndex].id;
      document.getElementById("action-selector").value = selectedActionId;
      renderSelectedAction(selectedActionId);
    } else {
      selectedActionId = null;
      const editor = document.getElementById("action-editor");
      if (editor) {
        editor.innerHTML = `<p style="color: #888;">No actions available. Click "Add New Menu Action" to create one.</p>`;
      }
    }

    updateDeleteButtonState();
  }

  function updateDeleteButtonState() {
    if (!deleteButton) return;
    deleteButton.disabled = currentItems.length === 0;
  }

  function addNewAction() {
    const newItem = {
      id: "custom_" + Date.now(),
      label: "New Action",
      template: "Prompt:\n*text*"
    };
    currentItems.push(newItem);
    currentEnabledIds.push(newItem.id);
    renderActionDropdown(currentItems, currentEnabledIds);
    selectedActionId = newItem.id;
    document.getElementById("action-selector").value = newItem.id;
    renderSelectedAction(newItem.id);
    updateDeleteButtonState();
  }

  function saveContextMenuItems() {
    chrome.storage.local.set({
      [BUILTIN_CONTEXT_KEY]: currentItems,
      [ENABLED_CONTEXT_KEY]: currentEnabledIds,
    }, () => {
      chrome.runtime.sendMessage({ type: "rebuild_context_menu" });
      showStatus("Menu actions saved ✅", "status-context");
    });
  }

  function showStatus(msg, id) {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `<span style="color: var(--accent-color);">✔️ ${msg}</span>`;
      setTimeout(() => (el.innerHTML = ""), 3000);
    }
  }

  // Event Listeners
  document.getElementById("save-context").addEventListener("click", () => {
    updateCurrentAction();
    updateDropdownOption();
    saveContextMenuItems();
  });

  document.getElementById("add-new").addEventListener("click", addNewAction);
  deleteButton.addEventListener("click", deleteCurrentAction);

  document.getElementById("save-key").addEventListener("click", () => {
    chrome.storage.local.set({ openai_api_key: document.getElementById("apikey").value.trim() });
    showStatus("API key saved ✅", "status-key");
  });

  document.getElementById("save-model").addEventListener("click", () => {
    const model = document.getElementById("model").value;
    chrome.storage.local.set({ openai_model: model });
    chrome.runtime.sendMessage({ type: "model_changed", model });
    showStatus(`Model set to ${model} ✅`, "status-model");
  });
});
