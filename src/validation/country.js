export function validateCountryResult(country, result) {
  // No country data was returned.
  if (!result) {
    return {
      valid: false,
      type: "not_found",
      error: `Could not find country information for "${country}".`,
    };
  }

  // Normalize the response into an array.
  const countries = Array.isArray(result) ? result : [result];

  console.log("countries: ");
  console.log(countries);

  // Multiple countries were returned.
  if (countries.length > 1) {
    return {
      valid: false,
      type: "ambiguous",
      options: countries.map((item) => item.name),
    };
  }

  // Exactly one country was returned.
  return {
    valid: true,
    result: countries[0],
  };
}