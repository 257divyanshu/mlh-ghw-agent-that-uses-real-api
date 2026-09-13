// References to the chat interface elements.
const form = document.querySelector(".composer");
const input = document.getElementById("message");
const messages = document.getElementById("messages");
const sendBtn = document.getElementById("send-btn");
const suggestions = document.querySelectorAll(".suggestion");


// =====================================================
// DISPLAY MESSAGE
// =====================================================

// Add a user or assistant message to the chat interface.
function addMessage(text, role) {

  const isUser = role === "user";

  const div = document.createElement("div");
  div.className = `message ${isUser ? "message-user" : "message-assistant"}`;

  // Avatar
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = isUser ? "You" : "AI";

  // Bubble
  const content = document.createElement("div");
  content.className = "message-content";

  const author = document.createElement("p");
  author.className = "message-author";
  author.textContent = isUser ? "You" : "Agent";

  const text_p = document.createElement("p");
  text_p.textContent = text;

  content.appendChild(author);
  content.appendChild(text_p);

  div.appendChild(avatar);
  div.appendChild(content);

  messages.appendChild(div);

  // Keep the latest message visible.
  messages.scrollTop = messages.scrollHeight;

  return div;
}


// =====================================================
// THINKING INDICATOR
// =====================================================

// Show an animated thinking indicator while the agent is processing.
function showThinking() {

  const div = document.createElement("div");
  div.className = "message message-assistant";
  div.id = "thinking-indicator";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "AI";

  const content = document.createElement("div");
  content.className = "message-content";

  const author = document.createElement("p");
  author.className = "message-author";
  author.textContent = "Agent";

  const thinkingRow = document.createElement("div");
  thinkingRow.className = "thinking-row";

  const dots = document.createElement("div");
  dots.className = "thinking-dots";
  dots.innerHTML = "<span></span><span></span><span></span>";

  thinkingRow.appendChild(dots);
  content.appendChild(author);
  content.appendChild(thinkingRow);

  div.appendChild(avatar);
  div.appendChild(content);

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Remove the thinking indicator once the agent responds.
function hideThinking() {
  const indicator = document.getElementById("thinking-indicator");
  if (indicator) {
    indicator.remove();
  }
}


// =====================================================
// DISABLE / ENABLE UI
// =====================================================

function setUIDisabled(disabled) {
  input.disabled = disabled;
  sendBtn.disabled = disabled;
  suggestions.forEach((btn) => (btn.disabled = disabled));
}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage(message) {

  const text = message || input.value.trim();

  // Ignore empty messages.
  if (!text) return;

  // Display the user's message immediately.
  addMessage(text, "user");

  input.value = "";
  input.style.height = "auto";

  // Prevent multiple requests while the agent is processing.
  setUIDisabled(true);

  // Show thinking indicator while waiting for the agent.
  showThinking();


  try {

    // =================================================
    // SEND MESSAGE TO AGENT
    // =================================================

    // Send the user's message to the backend agent.
    //
    // Browser
    //    ↓
    // POST /api/agent
    //    ↓
    // server.js
    //    ↓
    // runAgent()
    const response = await fetch("/api/agent", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: text,
      }),
    });


    const data = await response.json();


    // Treat non-successful HTTP responses as errors.
    if (!response.ok) {
      throw new Error(
        data.error || "Something went wrong."
      );
    }

    // Remove thinking indicator before showing the real response.
    hideThinking();

    // Display the agent's response.
    addMessage(data.answer, "assistant");

  } catch (error) {

    // Remove thinking indicator on error too.
    hideThinking();

    // Display request or server errors in the chat.
    const errorDiv = addMessage(
      `Error: ${error.message}`,
      "assistant"
    );
    errorDiv.classList.add("message-error");

  } finally {

    // Restore the interface after the request completes.
    setUIDisabled(false);
    input.focus();
  }
}


// =====================================================
// HANDLE FORM SUBMISSION
// =====================================================

sendBtn.addEventListener("click", () => sendMessage());

// Send on Enter, new line on Shift+Enter.
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea as user types.
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
});


// =====================================================
// SUGGESTION CHIPS
// =====================================================

// Fill the input with the suggestion text and send it on click.
suggestions.forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = btn.dataset.prompt;
    sendMessage(prompt);
  });
});