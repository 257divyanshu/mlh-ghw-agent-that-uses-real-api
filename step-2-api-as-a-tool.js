// STEP 2:
// Turn the API request into a reusable JavaScript tool.
//
// City name
//    ↓
// Geocoding API
//    ↓
// Latitude + Longitude
//    ↓
// Weather API
//    ↓
// Real weather data


// Resolve a city name and return its current weather data.
async function getWeather(city) {
  console.log(`\n🔍 Finding "${city}"...`);

  // -----------------------------------
  // 1. Resolve city coordinates
  // -----------------------------------

  // Convert the city name into latitude and longitude.
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

  // The geocoding API may return no matching locations.
  if (!locationData.results?.length) {
    throw new Error(`Could not find a location called "${city}".`);
  }

  // Use the first match because the request asks for one result.
  const location = locationData.results[0];

  console.log(
    `\n📍 Found: ${location.name}, ${location.country}`
  );

  console.log(
    `   Coordinates: ${location.latitude}, ${location.longitude}`
  );


  // -----------------------------------
  // 2. Get weather using coordinates
  // -----------------------------------

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  console.log("\n🌍 Calling the real Weather API...");

  const weatherResponse = await fetch(weatherUrl);

  if (!weatherResponse.ok) {
    throw new Error("Could not reach the weather API.");
  }

  const weatherData = await weatherResponse.json();


  // -----------------------------------
  // 3. Return clean data
  // -----------------------------------

  // Return only the fields needed by the application instead of exposing the complete API responses.
  return {
    city: location.name,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
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
// TEST OUR TOOL
// -----------------------------------

try {

  // Test the reusable weather tool with a city name.
  // const weather = await getWeather("New York");
  // const weather = await getWeather("Vrindavan");
  const weather = await getWeather("Mayapur");

  console.log("\n✅ Real weather data:\n");
  console.log(weather);

} catch (error) {

  // Handle errors from either API or tool execution.
  console.error("\n❌ Something went wrong:");
  console.error(error.message);
}