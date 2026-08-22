// Import Gemini's SDK.
// GoogleGenAI → used to communicate with Gemini.
// Type → used to describe the structure of our tools.
import { GoogleGenAI, Type } from "@google/genai";

// Automatically loads environment variables from .env.
import "dotenv/config";


// Create the Gemini client using the API key stored in GEMINI_API_KEY.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// =====================================================
// TOOL 1: REAL WEATHER
// =====================================================

// This function is the actual implementation of our weather tool.
//
// Gemini decides WHEN this tool should be used, but our JavaScript code actually executes it.
async function getWeather(city) {
  console.log(`\n🌦️ Getting real weather for ${city}...`);

  // The weather API requires latitude and longitude.
  // So first convert the city name into coordinates.
  const geocodingUrl =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(city)}` +
    `&count=1` +
    `&language=en` +
    `&format=json`;

  // Call the Geocoding API.
  const locationResponse = await fetch(geocodingUrl);

  // Make sure the request succeeded.
  if (!locationResponse.ok) {
    throw new Error("Could not reach the geocoding API.");
  }

  // Convert the JSON response into a JavaScript object.
  const locationData = await locationResponse.json();

  // If no location was found, return an error object.
  if (!locationData.results?.length) {
    return {
      error: `Could not find a location called "${city}".`,
    };
  }

  // Take the first matching location.
  const location = locationData.results[0];

  // Now use the coordinates to build the weather API URL.
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  // Call the actual Weather API.
  const weatherResponse = await fetch(weatherUrl);

  // Make sure the Weather API request succeeded.
  if (!weatherResponse.ok) {
    throw new Error("Could not reach the weather API.");
  }

  // Parse the API response.
  const weatherData = await weatherResponse.json();

  // Return only the weather information that our agent needs.
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
// TOOL 2: REAL COUNTRY INFORMATION
// =====================================================

// This function gets real information about a country from an external API.
async function getCountryInfo(country) {
  console.log(`\n🌍 Getting real country information for ${country}...`);

  // Build the API URL using the country name.
  const url =
    `https://countries.dev/name/` +
    `${encodeURIComponent(country)}`;

  // Call the Country API.
  const response = await fetch(url);

  // If the request failed, return an error.
  if (!response.ok) {
    return {
      error: `Could not find country information for "${country}".`,
    };
  }

  // Convert the JSON response into a JavaScript object.
  const data = await response.json();

  // The API may return either an array or an object.
  //
  // If it returns an array → take the first element.
  // Otherwise → use the object directly.
  const result = Array.isArray(data) ? data[0] : data;

  // Make sure we actually received country data.
  if (!result) {
    return {
      error: `No country data was returned for "${country}".`,
    };
  }

  // Return a simplified version of the API response.
  return {
    name: result.name,
    capital: result.capital,
    region: result.region,
    subregion: result.subregion,
    population: result.population,
    currencies: result.currencies || [],

    // Extract only the language names from the language objects returned by the API.
    languages: (result.languages || []).map(
      (language) => language.name
    ),
  };
}


// =====================================================
// TOOL 3: REAL CURRENCY CONVERSION
// =====================================================

// This function converts an amount from one currency into another using real exchange-rate data.
async function convertCurrency(amount, from, to) {
  console.log(
    `\n💱 Getting real exchange rate: ${amount} ${from} → ${to}...`
  );

  // Normalize the currency codes.
  //
  // "usd" → "USD"
  // "inr" → "INR"
  const base = from.toUpperCase();
  const quote = to.toUpperCase();

  // Build the exchange-rate API URL.
  const url =
    `https://api.frankfurter.dev/v2/rate/` +
    `${encodeURIComponent(base)}/` +
    `${encodeURIComponent(quote)}`;

  // Call the real currency API.
  const response = await fetch(url);

  // Handle an unsuccessful request.
  if (!response.ok) {
    return {
      error: `Could not convert ${base} to ${quote}.`,
    };
  }

  // Parse the API response.
  const data = await response.json();

  // Return the useful conversion information.
  return {
    amount,
    from: base,
    to: quote,
    rate: data.rate,

    // Calculate the converted amount using the rate returned by the API.
    convertedAmount: Number(
      (amount * data.rate).toFixed(2)
    ),

    date: data.date,
  };
}


// These declarations describe the JavaScript functions to Gemini.
//
// IMPORTANT: These are NOT the actual tool implementations.
//
// They tell Gemini:
// "Here are the tools you have access to, and here is how you should call them."
const weatherTool = {
  name: "getWeather",
  description:
    "Get current real-world weather conditions for a city.",

  // Define the arguments Gemini must provide.
  parameters: {
    type: Type.OBJECT,

    properties: {
      city: {
        type: Type.STRING,
        description: "The city to get current weather for.",
      },
    },

    // city is mandatory.
    required: ["city"],
  },
};


const countryTool = {
  name: "getCountryInfo",

  description:
    "Get real information about a country, including its capital, currency, languages, region, and population.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      country: {
        type: Type.STRING,
        description: "The full name of the country.",
      },
    },

    required: ["country"],
  },
};


