import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { runAgent } from "./agent.js";


// =====================================================
// TERMINAL INTERFACE
// =====================================================

const rl = readline.createInterface({
  input,
  output,
});


console.log("\n✈️  Smart Travel Agent");
console.log("Gemini + Real APIs + Agent Loop");
console.log("Type 'exit' to quit.\n");


// =====================================================
// INTERACTIVE SESSION
// =====================================================

// This file only handles terminal interaction.
// The agent logic is delegated to the reusable runAgent() function.
while (true) {

  const userQuestion = await rl.question("You: ");

  if (userQuestion.toLowerCase() === "exit") {
    console.log("\n👋 Goodbye!");
    break;
  }


  try {

    // Pass the user's question to the reusable agent and display the resulting answer.
    const answer = await runAgent(userQuestion);

    console.log(`\n🤖 Gemini:\n${answer}\n`);

  } catch (error) {

    // Handle errors returned by the agent.
    console.error("\n❌ Something went wrong:");
    console.error(error.message);
    console.log();
  }
}


// Close the terminal interface when the session ends.
rl.close();