// STEP 3:
// Give Gemini access to a real API through function calling.
//
// User question
//      ↓
//    Gemini
//      ↓
//  Tool call
//      ↓
// Application executes tool
//      ↓
// Real API result
//      ↓
//    Gemini
//      ↓
// Final answer


// =====================================================
// IMPORTS
// =====================================================

import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";


// =====================================================
// GEMINI SETUP
// =====================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// Create a terminal interface for interactive questions.
const rl = readline.createInterface({
  input,
  output,
});


// =====================================================
// REAL WEATHER TOOL
// =====================================================

// This function performs the actual weather lookup.
//
// Gemini does not call the API directly.
// It decides when this function is needed and provides the city.
async function getWeather(city) {

  // -----------------------------------
  // 1. Resolve city coordinates
  // -----------------------------------

  const geocodingUrl =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(city)}` +
    `&count=1` +
    `&language=en` +
    `&format=json`;

  const locationResponse = await fetch(geocodingUrl);

  if (!locationResponse.ok) {
    throw new Error("Could not reach the geocoding API.");
  }

  const locationData = await locationResponse.json();

  if (!locationData.results?.length) {
    return {
      error: `Could not find a location called "${city}".`,
    };
  }

  const location = locationData.results[0];


  // -----------------------------------
  // 2. Fetch weather
  // -----------------------------------

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  const weatherResponse = await fetch(weatherUrl);

  if (!weatherResponse.ok) {
    throw new Error("Could not reach the weather API.");
  }

  const weatherData = await weatherResponse.json();


  // -----------------------------------
  // 3. Return clean data
  // -----------------------------------

  return {
    city: location.name,
    country: location.country,
    temperature: weatherData.current.temperature_2m,
    feelsLike: weatherData.current.apparent_temperature,
    windSpeed: weatherData.current.wind_speed_10m,
    weatherCode: weatherData.current.weather_code,
    units: {
      temperature: weatherData.current_units.temperature_2m,
      windSpeed: weatherData.current_units.wind_speed_10m,
    },
  };
}


// =====================================================
// GEMINI TOOL DECLARATION
// =====================================================

// Describe the weather tool to Gemini.
//
// This declaration tells Gemini what the tool does and what arguments it must provide when calling it.
const weatherTool = {
  name: "getWeather",

  description:
    "Get the current real-world weather for a city using a live weather API.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      city: {
        type: Type.STRING,
        description: "The city to get current weather information for.",
      },
    },

    required: ["city"],
  },
};


// =====================================================
// AGENT LOOP
// =====================================================

console.log("\n🤖 Real API Weather Agent");
console.log("Ask me about the weather in any city.");
console.log("Type 'exit' to quit.\n");


while (true) {

  const userQuestion = await rl.question("You: ");

  if (userQuestion.toLowerCase() === "exit") {
    console.log("\n👋 Goodbye!");
    break;
  }


  try {

    // -----------------------------------
    // 1. Ask Gemini what to do
    // -----------------------------------

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      contents: userQuestion,

      config: {
        tools: [
          {
            functionDeclarations: [weatherTool],
          },
        ],
      },
    });


    const functionCall = response.functionCalls?.[0];


    // Gemini can answer directly when no tool is required.
    if (!functionCall) {
      console.log(`\n🤖 Gemini: ${response.text}\n`);
      continue;
    }


    // -----------------------------------
    // 2. Execute the requested tool
    // -----------------------------------

    console.log("\n🧠 Gemini decided to use:");
    console.log(functionCall);

    const toolResult = await getWeather(functionCall.args.city);

    console.log("\n🌍 Real API result:");
    console.log(toolResult);


    // -----------------------------------
    // 3. Return the tool result to Gemini
    // -----------------------------------

    // Preserve Gemini's original function-call response so the tool result can be associated with that request.
    const modelContent = response.candidates[0].content;


    // Ask Gemini to formulate the final answer using the real data returned by our application.
    const finalResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      contents: [
        {
          role: "user",
          parts: [
            {
              text: userQuestion,
            },
          ],
        },

        modelContent,

        {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: functionCall.name,
                response: toolResult,
              },
            },
          ],
        },
      ],

      config: {
        tools: [
          {
            functionDeclarations: [weatherTool],
          },
        ],
      },
    });


    // Display the final answer generated from the tool result.
    console.log(`\n🤖 Gemini: ${finalResponse.text}\n`);

  } catch (error) {

    // Handle errors from Gemini, the APIs, or tool execution.
    console.error("\n❌ Something went wrong:");
    console.error(error.message);
    console.log();
  }
}


// Close the terminal interface when the agent exits.
rl.close();