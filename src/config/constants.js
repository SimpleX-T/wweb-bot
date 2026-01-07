/**
 * Application Constants and Enums
 * Centralized configuration for consistent values across the application
 */

// Message Types supported by WhatsApp
const MESSAGE_TYPES = Object.freeze({
  TEXT: "chat",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  PTT: "ptt", // Push-to-talk (voice message)
  DOCUMENT: "document",
  STICKER: "sticker",
  LOCATION: "location",
  VCARD: "vcard",
  MULTI_VCARD: "multi_vcard",
  REVOKED: "revoked",
  ORDER: "order",
  PRODUCT: "product",
  PAYMENT: "payment",
  UNKNOWN: "unknown",
  GROUP_INVITE: "groups_v4_invite",
  LIST: "list",
  LIST_RESPONSE: "list_response",
  BUTTONS_RESPONSE: "buttons_response",
  BROADCAST_NOTIFICATION: "broadcast_notification",
  CALL_LOG: "call_log",
  CIPHERTEXT: "ciphertext",
  DEBUG: "debug",
  E2E_NOTIFICATION: "e2e_notification",
  GP2: "gp2",
  GROUP_NOTIFICATION: "notification",
  HSM: "hsm",
  INTERACTIVE: "interactive",
  NATIVE_FLOW: "native_flow",
  NOTIFICATION_TEMPLATE: "notification_template",
  OVERSIZED: "oversized",
  PROTOCOL: "protocol",
  REACTION: "reaction",
  TEMPLATE_BUTTON_REPLY: "template_button_reply",
  POLL_CREATION: "poll_creation",
});

// Group action types
const GROUP_ACTIONS = Object.freeze({
  ADD_PARTICIPANT: "add",
  REMOVE_PARTICIPANT: "remove",
  PROMOTE_ADMIN: "promote",
  DEMOTE_ADMIN: "demote",
  LEAVE: "leave",
  CHANGE_SUBJECT: "subject",
  CHANGE_DESCRIPTION: "description",
  CHANGE_PICTURE: "picture",
  CHANGE_SETTINGS: "settings",
});

// Auto message types
const AUTO_MESSAGE_TYPES = Object.freeze({
  WELCOME: "welcome",
  FAREWELL: "farewell",
  RULES: "rules",
  ANNOUNCEMENT: "announcement",
});

// Client connection states
const CLIENT_STATUS = Object.freeze({
  INITIALIZING: "initializing",
  QR_READY: "qr_ready",
  AUTHENTICATED: "authenticated",
  READY: "ready",
  DISCONNECTED: "disconnected",
  FAILED: "failed",
});

// Chat types
const CHAT_TYPES = Object.freeze({
  PRIVATE: "private",
  GROUP: "group",
  CHANNEL: "channel",
  BROADCAST: "broadcast",
});

// Message acknowledgement states
const MESSAGE_ACK = Object.freeze({
  ERROR: -1,
  PENDING: 0,
  SENT: 1,
  RECEIVED: 2,
  READ: 3,
  PLAYED: 4,
});

// WebSocket event types for real-time updates
const WS_EVENTS = Object.freeze({
  // Connection events
  CLIENT_READY: "client:ready",
  CLIENT_QR: "client:qr",
  CLIENT_AUTHENTICATED: "client:authenticated",
  CLIENT_DISCONNECTED: "client:disconnected",
  CLIENT_STATUS: "client:status",

  // Message events
  MESSAGE_NEW: "message:new",
  MESSAGE_ACK: "message:ack",
  MESSAGE_REVOKED: "message:revoked",
  MESSAGE_EDIT: "message:edit",
  MESSAGE_REACTION: "message:reaction",

  // Group events
  GROUP_JOIN: "group:join",
  GROUP_LEAVE: "group:leave",
  GROUP_UPDATE: "group:update",
  GROUP_ADMIN_CHANGED: "group:admin_changed",
  GROUP_MEMBERSHIP_REQUEST: "group:membership_request",

  // Chat events
  CHAT_UPDATE: "chat:update",
  CHAT_ARCHIVED: "chat:archived",
  CHAT_REMOVED: "chat:removed",

  // Contact events
  CONTACT_CHANGED: "contact:changed",

  // Watchlist events
  WATCHLIST_UPDATE: "watchlist:update",
  WATCHLIST_MESSAGE: "watchlist:message",
});

// API response status codes
const RESPONSE_STATUS = Object.freeze({
  SUCCESS: "success",
  ERROR: "error",
  PENDING: "pending",
  NOT_FOUND: "not_found",
  UNAUTHORIZED: "unauthorized",
  RATE_LIMITED: "rate_limited",
});

// Default configurations
const DEFAULTS = Object.freeze({
  BACKUP_SYNC_INTERVAL: 300000, // 5 minutes
  MESSAGE_FETCH_LIMIT: 50,
  CHAT_FETCH_LIMIT: 50,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,
  SESSION_TIMEOUT: 86400000, // 24 hours
});

// Error messages
const ERROR_MESSAGES = Object.freeze({
  CLIENT_NOT_READY: "WhatsApp client is not ready",
  CHAT_NOT_FOUND: "Chat not found",
  GROUP_NOT_FOUND: "Group not found",
  CONTACT_NOT_FOUND: "Contact not found",
  MESSAGE_NOT_FOUND: "Message not found",
  INVALID_PHONE_NUMBER: "Invalid phone number format",
  NOT_A_GROUP: "This chat is not a group",
  PERMISSION_DENIED: "You do not have permission to perform this action",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later.",
  MONGODB_CONNECTION_FAILED: "Failed to connect to MongoDB",
  SESSION_EXPIRED: "Session expired. Please authenticate again.",
  WATCHLIST_ALREADY_EXISTS: "Chat is already in watchlist",
  WATCHLIST_NOT_FOUND: "Chat not found in watchlist",
});

module.exports = {
  MESSAGE_TYPES,
  GROUP_ACTIONS,
  AUTO_MESSAGE_TYPES,
  CLIENT_STATUS,
  CHAT_TYPES,
  MESSAGE_ACK,
  WS_EVENTS,
  RESPONSE_STATUS,
  DEFAULTS,
  ERROR_MESSAGES,
};
