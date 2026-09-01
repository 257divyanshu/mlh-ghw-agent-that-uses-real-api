// STEP 1:
// Call a real external API directly from Node.js.
// No Gemini or AI is involved at this stage.


// Coordinates used to request weather data for Lagos, Nigeria.
const latitude = 6.5244;
const longitude = 3.3792;


// Build the Open-Meteo API request.
//
// The request includes current temperature, apparent temperature, weather code, wind speed, and the location's automatic timezone.
const url =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${latitude}` +
  `&longitude=${longitude}` +
  `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
  `&timezone=auto`;


console.log("🌍 Calling the Open-Meteo Weather API...");


try {

  // Send the HTTP request and verify that it succeeded.
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }


  // Parse the JSON response returned by the API.
  const data = await response.json();


  // Display the raw API response to inspect its structure.
  console.log("\n-----------------------------------\n");
  console.log("📦 Raw API response:\n");
  console.log(data);


  console.log("\n-----------------------------------\n");
  console.log("🌤️ Current Weather in Lagos\n");


  // Extract the requested weather values from the API response.
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

  // Handle API or response-processing errors.
  console.error("❌ Something went wrong:");
  console.error(error.message);
}