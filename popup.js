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
            "Authorization": `Bearer ${OPENAI_API_KEY}` // coming from config.js
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
  
        if (response.ok) {
          const result = data.choices?.[0]?.message?.content;
          outputEl.textContent = result || "No response.";
        } else {
          console.error("OpenAI API error:", data);
          outputEl.textContent = "Error: " + (data.error?.message || "Unknown error.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        outputEl.textContent = "Failed to connect to API.";
      }
    });
  });
  