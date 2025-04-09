# 🔹 QuickGPT – A Minimalist ChatGPT Assistant for Chrome

**QuickGPT** is a lightweight and customizable ChatGPT-powered assistant that lives in your browser as a floating widget and right-click menu. Designed for productivity and clarity, it lets you get instant AI help on any webpage—without breaking your flow.

**Official Website**: https://www.cs.torontomu.ca/~ksotelo/QuickGPT/

---

## ✨ Features

- 🧠 **Instant AI Access**: ChatGPT widget available on any webpage.
- 🖱️ **Right-Click Actions**: Custom context menu prompts like “Summarize”, “Reword”, or “Explain like I’m 5”.
- 🖼️ **Resizable + Draggable UI**: Move and scale the assistant anywhere on the page.
- 🎨 **Dark/Light Theme Support**: Toggle visual themes instantly.
- 🔄 **Typing Animation**: Readable responses rendered as typing.
- 🔧 **API Key + Model Settings**: Supports any OpenAI Chat model (`gpt-3.5-turbo`, `gpt-4`, etc.).
- 📋 **Copy to Clipboard**: One-click copy of AI responses.
- 🧹 **Clear Chat Function**: Reset the input and output instantly.

---

## 📸 Screenshots

### 💬 Floating Assistant on a Webpage
![image](https://github.com/user-attachments/assets/05e16ffd-8318-4a81-a609-40471ce6f75e)



### ⚙️ Fully Customizable Settings & Prompts
![image](https://github.com/user-attachments/assets/dd90df51-21bf-4dc8-b8b2-ce508c52d4ed)

> 💡 Screenshots show both light and dark mode functionality, context prompt editor, and floating widget in action.

---

## 📦 Use Cases

💡 Use Cases
QuickGPT is designed to make context-based AI assistance fast and frictionless across different roles:

* 👩‍🎓 Students
Instantly define complex terms, explain like you’re five, or summarize textbook passages. Perfect for studying smarter with clear, digestible answers.

* ✍️ Writers & Professionals
Reword awkward sentences, fix grammar, or make text more formal or casual — all directly inline. Great for emails, reports, and copywriting without tab switching.

* 👨‍💻 Developers
Use context actions to reword explanations, summarize docs, or continue snippets while working in GitHub, Stack Overflow, or documentation sites.

* 🔬 Researchers & Academics
Summarize dense papers, define terminology, and extract key ideas instantly — boosting productivity during reading or writing sessions.

➡️ You can also customize and create your own context menu prompts — for example:

* 💬 “Translate this to Spanish”

* 🧪 “Write a test case for this function”

* 📝 “Bullet-point summary”

---

## 🛠️ Tech Stack

- JavaScript (Vanilla)
- Chrome Extensions API
- OpenAI API (Chat Completions)
- HTML5 + CSS3 with responsive layout and animations
- `chrome.storage.local` for persistent state (theme, model, context menu items)

---

## 🚀 Installation

1. Clone this repo or download it as ZIP.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer Mode**.
4. Click **Load Unpacked** and select the project folder.
5. Set your API key and preferred model via the extension’s settings page.
6. Start using it via the floating 💬 button or right-click text on any webpage!

---

## 🔐 API Key Usage

Your OpenAI API key is stored **locally only** in your browser's `chrome.storage.local`. This extension does **not** track, send, or log any user data externally.

---

## ✅ Project Status

✅ Actively maintained  
✅ Tested across various webpages  
✅ Designed with performance + UX in mind

---

## 📄 License

Not yet

---

## 🙌 Acknowledgements

- [OpenAI](https://platform.openai.com/) – for enabling rapid natural language interactions.
- Inspired by a desire for faster, less-intrusive GPT access in everyday browsing.

---

## 🧠 About the Creator

I built QuickGPT to reduce friction when using ChatGPT for research, writing, and learning—all directly inside Chrome. It's a tool for fast iteration, thought expansion, and in-context support.

If you find it helpful, feel free to star ⭐ the project or suggest improvements!
