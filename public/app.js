// References to the chat interface elements.
const form = document.getElementById("chat-form");
const input = document.getElementById("message");
const messages = document.getElementById("messages");


// =====================================================
// DISPLAY MESSAGE
// =====================================================

// Add a user or assistant message to the chat interface.
function addMessage(text, role) {

  const div = document.createElement("div");

  div.className = `message ${role}`;
  div.textContent = text;

  messages.appendChild(div);

  // Keep the latest message visible.
  messages.scrollTop = messages.scrollHeight;
}


// =====================================================
// HANDLE FORM SUBMISSION
// =====================================================

form.addEventListener("submit", async (event) => {

  // Prevent the page from reloading on form submission.
  event.preventDefault();


  const message = input.value.trim();

  // Ignore empty messages.
  if (!message) {
    return;
  }


  // Display the user's message immediately.
  addMessage(message, "user");

  input.value = "";


  // Prevent multiple requests while the agent is processing.
  input.disabled = true;

  const button = form.querySelector("button");
  button.disabled = true;


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
        message,
      }),
    });


    const data = await response.json();


    // Treat non-successful HTTP responses as errors.
    if (!response.ok) {
      throw new Error(
        data.error || "Something went wrong."
      );
    }


    // Display the agent's response.
    addMessage(data.answer, "assistant");

  } catch (error) {

    // Display request or server errors in the chat.
    addMessage(
      `Error: ${error.message}`,
      "assistant"
    );

  } finally {

    // Restore the interface after the request completes.
    input.disabled = false;
    button.disabled = false;
    input.focus();
  }
});