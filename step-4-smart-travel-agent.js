// Gemini SDK.
// GoogleGenAI is used to communicate with Gemini.
// Type is used to describe the parameters of our tools.
import { GoogleGenAI, Type } from "@google/genai";

// Automatically loads variables from the .env file.
import "dotenv/config";

// Used to take input from the terminal.
import readline from "node:readline/promises";

// Gives readline access to the terminal's input/output streams.
import { stdin as input, stdout as output } from "node:process";


// Create the Gemini client using our API key.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// Create a readline interface so the user can interact with the agent through the terminal.
const rl = readline.createInterface({
  input,
  output,
});


// =====================================================
// TOOL 1: REAL WEATHER
// =====================================================

// This is the actual implementation of the weather tool.
//
// Gemini can decide to use this tool, but OUR CODE is what actually calls the weather APIs.
async function getWeather(city) {
  console.log(`\n🌦️ Getting real weather for ${city}...`);

  // The Weather API needs latitude and longitude.
  // So first convert the city name into coordinates
  // using the Geocoding API.
  const geocodingUrl =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(city)}` +
    `&count=1` +
    `&language=en` +
    `&format=json`;

  // Call the Geocoding API.
  const locationResponse = await fetch(geocodingUrl);

  // Make sure the request was successful.
  if (!locationResponse.ok) {
    throw new Error("Could not reach the geocoding API.");
  }

  // Convert the JSON response into a JavaScript object.
  const locationData = await locationResponse.json();

  // If the API couldn't find the requested city,
  // return an error object.
  if (!locationData.results?.length) {
    return {
      error: `Could not find a location called "${city}".`,
    };
  }

  // Take the first matching location.
  const location = locationData.results[0];

  // Now use the coordinates to build the Weather API URL.
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

  // Parse the JSON response.
  const weatherData = await weatherResponse.json();

  // Return only the weather information
  // that our agent needs.
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

  // Build the URL using the country provided by Gemini.
  const url =
    `https://countries.dev/name/` +
    `${encodeURIComponent(country)}`;

  // Call the Country API.
  const response = await fetch(url);

  // If the API request failed, return an error.
  if (!response.ok) {
    return {
      error: `Could not find country information for "${country}".`,
    };
  }

  // Parse the JSON response.
  const data = await response.json();

  // The API may return an array or a single object.
  // If it is an array, take the first item.
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

    // Extract only the language names from
    // the language objects returned by the API.
    languages: (result.languages || []).map(
      (language) => language.name
    ),
  };
}


// =====================================================
// TOOL 3: REAL CURRENCY CONVERSION
// =====================================================

// This function converts money between two currencies using real exchange-rate data.
async function convertCurrency(amount, from, to) {
  console.log(
    `\n💱 Getting real exchange rate: ${amount} ${from} → ${to}...`
  );

  // Convert the currency codes to uppercase.
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

  // Handle an unsuccessful API request.
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

    // Calculate the converted amount using
    // the exchange rate returned by the API.
    convertedAmount: Number(
      (amount * data.rate).toFixed(2)
    ),

    date: data.date,
  };
}


// =====================================================
// TOOL DEFINITIONS
// =====================================================

// IMPORTANT:
//
// These are NOT the actual tool implementations.
//
// They are descriptions of the tools that we give to Gemini.
//
// We are telling Gemini:
// "These tools are available to you, and this is how you should call them."

