/**
 * Helper Utilities
 * Common functions used throughout the application
 */

/**
 * Normalize phone number to WhatsApp format
 * @param {string} phoneNumber
 * @returns {string}
 */
function normalizePhoneNumber(phoneNumber) {
  // Remove all non-numeric characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Remove leading + if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Ensure it ends with @c.us for individual chats
  if (!cleaned.includes("@")) {
    cleaned = `${cleaned}@c.us`;
  }

  return cleaned;
}

/**
 * Normalize group ID
 * @param {string} groupId
 * @returns {string}
 */
function normalizeGroupId(groupId) {
  if (!groupId.includes("@")) {
    return `${groupId}@g.us`;
  }
  return groupId;
}

/**
 * Check if ID is a group ID
 * @param {string} id
 * @returns {boolean}
 */
function isGroupId(id) {
  return id?.endsWith("@g.us") || false;
}

/**
 * Check if ID is a contact ID
 * @param {string} id
 * @returns {boolean}
 */
function isContactId(id) {
  return id?.endsWith("@c.us") || false;
}

/**
 * Extract phone number from WhatsApp ID
 * @param {string} id
 * @returns {string}
 */
function extractPhoneNumber(id) {
  return id?.split("@")[0] || id;
}

/**
 * Delay execution for specified milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delayMs = baseDelay * Math.pow(2, i);
      await delay(delayMs);
    }
  }

  throw lastError;
}

/**
 * Truncate string to specified length
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(str, maxLength = 100) {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

/**
 * Format date to human-readable string
 * @param {Date|number} date
 * @returns {string}
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|number} date
 * @returns {string}
 */
function formatRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = now - d;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

/**
 * Generate unique ID
 * @param {string} prefix
 * @returns {string}
 */
function generateId(prefix = "") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array
 * @param {number} size
 * @returns {Array[]}
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Safely parse JSON
 * @param {string} str
 * @param {any} defaultValue
 * @returns {any}
 */
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

/**
 * Check if a number is registered on WhatsApp
 * @param {Client} client
 * @param {string} phoneNumber
 * @returns {Promise<boolean>}
 */
async function isRegisteredOnWhatsApp(client, phoneNumber) {
  try {
    const normalized = normalizePhoneNumber(phoneNumber);
    const numberId = await client.getNumberId(extracted(normalized));
    return numberId !== null;
  } catch {
    return false;
  }
}

/**
 * Escape special characters for regex
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Deep clone an object
 * @param {any} obj
 * @returns {any}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Omit specified keys from object
 * @param {Object} obj
 * @param {string[]} keys
 * @returns {Object}
 */
function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Pick only specified keys from object
 * @param {Object} obj
 * @param {string[]} keys
 * @returns {Object}
 */
function pick(obj, keys) {
  const result = {};
  keys.forEach((key) => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
}

module.exports = {
  normalizePhoneNumber,
  normalizeGroupId,
  isGroupId,
  isContactId,
  extractPhoneNumber,
  delay,
  retryWithBackoff,
  truncate,
  formatDate,
  formatRelativeTime,
  generateId,
  chunkArray,
  safeJsonParse,
  isRegisteredOnWhatsApp,
  escapeRegex,
  deepClone,
  omit,
  pick,
};
