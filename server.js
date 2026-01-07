/**
 * Server Entry Point
 * Initializes database, WhatsApp client, and starts HTTP/WebSocket servers
 */

require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const { connectDB } = require("./src/config/database");
const { initializeClient } = require("./src/config/whatsapp");
const { setBroadcastFunction } = require("./src/events/handlers");
const logger = require("./src/utils/logger");
const { WS_EVENTS } = require("./src/config/constants");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// WebSocket connection handling
io.on("connection", (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);

  // Send current status on connection
  const { getClientStatus, getCurrentQR } = require("./src/config/whatsapp");
  socket.emit(WS_EVENTS.CLIENT_STATUS, { status: getClientStatus() });

  const qr = getCurrentQR();
  if (qr) {
    socket.emit(WS_EVENTS.CLIENT_QR, { qr });
  }

  socket.on("disconnect", () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
  });

  // Handle custom events
  socket.on("subscribe", (data) => {
    if (data.chatId) {
      socket.join(`chat:${data.chatId}`);
      logger.debug(`Socket ${socket.id} subscribed to chat:${data.chatId}`);
    }
  });

  socket.on("unsubscribe", (data) => {
    if (data.chatId) {
      socket.leave(`chat:${data.chatId}`);
      logger.debug(`Socket ${socket.id} unsubscribed from chat:${data.chatId}`);
    }
  });
});

// Set up broadcast function for event handlers
setBroadcastFunction((event, data) => {
  io.emit(event, data);
});

// Graceful shutdown
function gracefulShutdown(signal) {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      const { destroyClient } = require("./src/config/whatsapp");
      await destroyClient();
      logger.info("WhatsApp client destroyed");
    } catch (err) {
      logger.error("Error destroying WhatsApp client:", err.message);
    }

    try {
      const { disconnectDB } = require("./src/config/database");
      await disconnectDB();
      logger.info("Database disconnected");
    } catch (err) {
      logger.error("Error disconnecting database:", err.message);
    }

    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled rejection handling
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", reason?.stack || reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error?.stack || error?.message || error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Start server
async function start() {
  try {
    // Connect to MongoDB
    logger.info("🔄 Connecting to MongoDB...");
    await connectDB();

    // Start HTTP server
    server.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
      logger.info(`📡 WebSocket server ready`);
      logger.info(`📊 Dashboard: http://localhost:${PORT}`);
      logger.info(`📚 API: http://localhost:${PORT}/api`);
    });

    // Initialize WhatsApp client (non-blocking)
    logger.info("📱 Initializing WhatsApp client...");
    initializeClient().catch((err) => {
      logger.error("Failed to initialize WhatsApp client:", err.message);
    });
  } catch (error) {
    logger.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();
