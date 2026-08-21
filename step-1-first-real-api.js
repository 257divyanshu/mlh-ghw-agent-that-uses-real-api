// STEP 1:
// Calling a real API directly from Node.js.
// No Gemini. No AI. Just our application talking to an external API.

// Coordinates of Lagos, Nigeria.
// The weather API needs latitude and longitude to know the location.
const latitude = 6.5244;
const longitude = 3.3792;

// Build the URL for the Open-Meteo weather API.
//
// We are asking for:
// - current temperature
// - apparent temperature ("feels like")
// - weather code
// - wind speed
// - automatic timezone
const url =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${latitude}` +
  `&longitude=${longitude}` +
  `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
  `&timezone=auto`;

console.log("🌍 Calling the Open-Meteo Weather API...\n");

try {
  // Send an HTTP GET request to the weather API.
  // fetch() returns a Promise containing the HTTP response.
  const response = await fetch(url);

  // response.ok is true when the HTTP request succeeded.
  // If something went wrong, throw an error so execution moves to the catch block.
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  // The API sends its response as JSON.
  // response.json() parses that JSON into a JavaScript object.
  const data = await response.json();

  // Print the complete response received from the API.
  console.log("📦 Raw API response:\n");
  console.log(data);

  console.log("\n-----------------------------------\n");
  console.log("🌤️ Current Weather in Lagos\n");

  // Access the weather information inside the API response.
  // data.current contains the current weather values.
  // data.current_units contains the corresponding units.
  console.log(
    `Temperature: ${data.current.temperature_2m}${data.current_units.temperature_2m}`
  );

  console.log(
    `Feels like: ${data.current.apparent_temperature}${data.current_units.apparent_temperature}`
  );

  console.log(
    `Wind speed: ${data.current.wind_speed_10m}${data.current_units.wind_speed_10m}`
  );

  console.log(`Weather code: ${data.current.weather_code}`);

} catch (error) {
  // If either fetch() or any of the processing above fails, execution comes here.
  console.error("❌ Something went wrong:");
  console.error(error.message);
}