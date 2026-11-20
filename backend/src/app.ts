import "./preload";
import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import evidenceRouter from "./routes/evidence";
import verifyRouter from "./routes/verify";

// Initialize Express app
const app = express();

// Allowed origins for CORS (local development + configurable via FRONTEND_URL or CORS_ORIGIN)
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
];

const envFrontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
const configuredOrigins = envFrontendUrl
  ? envFrontendUrl.split(",").map((origin) => origin.trim())
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...configuredOrigins]));

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, health checks)
    if (!origin) {
      return callback(null, true);
    }
    // Allow matching origins or allow all in non-production if origin is localhost
    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    service: "TruthSync Backend API",
    status: "active",
    healthCheck: "/api/health",
  });
});

// Health check endpoint (Task B-01)
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "TruthSync Backend API is running successfully",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Evidence retrieval endpoint (Task B-04 / FR-03)
app.use("/api/evidence", evidenceRouter);

// Verification and Pipeline endpoints (Task B-03 / FR-01, FR-09)
app.use("/api", verifyRouter);

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested route does not exist.",
    },
  });
});

// Global error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({
    error: {
      code: "INTERNAL",
      message: "An unexpected internal server error occurred.",
    },
  });
});

export default app;
