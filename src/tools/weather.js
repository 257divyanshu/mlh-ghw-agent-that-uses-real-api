export async function getWeather(city) {
  console.log(`\n🌦️ Getting real weather for ${city}...`);

  // The weather API requires latitude and longitude. So first convert the city name into coordinates.
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
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${location.latitude}` +
    `&lon=${location.longitude}` +
    `&appid=${process.env.OPENWEATHER_API_KEY}` +
    `&units=metric`;

  const weatherResponse = await fetch(weatherUrl);

  if (!weatherResponse.ok) {
    const errorBody = await weatherResponse.text();
    console.error("Weather API failed:", weatherResponse.status, errorBody);

    if (weatherResponse.status === 429) {
      return { error: "Weather service rate limit reached. Please try again later." };
    }

    throw new Error("Could not reach the weather API.");
  }

  const weatherData = await weatherResponse.json();

  // Return only the weather information that our agent needs.
  return {
    city: location.name,
    country: location.country,
    temperature: weatherData.main.temp,
    feelsLike: weatherData.main.feels_like,
    windSpeed: weatherData.wind.speed,
    weatherDescription: weatherData.weather[0].description,
    humidity: weatherData.main.humidity,
    units: {
      temperature: "°C",
      windSpeed: "m/s",
    },
  };
}