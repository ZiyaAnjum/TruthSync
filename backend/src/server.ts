import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables before anything else
const envCandidates = [
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
dotenv.config();

import app from "./app";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` TruthSync Backend Server`);
  console.log(` Status: Running`);
  console.log(` Port: ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
  });
});

export default server;
