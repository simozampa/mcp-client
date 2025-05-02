import { Request, Response } from "express";
import { generateChat } from "../agents/chatAgent.js";
import { mcpClientService } from "../services/mcpClientService.js";
import {
  ChatMessage,
  LLMConfig,
  MCPServer,
  ParsedChunk,
} from "../types/index.js";
import { parseStreamChunk } from "../services/stremingService.js";

export async function handleChatGeneration(req: Request, res: Response) {
  const {
    input,
    llmConfig,
    chatHistory = [],
    mcpServers = [],
  } = req.body as {
    input: string;
    llmConfig: LLMConfig;
    chatHistory: ChatMessage[];
    mcpServers: MCPServer[];
  };

  console.log("Message received:", input);

  try {
    // Ensure MCP servers have the required format
    const formattedServers: MCPServer[] = mcpServers.map(
      (server: MCPServer) => ({
        name: server.name || "default",
        version: server.version || "1.0",
        url: server.url,
        key: server.key,
      })
    );

    // Get or create MCP client
    const client = await mcpClientService.getOrCreateClient(formattedServers);

    // Get available tools from the MCP client
    const tools = client.getTools();
    console.log(
      "Available tools:",
      tools.map((tool) => tool.name)
    );

    // Generate chat response
    const stream = await generateChat(input, tools, chatHistory, llmConfig);

    // Set appropriate headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Stream the parsed chunks to the client
    for await (const chunk of stream) {
      // Parse the chunk into a standardized format
      const parsedData: ParsedChunk = parseStreamChunk(chunk);

      // Write the parsed data as a Server-Sent Event
      res.write(`${JSON.stringify(parsedData)}\n\n`);
    }

    // Signal end of stream
    res.write(`${JSON.stringify({ type: "end" })}\n\n`);
    return res.end();
  } catch (error: any) {
    console.error("Stream error:", error);

    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }

    res.write(
      `${JSON.stringify({ type: "error", message: error.message })}\n\n`
    );
    return res.end();
  }
}

export async function handleInitChat(req: Request, res: Response) {
  const { mcpServers = [] } = req.body as { mcpServers: MCPServer[] };

  console.log("Initializing chat");

  try {
    // Ensure MCP servers have the required format
    const formattedServers: MCPServer[] = mcpServers.map(
      (server: MCPServer) => ({
        name: server.name || "default",
        version: server.version || "1.0",
        url: server.url,
        key: server.key,
      })
    );

    // Retrieve the client from the service or create one
    const client = await mcpClientService.getOrCreateClient(formattedServers);

    const tools = client.getTools();
    console.log(
      "Available tools:",
      tools.map((tool) => tool.name)
    );

    return res.status(200).json({ message: "Chat initialized successfully" });
  } catch (error: any) {
    console.error("Error initializing chat:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function handleCloseChat(req: Request, res: Response) {
  console.log("Closing chat");

  try {
    await mcpClientService.removeClient();
    return res.status(200).json({ message: "Chat closed successfully" });
  } catch (error: any) {
    console.error("Error closing client:", error);
    return res.status(500).json({
      message: "Failed to close client",
      error: error.message,
    });
  }
}
