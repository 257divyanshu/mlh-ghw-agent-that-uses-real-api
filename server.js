import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runAgent } from "./agent.js";


// =====================================================
// SERVER SETUP
// =====================================================

const app = express();
const PORT = process.env.PORT || 3000;

console.log("Node version:", process.version); // TEMP: remove after checking Render's Node version

// =====================================================
// MIDDLEWARE
// =====================================================

// Parse incoming JSON request bodies.
app.use(express.json());


// =====================================================
// STATIC FRONTEND
// =====================================================

// Resolve the directory containing this file.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the frontend from the public/ directory.
app.use(express.static(path.join(__dirname, "public")));


// =====================================================
// AGENT API
// =====================================================

// Expose the agent through an HTTP endpoint for the web interface.
app.post("/api/agent", async (req, res) => {

  const { message } = req.body;


  // Reject requests without a user message.
  if (!message) {
    return res.status(400).json({
      error: "Message is required.",
    });
  }


  try {

    // Delegate agent execution to the reusable agent module.
    const answer = await runAgent(message);

    res.json({
      answer,
    });

  } catch (error) {

    // Keep internal errors on the server and return a generic message to the client.
    console.error("Agent error:", error);

    res.status(500).json({
      error: "Something went wrong while running the agent.",
    });
  }
});

// Temporary diagnostic endpoint for testing Open-Meteo Geocoding API connectivity.
app.get("/api/test-geocoding", async (req, res) => {
  const city = req.query.city || "Berlin";

  try {
    const url =
      "https://geocoding-api.open-meteo.com/v1/search" +
      `?name=${encodeURIComponent(city)}` +
      "&count=1" +
      "&language=en" +
      "&format=json";

    const response = await fetch(url);
    const data = await response.json();

    res.json({
      city,
      ok: response.ok,
      status: response.status,
      data,
    });
  } catch (error) {
    console.error("Geocoding test failed:", error);

    res.status(500).json({
      city,
      error: error.message,
      cause: error.cause,
    });
  }
});


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(`🤖 Smart Travel Agent running at http://localhost:${PORT}`);
});