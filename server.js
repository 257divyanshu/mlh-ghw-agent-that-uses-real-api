// Import Express.
// Express will be used to create our HTTP server and API endpoint.
import express from "express";

// Import the reusable AI agent from agent.js.
//
// server.js doesn't contain the agent logic.
// It simply receives requests and passes them to runAgent().
import { runAgent } from "./agent.js";

// Import Node's path module.
// It helps us construct filesystem paths safely.
import path from "node:path";

// Gives us access to the current module's file URL.
import { fileURLToPath } from "node:url";


// Create the Express application.
const app = express();

// Port on which our server will listen.
const PORT = process.env.PORT || 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

// Parse incoming JSON request bodies.
//
// Without this middleware, Express wouldn't automatically give us access to JSON data through req.body.
app.use(express.json());


// =====================================================
// SERVE THE FRONTEND
// =====================================================

// Convert this module's URL into a normal filesystem path.
const __filename = fileURLToPath(import.meta.url);

// Get the directory containing server.js.
const __dirname = path.dirname(__filename);


// Tell Express to serve everything inside the public/ directory as static files.
//
// For example:
//
// public/index.html → http://localhost:3000/
// public/app.js     → http://localhost:3000/app.js
// public/style.css  → http://localhost:3000/style.css
app.use(express.static(path.join(__dirname, "public")));


// =====================================================
// AGENT API
// =====================================================

// This endpoint is used by the browser frontend to communicate with our AI agent.
//
// Request:
// POST /api/agent
//
// Body:
// {
//   "message": "What's the weather in Delhi?"
// }
app.post("/api/agent", async (req, res) => {

  // Extract the user's message from the request body.
  const { message } = req.body;


  // Make sure the client actually sent a message.
  if (!message) {
    return res.status(400).json({
      error: "Message is required.",
    });
  }


  try {

    // Pass the user's message to our reusable AI agent.
    //
    // server.js doesn't need to know:
    // - how Gemini works
    // - how tools work
    // - how APIs are called
    // - how the agent loop works
    //
    // All of that is handled by runAgent().
    const answer = await runAgent(message);


    // Send the agent's final answer back to the browser
    // as a JSON response.
    res.json({
      answer,
    });

  } catch (error) {

    // Handle errors that occur while running the agent.
    console.error("Agent error:", error);

    // Tell the browser that something went wrong on the server.
    res.status(500).json({
      error: "Something went wrong while running the agent.",
    });
  }
});


// =====================================================
// START SERVER
// =====================================================

// Start listening for incoming HTTP requests.
app.listen(PORT, () => {
  console.log(`🤖 Smart Travel Agent running at http://localhost:${PORT}`);
});