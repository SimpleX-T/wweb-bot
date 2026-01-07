/**
 * WhatsApp Client Configuration
 * Centralized configuration for the WhatsApp Web.js client
 */

const { Client, LocalAuth } = require("whatsapp-web.js");
const logger = require("../utils/logger");
const { CLIENT_STATUS, DEFAULTS } = require("./constants");

// Client instance (singleton)
let client = null;
let clientStatus = CLIENT_STATUS.DISCONNECTED;
let currentQR = null;

// Event emitter for broadcasting client events
const EventEmitter = require("events");
const clientEvents = new EventEmitter();

/**
 * Get Puppeteer configuration based on environment
 */
function getPuppeteerConfig() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      ...(isProduction ? ["--single-process"] : []),
    ],
    ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    }),
  };
}

/**
 * Initialize the WhatsApp client with RemoteAuth
 * @returns {Promise<Client>}
 */
async function initializeClient() {
  if (client && clientStatus === CLIENT_STATUS.READY) {
    logger.info("📱 Using existing WhatsApp client");
    return client;
  }

  // Start initialization in background
  initializeAsync().catch((error) => {
    logger.error(`❌ Failed to initialize WhatsApp client: ${error.message}`);
    clientStatus = CLIENT_STATUS.FAILED;
    clientEvents.emit("status", clientStatus);
  });

  return null;
}

/**
 * Actual initialization (runs in background)
 */
async function initializeAsync() {
  logger.info("📱 Initializing WhatsApp client...");
  clientStatus = CLIENT_STATUS.INITIALIZING;
  clientEvents.emit("status", clientStatus);

  // Create client with LocalAuth strategy (stores session in .wwebjs_auth folder)
  logger.info("📱 Creating WhatsApp client with LocalAuth...");
  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "default",
      dataPath: "./.wwebjs_auth",
    }),
    puppeteer: getPuppeteerConfig(),
  });

  // Attach event listeners
  attachEventListeners(client);

  // Initialize the client
  logger.info("📱 Starting client initialization (this may take a while)...");
  await client.initialize();

  logger.info("📱 Client initialization completed");
  return client;
}

/**
 * Attach all event listeners to the client
 * @param {Client} client
 */
function attachEventListeners(client) {
  // QR Code event
  client.on("qr", (qr) => {
    currentQR = qr;
    clientStatus = CLIENT_STATUS.QR_READY;
    logger.info("📱 QR Code received");
    clientEvents.emit("qr", qr);
    clientEvents.emit("status", clientStatus);
  });

  // Authenticated event
  client.on("authenticated", () => {
    currentQR = null;
    clientStatus = CLIENT_STATUS.AUTHENTICATED;
    logger.info("✅ WhatsApp client authenticated");
    clientEvents.emit("authenticated");
    clientEvents.emit("status", clientStatus);
  });

  // Ready event
  client.on("ready", () => {
    clientStatus = CLIENT_STATUS.READY;
    logger.info("✅ WhatsApp client is ready");
    clientEvents.emit("ready", client.info);
    clientEvents.emit("status", clientStatus);
  });

  // Disconnected event
  client.on("disconnected", (reason) => {
    clientStatus = CLIENT_STATUS.DISCONNECTED;
    currentQR = null;
    logger.warn(`📱 WhatsApp client disconnected: ${reason}`);
    clientEvents.emit("disconnected", reason);
    clientEvents.emit("status", clientStatus);
  });

  // Remote session saved
  client.on("remote_session_saved", () => {
    logger.info("💾 Remote session saved to MongoDB");
    clientEvents.emit("session_saved");
  });

  // Authentication failure
  client.on("auth_failure", (msg) => {
    clientStatus = CLIENT_STATUS.FAILED;
    logger.error(`❌ Authentication failed: ${msg}`);
    clientEvents.emit("auth_failure", msg);
    clientEvents.emit("status", clientStatus);
  });

  // Loading screen progress
  client.on("loading_screen", (percent, message) => {
    logger.info(`📱 Loading: ${percent}% - ${message}`);
    clientEvents.emit("loading", { percent, message });
  });

  // State change
  client.on("change_state", (state) => {
    logger.info(`📱 Client state changed: ${state}`);
    clientEvents.emit("state_change", state);
  });
}

/**
 * Get the current WhatsApp client instance
 * @returns {Client|null}
 */
function getClient() {
  return client;
}

/**
 * Get current client status
 * @returns {string}
 */
function getClientStatus() {
  return clientStatus;
}

/**
 * Get current QR code
 * @returns {string|null}
 */
function getCurrentQR() {
  return currentQR;
}

/**
 * Check if client is ready
 * @returns {boolean}
 */
function isClientReady() {
  return client && clientStatus === CLIENT_STATUS.READY;
}

/**
 * Destroy the client and cleanup
 */
async function destroyClient() {
  if (client) {
    try {
      await client.destroy();
      client = null;
      clientStatus = CLIENT_STATUS.DISCONNECTED;
      currentQR = null;
      logger.info("📱 WhatsApp client destroyed");
    } catch (error) {
      logger.error(`❌ Error destroying client: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Logout and clear session
 */
async function logoutClient() {
  if (client) {
    try {
      await client.logout();
      clientStatus = CLIENT_STATUS.DISCONNECTED;
      currentQR = null;
      logger.info("📱 WhatsApp client logged out");
    } catch (error) {
      logger.error(`❌ Error logging out: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  initializeClient,
  getClient,
  getClientStatus,
  getCurrentQR,
  isClientReady,
  destroyClient,
  logoutClient,
  clientEvents,
};
