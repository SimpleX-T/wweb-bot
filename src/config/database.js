/**
 * MongoDB Database Configuration
 * Handles database connection with retry logic and graceful shutdown
 */

const mongoose = require("mongoose");
const logger = require("../utils/logger");

// Database configuration
const config = {
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/whatsapp-bot",
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
  },
};

// Connection state tracker
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;

/**
 * Connect to MongoDB with retry logic
 * @returns {Promise<mongoose.Connection>}
 */
async function connectDB() {
  if (isConnected) {
    logger.info("📦 Using existing MongoDB connection");
    return mongoose.connection;
  }

  try {
    logger.info("🔄 Connecting to MongoDB...");

    await mongoose.connect(config.uri, config.options);

    isConnected = true;
    connectionRetries = 0;
    logger.info("✅ MongoDB connected successfully");

    return mongoose.connection;
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error.message}`);

    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      logger.info(
        `🔄 Retrying connection (${connectionRetries}/${MAX_RETRIES}) in ${
          RETRY_INTERVAL / 1000
        }s...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      return connectDB();
    }

    throw error;
  }
}

/**
 * Disconnect from MongoDB gracefully
 */
async function disconnectDB() {
  if (!isConnected) {
    logger.info("📦 No active MongoDB connection to close");
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info("✅ MongoDB disconnected successfully");
  } catch (error) {
    logger.error(`❌ Error disconnecting from MongoDB: ${error.message}`);
    throw error;
  }
}

/**
 * Get current connection status
 * @returns {Object} Connection status details
 */
function getConnectionStatus() {
  return {
    isConnected,
    state: mongoose.connection.readyState,
    stateText: ["disconnected", "connected", "connecting", "disconnecting"][
      mongoose.connection.readyState
    ],
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}

// MongoDB connection event handlers
mongoose.connection.on("connected", () => {
  isConnected = true;
  logger.info("📦 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  isConnected = false;
  logger.error(`📦 Mongoose connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  logger.info("📦 Mongoose disconnected from MongoDB");
});

// Graceful shutdown handlers
process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  mongoose,
};
