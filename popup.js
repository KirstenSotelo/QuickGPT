document.addEventListener("DOMContentLoaded", () => {
    const inputEl = document.getElementById("input");
    const sendBtn = document.getElementById("send");
    const outputEl = document.getElementById("output");
  
    sendBtn.addEventListener("click", async () => {
      const userInput = inputEl.value.trim();
      if (!userInput) {
        outputEl.textContent = "Please enter a prompt.";
        return;
      }
  
      outputEl.textContent = "Thinking...";
  
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: userInput }
            ]
          })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          outputEl.textContent = "API error: " + (data.error?.message || "Unknown error.");
          console.error("OpenAI API error", data);
          return;
        }
  
        const message = data.choices?.[0]?.message?.content;
        if (message) {
          outputEl.textContent = message;
        } else {
          outputEl.textContent = "No response from model.";
          console.warn("Unexpected API response:", data);
        }
  
      } catch (err) {
        console.error("Network/API error:", err);
        outputEl.textContent = "Failed to connect to API.";
      }
    });
  });
  