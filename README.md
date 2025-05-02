# Simple MCP Client with LangGraph Agent

A lightweight implementation of a multiserver MCP (Model Context Protocol) client using a LangGraph agent with Express.js and TypeScript.

## Features

- Express.js server with TypeScript
- LangGraph agent for handling conversations
- MCP client for tool integration
- Streaming responses

## Setup

1. Clone the repository
2. Install dependencies:
   `npm install`
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=*
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```
4. Build and start the server:
   `npm run buildnpm start`

## API Endpoints

### Initialize Chat

```
GET /api/chat/init
```

### Generate Chat

```
POST /api/chat
```

Request body:

```json
{
  "input": "Hello, how can you help me?",
  "characterId": "character_123",
  "llmConfig": {
    "model": "claude-3-opus-20240229",
    "verbose": true
  },
  "chatHistory": [],
  "mcpServers": [
    {
      "name": "weather-service",
      "version": "1.0",
      "url": "https://example-mcp-server.com",
      "key": "optional_api_key"
    }
  ]
}
```

### Close Chat

```
GET /api/chat/close
```

## MCP Integration

The server connects to MCP servers specified in the request and retrieves available tools that can be used by the LangGraph agent.

## Development

Run the development server with auto-reload:

```
npm run dev
```

## Example Usage

```typescript
// Send a message and stream the response
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    input: "What's the weather in New York?",
    characterId: "agent1",
    chatHistory: [],
    mcpServers: [
      {
        name: "weather-service",
        version: "1.0",
        url: "https://my-mcp-server.com",
      },
    ],
  }),
});

// Read the streaming response
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = new TextDecoder().decode(value);
  const events = text.split("\n\n").filter(Boolean);
  for (const event of events) {
    const data = JSON.parse(event);
    console.log(data);
  }
}
```
