/**
 * Express Application Setup
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares");
const logger = require("./utils/logger");

// Create Express app
const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "..", "public")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api", routes);

// Serve frontend for all non-API routes
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
