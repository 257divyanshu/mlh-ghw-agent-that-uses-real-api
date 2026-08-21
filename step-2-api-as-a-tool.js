// STEP 2:
// Turn our API request into a reusable JavaScript tool.
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


// This function acts as our reusable "weather tool".
// Instead of hardcoding a location, we can pass any city name.
async function getWeather(city) {
  console.log(`\n🔍 Finding "${city}"...`);

  // -----------------------------------
  // 1. Convert city name to coordinates
  // -----------------------------------

  // The weather API needs latitude and longitude, but the user gives us a city name.
  //
  // So we first call the Geocoding API to convert:
  // "New York" → latitude + longitude
  const geocodingUrl =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(city)}` +
    `&count=1` +
    `&language=en` +
    `&format=json`;

  // Make the API request.
  const locationResponse = await fetch(geocodingUrl);

  // Check whether the HTTP request was successful.
  if (!locationResponse.ok) {
    throw new Error("Could not reach the geocoding API.");
  }

  // Convert the API's JSON response into a JavaScript object.
  const locationData = await locationResponse.json();

  // Make sure we actually found the city.
  //
  // ?. is optional chaining:
  // if "results" doesn't exist, this safely evaluates instead of throwing an error.
  if (!locationData.results?.length) {
    throw new Error(`Could not find a location called "${city}".`);
  }

  // The API can return multiple matching locations.
  // Since we requested count=1, the first result is the location we want.
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

  // Now that we have latitude and longitude, we can construct the actual Weather API URL.
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  console.log("\n🌍 Calling the real Weather API...");

  // Make the request to the Weather API.
  const weatherResponse = await fetch(weatherUrl);

  // Make sure the Weather API request succeeded.
  if (!weatherResponse.ok) {
    throw new Error("Could not reach the weather API.");
  }

  // Parse the Weather API's JSON response.
  const weatherData = await weatherResponse.json();

  // -----------------------------------
  // 3. Return clean data
  // -----------------------------------

  // Instead of returning the entire API response, we extract only the information our application needs.
  //
  // This makes getWeather() a clean, reusable tool:
  //
  // getWeather("New York")
  //        ↓
  // { city, country, temperature, feelsLike, ... }
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
  // Call our newly created reusable weather tool.
  // We simply provide the city name.
//   const weather = await getWeather("New York");
//   const weather = await getWeather("Vrindavan");
  const weather = await getWeather("Mayapur");

  console.log("\n✅ Real weather data:\n");

  // Display the clean object returned by getWeather().
  console.log(weather);
} catch (error) {
  // Handle any error that occurred while calling the tool.
  console.error("\n❌ Something went wrong:");
  console.error(error.message);
}