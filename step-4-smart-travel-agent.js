// Import Node.js's promise-based readline API.
// This allows us to read user input from the terminal.
import readline from "node:readline/promises";

// Get the terminal's standard input and output streams.
import { stdin as input, stdout as output } from "node:process";

// Import the reusable AI agent.
//
// The actual Gemini + tools + agent-loop logic now lives inside agent.js.
import { runAgent } from "./agent.js";


// Create a readline interface for terminal interaction.
const rl = readline.createInterface({
  input,
  output,
});


// Display the terminal application's introduction.
console.log("✈️ Smart Travel Agent");
console.log("Gemini + Real APIs + Agent Loop");
console.log("Type 'exit' to quit.\n");


// Keep accepting questions until the user exits.
while (true) {

  // Wait for the user to enter a question.
  const userQuestion = await rl.question("You: ");

  // Exit the application when the user types "exit".
  if (userQuestion.toLowerCase() === "exit") {
    console.log("\n👋 Goodbye!");
    break;
  }


  try {

    // Pass the user's question to the reusable agent.
    //
    // This file doesn't know how the agent works internally.
    //
    // It simply does:
    //
    // user question
    //      ↓
    //  runAgent()
    //      ↓
    // agent.js
    //      ↓
    // Gemini + tools + agent loop
    const answer = await runAgent(userQuestion);

    // Display the final answer returned by the agent.
    console.log(`\n🤖 Gemini:\n${answer}\n`);

  } catch (error) {

    // Handle any errors thrown by the agent.
    console.error("\n❌ Something went wrong:");
    console.error(error.message);
    console.log();
  }
}


// Close the readline interface when the application exits.
rl.close();