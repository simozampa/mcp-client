import { Server } from "http";
import { mcpClientService } from "./services/mcpClientService.js";
import { config, validateEnv } from "./utils/env.js";
import app from "./app.js";

const PORT = config.PORT;

// Initialize resources needed for the server
const initializeResources = async () => {
  console.log("Initializing resources...");
  validateEnv();
};

// Start the server
const startServer = async () => {
  try {
    // Initialize required resources
    await initializeResources();

    // Start listening for requests
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${config.NODE_ENV} mode`);
    });

    // Handle graceful shutdown
    setupShutdownHandlers(server);
    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Setup shutdown handlers
const setupShutdownHandlers = (server: Server) => {
  // Handle graceful shutdown for SIGTERM
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully");
    await gracefulShutdown(server);
  });

  // Handle graceful shutdown for SIGINT (Ctrl+C)
  process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully");
    await gracefulShutdown(server);
  });
};

// Common graceful shutdown function
const gracefulShutdown = async (server: Server) => {
  console.log("Closing all MCP clients...");
  try {
    await mcpClientService.closeAllClients();
    console.log("All MCP clients closed successfully");
  } catch (error) {
    console.error("Error closing MCP clients:", error);
  }

  // Close the server
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });

  // Force exit after timeout if server doesn't close gracefully
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 5000); // 5 seconds
};

// Start the server
startServer();
