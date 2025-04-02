// Placeholder for background logic (e.g., context menus or persistent tasks)
const OPENAI_API_KEY = "insert here"; // SAFE here, not exposed to the web

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "chatgpt_query") {
    const prompt = message.prompt;

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ]
      })
    })
      .then(res => res.json())
      .then(data => {
        const reply = data.choices?.[0]?.message?.content || "No response from ChatGPT.";
        sendResponse({ success: true, reply });
      })
      .catch(error => {
        console.error("OpenAI API error:", error);
        sendResponse({ success: false, error: "Request failed." });
      });

    // Required to indicate we will respond async
    return true;
  }
});
