# MLH GHW — AI Agent with Real APIs

An AI-powered Smart Travel Agent built with Google Gemini and real-world APIs, extended with **Tool Result Validation** to make the agent more predictable and reliable when working with external data.

This project was originally built as part of **Major League Hacking (MLH) Global Hack Week — Agents Track**. I extended it as a personal engineering exercise focused on handling unexpected and ambiguous tool results.

---

## Overview

The Smart Travel Agent uses Gemini to decide which application-provided tool to call for:

* 🌍 Country information
* 🌦️ Current weather
* 💱 Currency conversion

The application executes the selected tool and returns its result to Gemini.

My extension focuses on **validating those tool results before the agent treats them as trustworthy information**.

---

## Original Progression

### Step 1 — First Real API Request

Makes a direct request to the Open-Meteo Weather API.

### Step 2 — API as a Tool

Wraps the weather API in a reusable `getWeather()` function.

### Step 3 — Real API Agent

Connects `getWeather()` to Gemini and lets the model decide when the tool is needed.

### Step 4 — Smart Travel Agent

Expands the agent with **weather, country information, and currency conversion** tools.

---

## Why I Extended the Agent

While testing the original agent with:

```text
Tell me about India.
```

the country information API returned:

```text
British Indian Ocean Territory
India
```

The original agent could fall back to Gemini's general knowledge and still produce an answer about India.

This creates a reliability problem: **a tool can return unexpected data even when the tool call itself succeeds.**

The extension therefore introduces a validation layer:

> **Tool results should be validated before they are treated as trustworthy information by the agent.**

---

# My Extension — Tool Result Validation

The updated flow is:

```text
User
  ↓
Gemini
  ↓
Tool Selection
  ↓
Tool Execution
  ↓
Real API
  ↓
Tool Result
  ↓
Validation
  ↓
Validated Result / Error / Clarification
  ↓
Gemini
  ↓
User
```

Currently, validation is implemented for the **country information tool**.

### Country Information Validation

The validator handles three cases:

| API Result         | Agent Behavior            |
| ------------------ | ------------------------- |
| One country        | Accept the result         |
| Multiple countries | Ask the user to choose    |
| No country         | Return a controlled error |

For ambiguous queries such as `Korea` or `Congo`, the agent does **not** guess which country the user intended.

For unavailable countries such as `Atlantis`, the agent returns a controlled response instead of inventing information.

---

## Behavioral Guardrails

I also updated Gemini's system instructions so that:

* Tool-provided information is treated as the source of truth for tool-supported questions.
* Gemini does not replace unreliable tool results with its own general knowledge.
* Multiple country results are presented as options for the user to choose from.

This creates a clear separation:

```text
Gemini → decides which tool to use
Application → validates what the tool returned
```

---

## Testing

I tested the country-information validation with:

```text
Tell me about India.
Tell me about Korea.
Tell me about Congo.
Tell me about United States.
Tell me about Japan.
Tell me about Atlantis.
```

These tests cover **ambiguous results, multiple results, single results, and not-found responses**.

---

## Current Validation Coverage

| Tool                    | Validation    |
| ----------------------- | ------------- |
| 🌍 Country Information  | ✅ Implemented |
| 🌦️ Weather Information | ⏳ Future work |
| 💱 Currency Conversion  | ⏳ Future work |

---

## Tech Stack

* JavaScript
* Node.js
* Express.js
* Google Gemini API
* HTML / CSS
* REST APIs

---

## Project Structure

```text
mlh-ghw-agent-that-uses-real-api/
│
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
│
├── src/
│   ├── agent/
│   │   ├── instructions.js
│   │   ├── toolExecutor.js
│   │   └── tools.js
│   │
│   ├── config/
│   │   └── gemini.js
│   │
│   ├── tools/
│   │   ├── country.js
│   │   ├── currency.js
│   │   └── weather.js
│   │
│   └── validation/
│       └── country.js
│
├── agent.js
├── server.js
├── step-1-first-real-api.js
├── step-2-api-as-a-tool.js
├── step-3-real-api-agent.js
├── step-4-smart-travel-agent.js
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

### Important Files

| File / Directory  | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| `agent.js`        | Core agent loop and Gemini interaction               |
| `server.js`       | Express server and API endpoint                      |
| `src/agent/`      | Agent instructions, tool declarations, and execution |
| `src/config/`     | Gemini client configuration                          |
| `src/tools/`      | Real API integrations                                |
| `src/validation/` | Tool-result validation                               |
| `public/`         | Web interface                                        |
| `step-*.js`       | Original project progression                         |
| `.env.example`    | Environment variable template                        |

---

# Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Add your Gemini API key

Create `.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Start the agent

```bash
node server.js
```

Open:

```text
http://localhost:3000
```

---

# Example Prompts

```text
What's the current weather in London?
```

```text
Tell me about Japan.
```

```text
Convert 100 USD to INR.
```

```text
Tell me about Korea.
```

```text
Tell me about Atlantis.
```

---

# What I Learned

Through this project and its extension, I explored:

* Building AI agents with Gemini and function/tool calling
* Integrating real-world REST APIs into agent workflows
* Separating model reasoning from application-controlled logic
* Validating external tool results and handling ambiguity
* Designing behavioral guardrails for more predictable agents

The biggest takeaway was that **successful tool calling does not necessarily mean a reliable result**. An agent can correctly select a tool and receive a response while the returned data is still unexpected or ambiguous.

---

# Future Improvements

* Add validation for weather API results
* Add validation for currency conversion results
* Handle API timeouts and network failures
* Add automated tests for tool-result validation

---

# Acknowledgement

This project was originally built as part of **Major League Hacking (MLH) Global Hack Week — Agents Track**.

The original implementation provided the Smart Travel Agent foundation, including the Gemini agent loop, real API integrations, tools, and web interface.

I extended it with **tool-result validation and behavioral guardrails** to explore how AI agents can be made more reliable when working with external data.
