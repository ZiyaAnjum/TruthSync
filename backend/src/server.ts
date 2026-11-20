import "./preload";
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
import { isSupabaseConfigured, testSupabaseConnection } from "./db/supabaseClient";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(` TruthSync Backend Server`);
  console.log(` Status: Running`);
  console.log(` Port: ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Environment: ${process.env.NODE_ENV || "development"}`);

  // Database connectivity status
  if (isSupabaseConfigured()) {
    console.log(` Database: Supabase configured. Probing connection...`);
    const health = await testSupabaseConnection();
    if (health.connected && health.tablesAccessible) {
      console.log(` Database Status: Connected to live Supabase (tables accessible).`);
    } else if (health.connected && !health.tablesAccessible) {
      console.warn(` Database Status: Connected to Supabase, but tables are missing.`);
      console.warn(` Action Required: Run backend/supabase_schema.sql in Supabase SQL Editor.`);
    } else {
      console.warn(` Database Status: Supabase connection failed: ${health.error}`);
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn(` [WARNING] Running in production without Supabase credentials!`);
      console.warn(` Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.`);
    } else {
      console.log(` Database: Using in-memory fallback (local development mode).`);
    }
  }
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
