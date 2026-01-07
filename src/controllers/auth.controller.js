/**
 * Auth Controller
 * Handles WhatsApp authentication and session management
 */

const { whatsappService } = require("../services");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/formatters");
const { asyncHandler, ApiError } = require("../middlewares");
const { Session } = require("../models");
const { getCurrentQR, getClientStatus } = require("../config/whatsapp");
const QRCode = require("qrcode");

/**
 * Initialize WhatsApp client
 * POST /api/auth/initialize
 */
const initialize = asyncHandler(async (req, res) => {
  await whatsappService.initialize();

  res.json(
    formatSuccessResponse(
      { status: getClientStatus() },
      "WhatsApp client initialization started"
    )
  );
});

/**
 * Get current QR code
 * GET /api/auth/qr
 */
const getQR = asyncHandler(async (req, res) => {
  const qr = getCurrentQR();

  if (!qr) {
    const status = getClientStatus();

    if (status === "ready") {
      throw new ApiError(
        "Already authenticated, no QR code needed",
        400,
        "ALREADY_AUTHENTICATED"
      );
    }

    return res.json(
      formatSuccessResponse(
        { qr: null, status },
        "No QR code available. Client may be initializing or already authenticated."
      )
    );
  }

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(qr, {
    width: 256,
    margin: 2,
    color: {
      dark: "#25D366",
      light: "#FFFFFF",
    },
  });

  res.json(
    formatSuccessResponse(
      {
        qr: qrDataUrl,
        qrRaw: qr,
        status: getClientStatus(),
      },
      "QR code generated"
    )
  );
});

/**
 * Get current connection status
 * GET /api/auth/status
 */
const getStatus = asyncHandler(async (req, res) => {
  const statusData = whatsappService.getStatus();

  // Get session from database
  const session = await Session.findOne({ sessionId: "default" });

  res.json(
    formatSuccessResponse(
      {
        ...statusData,
        session: session
          ? {
              phoneNumber: session.phoneNumber,
              pushname: session.pushname,
              lastActive: session.lastActive,
              connectionsCount: session.connectionsCount,
            }
          : null,
      },
      "Status retrieved"
    )
  );
});

/**
 * Get client info (when connected)
 * GET /api/auth/info
 */
const getInfo = asyncHandler(async (req, res) => {
  const info = await whatsappService.getClientInfo();

  res.json(formatSuccessResponse(info, "Client info retrieved"));
});

/**
 * Logout from WhatsApp
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  await whatsappService.logout();

  // Update session
  await Session.findOneAndUpdate(
    { sessionId: "default" },
    { authenticated: false, status: "disconnected" }
  );

  res.json(formatSuccessResponse(null, "Logged out successfully"));
});

/**
 * Clear session data and force new QR code
 * POST /api/auth/clear-session
 */
const clearSession = asyncHandler(async (req, res) => {
  const { destroyClient } = require("../config/whatsapp");
  const mongoose = require("mongoose");

  // Destroy current client
  try {
    await destroyClient();
  } catch (err) {
    // Ignore errors during destroy
  }

  // Delete RemoteAuth session from MongoDB
  try {
    await mongoose.connection.collection("whatsapp-RemoteAuth-default").drop();
  } catch (err) {
    // Collection might not exist
  }

  // Clear session in database
  await Session.findOneAndUpdate(
    { sessionId: "default" },
    {
      authenticated: false,
      status: "disconnected",
      phoneNumber: null,
      pushname: null,
    }
  );

  res.json(
    formatSuccessResponse(
      null,
      "Session cleared. Please restart the server and scan QR code."
    )
  );
});

module.exports = {
  initialize,
  getQR,
  getStatus,
  getInfo,
  logout,
  clearSession,
};
