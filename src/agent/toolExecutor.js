import { getWeather } from "../tools/weather.js";
import { getCountryInfo } from "../tools/country.js";
import { convertCurrency } from "../tools/currency.js";

import { validateCountryResult } from "../validation/country.js";


export async function executeTool(name, args) {
  switch (name) {
    case "getWeather":
      return await getWeather(args.city);

    case "getCountryInfo": {
      const result = await getCountryInfo(args.country);

      return validateCountryResult(args.country, result);
    }

    case "convertCurrency":
      return await convertCurrency(
        args.amount,
        args.from,
        args.to
      );

    default:
      return {
        error: `Unknown tool: ${name}`,
      };
  }
}