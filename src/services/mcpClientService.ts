import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MCPServer } from "../types/index.js";

class McpClientService {
  private client: MultiServerMCPClient | null = null;

  constructor() {
    // Initialize with no client
  }

  /**
   * Get or create an MCP client
   */
  async getOrCreateClient(servers: MCPServer[]): Promise<MultiServerMCPClient> {
    // Check if client already exists
    if (this.client) {
      console.log("Using existing MCP client");
      return this.client;
    }

    console.log("Creating new MCP client");

    // Create a new client if none exists
    const client = new MultiServerMCPClient({
      servers: servers.map((server) => ({
        name: server.name,
        version: server.version,
        url: server.url,
        key: server.key,
      })),
    });

    // Store the client
    this.client = client;

    return client;
  }

  /**
   * Remove the client and disconnect it
   */
  async removeClient(): Promise<void> {
    if (this.client) {
      console.log("Closing MCP client");
      await this.client.close();
      this.client = null;
    }
  }

  /**
   * Close all clients (in this simplified version, just the single client)
   */
  async closeAllClients(): Promise<void> {
    if (this.client) {
      console.log("Closing MCP client");
      await this.client.close();
      this.client = null;
    }
  }
}

// Export a singleton instance
export const mcpClientService = new McpClientService();
