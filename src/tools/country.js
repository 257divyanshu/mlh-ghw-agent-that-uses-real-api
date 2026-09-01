export async function getCountryInfo(country) {
  console.log(`\n🌍 Getting real country information for ${country}...`);

  const url =
    `https://countries.dev/name/` +
    `${encodeURIComponent(country)}`;

  const response = await fetch(url);

  if (!response.ok) {
    return {
      error: `Could not find country information for "${country}".`,
    };
  }

  const data = await response.json();

  const result = data;

  // Simplify the API response while preserving all returned countries.
  return result.map((country) => ({
    name: country.name,
    capital: country.capital,
    region: country.region,
    subregion: country.subregion,
    population: country.population,
    currencies: country.currencies || [],

    // Extract only the language names from the language objects.
    languages: (country.languages || []).map(
      (language) => language.name
    ),
  }));
}