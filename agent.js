import ai from "./src/config/gemini.js";

import systemInstructions from "./src/agent/instructions.js";

import {
  weatherTool,
  countryTool,
  currencyTool,
} from "./src/agent/tools.js";

import { executeTool } from "./src/agent/toolExecutor.js";


// =====================================================
// TOOLS
// =====================================================

// All tools available to the agent.
const tools = [weatherTool, countryTool, currencyTool];


// =====================================================
// AGENT
// =====================================================

export async function runAgent(userQuestion) {

  // Ensure the Gemini API key is configured before starting the agent.
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }


  // Maintain the conversation state throughout the agent loop.
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: userQuestion,
        },
      ],
    },
  ];


  // Prevent an unbounded tool-calling loop.
  const MAX_STEPS = 8;


  // ===================================================
  // AGENT LOOP
  // ===================================================

  for (let step = 1; step <= MAX_STEPS; step++) {

    console.log(`\n🔄 Agent step ${step}`);


    // Ask Gemini to determine the next action.
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",

      // Provide Gemini with the complete task state.
      contents,

      config: {

        // Define the agent's behavioral rules.
        systemInstruction: systemInstructions,

        // Provide the tools available to Gemini.
        tools: [
          {
            functionDeclarations: tools,
          },
        ],
      },
    });


    // Extract Gemini's response from the API result.
    const modelContent = response.candidates?.[0]?.content;

    if (!modelContent) {
      throw new Error("Gemini returned no model content.");
    }


    // Preserve Gemini's response for the next iteration.
    contents.push(modelContent);


    // Check whether Gemini requested any tool calls.
    const functionCalls = response.functionCalls || [];


    // =================================================
    // FINAL RESPONSE
    // =================================================

    if (functionCalls.length === 0) {
      return response.text || "The agent completed the task.";
    }


    // =================================================
    // TOOL EXECUTION
    // =================================================

    const functionResponseParts = [];


    // Execute each tool requested by Gemini.
    for (const functionCall of functionCalls) {

      console.log(`\n🧠 Gemini chose: ${functionCall.name}`);
      console.log("Arguments:", functionCall.args);


      // Delegate tool execution and result validation.
      const result = await executeTool(
        functionCall.name,
        functionCall.args
      );


      console.log("\n📡 Real API result:");
      console.log(result);


      // Format the tool result for Gemini.
      functionResponseParts.push({
        functionResponse: {
          name: functionCall.name,

          // Preserve the ID associated with Gemini's tool call.
          id: functionCall.id,

          response: result,
        },
      });
    }


    // Add the tool results to the conversation state.
    contents.push({
      role: "user",
      parts: functionResponseParts,
    });
  }


  // Stop the agent if it exceeds the maximum number of steps.
  return "The agent reached its maximum number of tool steps.";
}