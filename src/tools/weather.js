export async function getWeather(city) {
  console.log(`\n🌦️ Getting real weather for ${city}...`);

  // The weather API requires latitude and longitude.
  // So first convert the city name into coordinates.
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

  // Take the first matching location.
  const location = locationData.results[0];

  // Use the coordinates to build the weather API URL.
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  const weatherResponse = await fetch(weatherUrl);

  if (!weatherResponse.ok) {
    const errorBody = await weatherResponse.text();
    console.error("Weather API failed:", weatherResponse.status, errorBody);
    throw new Error("Could not reach the weather API.");
  }

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