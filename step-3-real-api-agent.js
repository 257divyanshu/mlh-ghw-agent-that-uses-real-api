// Import Google's Gemini SDK.
// GoogleGenAI is used to communicate with Gemini.
// Type is used to describe the structure of our tool's parameters.
import { GoogleGenAI, Type } from "@google/genai";

// Automatically loads variables from the .env file.
import "dotenv/config";

// Node.js module for taking input from the terminal.
import readline from "node:readline/promises";

// Gives us access to the terminal's standard input and output.
import { stdin as input, stdout as output } from "node:process";


// Create the Gemini client.
// The API key is taken from the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// Create a readline interface so the user can continuously type questions in the terminal.
const rl = readline.createInterface({
  input,
  output,
});


// -----------------------------------
// REAL WEATHER TOOL
// -----------------------------------

// This is the actual function that talks to real APIs.
//
// Gemini itself does NOT fetch the weather.
// Gemini only decides WHEN this function should be used and WHAT city should be passed to it.
async function getWeather(city) {
  console.log(`\n🔍 Looking up "${city}"...`);

  // -----------------------------------
  // 1. Find city coordinates
  // -----------------------------------

  // Convert the city name into latitude and longitude.
  const geocodingUrl =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(city)}` +
    `&count=1` +
    `&language=en` +
    `&format=json`;

  // Call the Geocoding API.
  const locationResponse = await fetch(geocodingUrl);

  // Make sure the API request succeeded.
  if (!locationResponse.ok) {
    throw new Error("Could not reach the geocoding API.");
  }

  // Convert the JSON response into a JavaScript object.
  const locationData = await locationResponse.json();

  // If the API couldn't find the requested city, return an error object instead of continuing.
  if (!locationData.results?.length) {
    return {
      error: `Could not find a location called "${city}".`,
    };
  }

  // Take the first matching location returned by the API.
  const location = locationData.results[0];


  // -----------------------------------
  // 2. Fetch real weather
  // -----------------------------------

  // Now that we have latitude and longitude, construct the URL for the Weather API.
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  // Call the real Weather API.
  const weatherResponse = await fetch(weatherUrl);

  // Make sure the Weather API request succeeded.
  if (!weatherResponse.ok) {
    throw new Error("Could not reach the weather API.");
  }

  // Parse the API response into a JavaScript object.
  const weatherData = await weatherResponse.json();


  // -----------------------------------
  // 3. Return clean data
  // -----------------------------------

  // Extract only the weather information we care about instead of returning the entire API response.
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


// -----------------------------------
// TELL GEMINI ABOUT THE TOOL
// -----------------------------------

// This object does NOT contain the implementation of the tool.
//
// It is a DESCRIPTION of the tool that we give to Gemini.
//
// We are essentially telling Gemini:
// "You have access to a tool called getWeather.
// Here's what it does and here's what argument it needs."
const weatherTool = {
  name: "getWeather",

  description:
    "Get the current real-world weather for a city using a live weather API.",

  // Describe the parameters that Gemini must provide when it decides to call this tool.
  parameters: {
    type: Type.OBJECT,

    properties: {
      city: {
        type: Type.STRING,
        description: "The city to get current weather information for.",
      },
    },

    // Gemini MUST provide the city argument.
    required: ["city"],
  },
};


// -----------------------------------
// START THE AGENT
// -----------------------------------

console.log("🤖 Real API Weather Agent");
console.log("Ask me about the weather in any city.");
console.log("Type 'exit' to quit.\n");


// Keep the agent running so the user can ask
// multiple questions in the same session.
while (true) {

  // Wait for the user to enter a question.
  const userQuestion = await rl.question("You: ");

  // Allow the user to terminate the agent.
  if (userQuestion.toLowerCase() === "exit") {
    console.log("\n👋 Goodbye!");
    break;
  }

  try {

    // -----------------------------------
    // 1. Ask Gemini what to do
    // -----------------------------------

    // Send the user's question to Gemini.
    //
    // We also give Gemini access to our weatherTool.
    //
    // Gemini now has the ability to decide: "I need to use getWeather for this question."
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


    // Gemini may respond with a function call.
    //
    // Example:
    // User: "What's the weather in Delhi?"
    //
    // Gemini might produce:
    // {
    //   name: "getWeather",
    //   args: { city: "Delhi" }
    // }
    const functionCall = response.functionCalls?.[0];


    // -----------------------------------
    // Gemini does not need a tool
    // -----------------------------------

    // If Gemini didn't request a tool, simply display its normal text response.
    if (!functionCall) {
      console.log(`\n🤖 Gemini: ${response.text}\n`);
      continue;
    }


    // -----------------------------------
    // 2. Execute the real tool
    // -----------------------------------

    // Show which tool Gemini decided to use.
    console.log("\n🧠 Gemini decided to use:");
    console.log(functionCall);

    // Actually execute our JavaScript function.
    //
    // Gemini supplied the city argument, and we pass that argument to getWeather().
    const toolResult = await getWeather(functionCall.args.city);

    console.log("\n🌍 Real API result:");
    console.log(toolResult);


    // -----------------------------------
    // 3. Send the tool result back to Gemini
    // -----------------------------------

    // Save Gemini's original response.
    //
    // This contains Gemini's function-call decision.
    const modelContent = response.candidates[0].content;


    // Now we make a SECOND request to Gemini.
    //
    // This time we give Gemini:
    //
    // 1. The original user question
    // 2. Gemini's previous function-call decision
    // 3. The actual result returned by our real API
    //
    // Gemini can now use the real-world data to formulate the final answer for the user.
    const finalResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      contents: [

        // The original user question.
        {
          role: "user",
          parts: [
            {
              text: userQuestion,
            },
          ],
        },

        // Gemini's previous response containing the function-call decision.
        modelContent,

        // The result returned by our actual tool.
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

      // Give Gemini the tool definition again.
      config: {
        tools: [
          {
            functionDeclarations: [weatherTool],
          },
        ],
      },
    });


    // Display Gemini's final, human-readable answer.
    console.log(`\n🤖 Gemini: ${finalResponse.text}\n`);

  } catch (error) {

    // Handle errors from Gemini, the APIs, or any other part of the process.
    console.error("\n❌ Something went wrong:");
    console.error(error.message);
    console.log();
  }
}


// Close the readline interface when the agent exits.
rl.close();