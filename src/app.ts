import express, { Application, Request, Response, NextFunction } from "express";

const app: Application = express();

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("OK");
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
