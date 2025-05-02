import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
};

// Validate required environment variables
export function validateEnv() {
  const requiredVars = ["ANTHROPIC_API_KEY"];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`);
      process.exit(1);
    }
  }
}