const weatherTool = {
  name: "getWeather",

  // Tells Gemini what this tool does.
  description:
    "Get current real-world weather conditions for a city.",

  // Describes the arguments Gemini must provide.
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


// Put all available tool definitions into one array.
const tools = [
  weatherTool,
  countryTool,
  currencyTool,
];


// =====================================================
// TOOL EXECUTOR
// =====================================================

// Gemini will return a function call such as:
//
// {
//   name: "getWeather",
//   args: { city: "Raipur" }
// }
//
// This function looks at the requested tool name and executes the corresponding JavaScript function.
async function executeTool(functionCall) {
  switch (functionCall.name) {

    // Gemini requested the weather tool.
    case "getWeather":
      return await getWeather(functionCall.args.city);


    // Gemini requested the country-information tool.
    case "getCountryInfo":
      return await getCountryInfo(functionCall.args.country);


    // Gemini requested the currency-conversion tool.
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
// AGENT LOOP
// =====================================================

// This is the actual AI agent.
//
// It receives the user's question and repeatedly:
//
// 1. asks Gemini what to do
// 2. executes any requested tools
// 3. sends the tool results back to Gemini
// 4. repeats until Gemini can answer the user
async function runAgent(userQuestion) {

  // This stores the complete conversation/task state.
  //
  // It starts with the user's question.
  //
  // Later, Gemini's responses and tool results will also be added here.
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


  // Prevent an accidental infinite loop.
  //
  // The agent can perform at most 8 steps for a single user question.
  const MAX_STEPS = 8;


  // Run the agent loop.
  for (let step = 1; step <= MAX_STEPS; step++) {

    console.log(`\n🔄 Agent step ${step}`);


    // Ask Gemini what it wants to do next.
    //
    // Gemini receives:
    // - the conversation so far
    // - instructions about its role
    // - the tools available to it
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      // Give Gemini the complete conversation/task state.
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

        // Give Gemini access to our three tools.
        tools: [
          {
            functionDeclarations: tools,
          },
        ],
      },
    });


    // IMPORTANT:
    //
    // Preserve Gemini's complete response.
    //
    // This is important because the response can contain function-call information and other metadata.
    const modelContent = response.candidates?.[0]?.content;

    // If Gemini didn't return valid content, stop the agent with an error.
    if (!modelContent) {
      throw new Error("Gemini returned no model content.");
    }


    // Add Gemini's response to our conversation state.
    //
    // Now contents contains:
    //
    // User question
    //       ↓
    // Gemini's response
    contents.push(modelContent);


    // Check whether Gemini requested any tools.
    const functionCalls = response.functionCalls || [];


    // =================================================
    // NO MORE TOOLS = FINAL ANSWER
    // =================================================

    // If Gemini didn't request a tool, it has enough information to answer the user.
    if (functionCalls.length === 0) {

      // Return Gemini's final natural-language answer.
      return response.text || "The agent completed the task.";
    }


    // =================================================
    // GEMINI REQUESTED ONE OR MORE TOOLS
    // =================================================

    // This array will hold the results of the tools that Gemini requested.
    const functionResponseParts = [];


    // Gemini can request multiple tools in one step.
    for (const functionCall of functionCalls) {

      console.log(`\n🧠 Gemini chose: ${functionCall.name}`);
      console.log("Arguments:", functionCall.args);


      // Execute the actual JavaScript function.
      //
      // Gemini decides WHICH tool to use.
      // executeTool() actually performs the operation.
      const result = await executeTool(functionCall);


      console.log("\n📡 Real API result:");
      console.log(result);


      // Convert the tool result into the format expected by Gemini.
      functionResponseParts.push({
        functionResponse: {
          name: functionCall.name,

          // Keep the function-call ID when Gemini provides one.
          id: functionCall.id,

          // Send the actual result from our API/tool back to Gemini.
          response: result,
        },
      });
    }


    // Add all tool results to the conversation.
    contents.push({
      role: "user",
      parts: functionResponseParts,
    });


    // The loop now starts another iteration.
    //
    // Gemini can see:
    //
    // - the original user question
    // - its previous tool request
    // - the real tool results
    //
    // It can now either:
    //
    // 1. request another tool
    // OR
    // 2. produce the final answer.
  }


  // If the agent reaches 8 steps without producing a final answer, stop it.
  return "The agent reached its maximum number of tool steps.";
}


// =====================================================
// TERMINAL APP
// =====================================================

// Display the initial terminal interface.
console.log("✈️ Smart Travel Agent");
console.log("Gemini + Real APIs + Agent Loop");
console.log("Type 'exit' to quit.\n");


// Keep the terminal application running.
while (true) {

  // Ask the user for a question.
  const userQuestion = await rl.question("You: ");


  // Exit when the user types "exit".
  if (userQuestion.toLowerCase() === "exit") {
    console.log("\n👋 Goodbye!");
    break;
  }


  try {

    // Send the user's question to our AI agent.
    const answer = await runAgent(userQuestion);

    // Display the final answer returned by Gemini.
    console.log(`\n🤖 Gemini:\n${answer}\n`);

  } catch (error) {

    // Handle any errors from Gemini, the tools, or the external APIs.
    console.error("\n❌ Something went wrong:");
    console.error(error.message);
    console.log();
  }
}


// Close the readline interface when the program exits.
rl.close();