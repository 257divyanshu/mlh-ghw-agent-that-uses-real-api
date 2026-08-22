// Get references to the important HTML elements from index.html.
//
// These elements are used to:
// - read the user's message
// - submit the message
// - display the conversation
const form = document.getElementById("chat-form");
const input = document.getElementById("message");
const messages = document.getElementById("messages");


// =====================================================
// ADD MESSAGE TO CHAT
// =====================================================

// This function creates a new message bubble and adds it to the chat interface.
function addMessage(text, role) {

  // Create a new <div> element for the message.
  const div = document.createElement("div");

  // Add a CSS class based on who sent the message.
  //
  // role can be:
  // - "user"
  // - "assistant"
  //
  // This allows CSS to style user and assistant messages differently.
  div.className = `message ${role}`;

  // Put the actual message text inside the div.
  div.textContent = text;

  // Add the message to the chat container.
  messages.appendChild(div);

  // Automatically scroll to the newest message.
  messages.scrollTop = messages.scrollHeight;
}


// =====================================================
// HANDLE FORM SUBMISSION
// =====================================================

// Run this function whenever the user submits the chat form.
form.addEventListener("submit", async (event) => {

  // Prevent the browser from performing its default form submission, which would reload the page.
  event.preventDefault();


  // Get the user's message and remove unnecessary whitespace from the beginning/end.
  const message = input.value.trim();


  // Don't send an empty message to the server.
  if (!message) {
    return;
  }


  // Immediately display the user's message in the chat interface.
  addMessage(message, "user");


  // Clear the input field after sending.
  input.value = "";


  // Disable the input and button while we're waiting for the AI agent to respond.
  input.disabled = true;

  // Find the submit button inside the form.
  const button = form.querySelector("button");

  // Disable the button as well.
  button.disabled = true;


  try {

    // =================================================
    // SEND MESSAGE TO BACKEND
    // =================================================

    // Send the user's message to our Express server.
    //
    // Browser
    //    ↓
    // POST /api/agent
    //    ↓
    // server.js
    //    ↓
    // runAgent()
    //    ↓
    // Gemini + tools
    const response = await fetch("/api/agent", {

      // Use POST because we're sending data to the server.
      method: "POST",

      // Tell Express that the request body contains JSON.
      headers: {
        "Content-Type": "application/json",
      },

      // Convert the JavaScript object into a JSON string before sending it.
      body: JSON.stringify({
        message,
      }),
    });


    // Convert the server's JSON response into a JavaScript object.
    const data = await response.json();


    // Check whether the server returned an HTTP error status.
    if (!response.ok) {
      throw new Error(
        data.error || "Something went wrong."
      );
    }


    // Display the AI agent's answer in the chat.
    addMessage(data.answer, "assistant");

  } catch (error) {

    // If the request failed or the server returned an error, display the error in the chat.
    addMessage(
      `Error: ${error.message}`,
      "assistant"
    );

  } finally {

    // Re-enable the input field after the request finishes, whether it succeeded or failed.
    input.disabled = false;

    // Re-enable the submit button.
    button.disabled = false;

    // Put the cursor back into the input field so the user can immediately type another message.
    input.focus();
  }
});