const currencyTool = {
  name: "convertCurrency",

  description:
    "Convert money from one currency to another using current exchange-rate data.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount of money to convert.",
      },

      from: {
        type: Type.STRING,
        description:
          "The source ISO currency code, for example USD.",
      },

      to: {
        type: Type.STRING,
        description:
          "The destination ISO currency code, for example GBP.",
      },
    },

    required: ["amount", "from", "to"],
  },
};


// Keep all available tool definitions together.
const tools = [weatherTool, countryTool, currencyTool];


// =====================================================
// TOOL EXECUTOR
// =====================================================

// Gemini can return a function call such as:
//
// {
//   name: "getWeather",
//   args: { city: "Delhi" }
// }
//
// This function takes that function call and executes the corresponding JavaScript function.
async function executeTool(functionCall) {
  switch (functionCall.name) {

    // Gemini requested getWeather().
    case "getWeather":
      return await getWeather(functionCall.args.city);


    // Gemini requested getCountryInfo().
    case "getCountryInfo":
      return await getCountryInfo(functionCall.args.country);


    // Gemini requested convertCurrency().
    case "convertCurrency":
      return await convertCurrency(
        functionCall.args.amount,
        functionCall.args.from,
        functionCall.args.to
      );


    // Handle an unknown tool name.
    default:
      return {
        error: `Unknown tool: ${functionCall.name}`,
      };
  }
}


// =====================================================
// AGENT
// =====================================================

// The web server (or a future AWS handler) only needs this function.
//
// The agent logic is now separated from the interface.
//
// Another file can simply do: "runAgent(userQuestion)" without needing to know how Gemini, tools, or the agent loop work.
export async function runAgent(userQuestion) {

  // Make sure the Gemini API key is configured.
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }


  // This array stores the current conversation/task state.
  //
  // It starts with the user's question.
  //
  // Gemini's responses and tool results will be added to it as the agent loop progresses.
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


  // Prevent an accidental infinite tool loop.
  //
  // The agent can perform at most 8 iterations for a single user request.
  const MAX_STEPS = 8;


  // ===================================================
  // AGENT LOOP
  // ===================================================

  for (let step = 1; step <= MAX_STEPS; step++) {

    console.log(`\n🔄 Agent step ${step}`);


    // Ask Gemini what it wants to do next.
    //
    // Gemini receives:
    // 1. The conversation/task state
    // 2. Instructions describing its role
    // 3. The available tools
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      // Give Gemini everything that has happened so far.
      contents,

      config: {

        // These instructions define the agent's behavior.
        systemInstruction: `
          You are a helpful smart travel assistant.

          You have access to real-world API tools.
          Use tools when the user needs:
          - current weather
          - country information
          - currency information
          - currency conversion

          You may use multiple tools when necessary.

          If one tool result gives you information needed
          to call another tool, continue using tools until
          you have enough information to answer the user's request.

          Never invent current weather, country data,
          or exchange-rate information.

          Once you have enough information, give the user
          a clear, concise, friendly final answer.
        `,

        // Give Gemini access to all three tools.
        tools: [
          {
            functionDeclarations: tools,
          },
        ],
      },
    });


    // Preserve Gemini's complete response.
    //
    // This contains the model's response, including tool-call information when present.
    const modelContent = response.candidates?.[0]?.content;

    if (!modelContent) {
      throw new Error("Gemini returned no model content.");
    }


    // Add Gemini's response to the conversation state.
    //
    // contents now contains:
    //
    // User question
    //       ↓
    // Gemini response
    contents.push(modelContent);


    // Check whether Gemini requested any tools.
    const functionCalls = response.functionCalls || [];


    // =================================================
    // NO TOOL NEEDED → FINAL ANSWER
    // =================================================

    // If Gemini didn't request any tools, it has enough information to answer the user.
    if (functionCalls.length === 0) {

      // Return Gemini's final natural-language response.
      return response.text || "The agent completed the task.";
    }


    // =================================================
    // TOOL(S) REQUESTED
    // =================================================

    // Store the results of the requested tools.
    const functionResponseParts = [];


    // Gemini can request one or multiple tools during a single agent step.
    for (const functionCall of functionCalls) {

      console.log(`\n🧠 Gemini chose: ${functionCall.name}`);
      console.log("Arguments:", functionCall.args);


      // Actually execute the requested tool.
      //
      // Gemini decides WHAT tool to use.
      // executeTool() performs the actual operation.
      const result = await executeTool(functionCall);


      console.log("\n📡 Real API result:");
      console.log(result);


      // Convert our tool result into the format expected by Gemini.
      functionResponseParts.push({
        functionResponse: {
          name: functionCall.name,

          // Preserve the ID of Gemini's function call.
          id: functionCall.id,

          // Send the actual tool/API result back to Gemini.
          response: result,
        },
      });
    }


    // Add the tool results to the conversation state.
    contents.push({
      role: "user",
      parts: functionResponseParts,
    });


    // The loop now starts another iteration.
    //
    // Gemini sees:
    //
    // User question
    //      ↓
    // Gemini's previous response
    //      ↓
    // Real API/tool result
    //      ↓
    // Gemini decides what to do next
    //
    // It can either:
    //
    // 1. Call another tool
    // OR
    // 2. Return the final answer
  }


  // If Gemini keeps requesting tools for all 8 steps,
  // stop the loop rather than running forever.
  return "The agent reached its maximum number of tool steps.";
}