import { Type } from "@google/genai";


const weatherTool = {
  name: "getWeather",
  description:
    "Get current real-world weather conditions for a city.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      city: {
        type: Type.STRING,
        description: "The city to get current weather for.",
      },
    },

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


export {
  weatherTool,
  countryTool,
  currencyTool,
};