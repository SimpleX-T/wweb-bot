/**
 * Logger Utility
 * Structured logging with levels and formatting
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Current log level from environment or default to INFO
const currentLevel =
  LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * Format timestamp for logs
 * @returns {string}
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString();
}

/**
 * Format log message with metadata
 * @param {string} level
 * @param {string} message
 * @param {Object} meta
 * @returns {string}
 */
function formatMessage(level, message, meta = {}) {
  const timestamp = getTimestamp();
  const metaStr =
    Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

/**
 * Log error message
 * @param {string} message
 * @param {Object} meta
 */
function error(message, meta = {}) {
  if (currentLevel >= LOG_LEVELS.ERROR) {
    console.error(
      `${colors.red}${formatMessage("ERROR", message, meta)}${colors.reset}`
    );
  }
}

/**
 * Log warning message
 * @param {string} message
 * @param {Object} meta
 */
function warn(message, meta = {}) {
  if (currentLevel >= LOG_LEVELS.WARN) {
    console.warn(
      `${colors.yellow}${formatMessage("WARN", message, meta)}${colors.reset}`
    );
  }
}

/**
 * Log info message
 * @param {string} message
 * @param {Object} meta
 */
function info(message, meta = {}) {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.log(
      `${colors.cyan}${formatMessage("INFO", message, meta)}${colors.reset}`
    );
  }
}

/**
 * Log debug message
 * @param {string} message
 * @param {Object} meta
 */
function debug(message, meta = {}) {
  if (currentLevel >= LOG_LEVELS.DEBUG) {
    console.log(
      `${colors.dim}${formatMessage("DEBUG", message, meta)}${colors.reset}`
    );
  }
}

/**
 * Log success message (special info)
 * @param {string} message
 * @param {Object} meta
 */
function success(message, meta = {}) {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.log(
      `${colors.green}${formatMessage("SUCCESS", message, meta)}${colors.reset}`
    );
  }
}

/**
 * Create a child logger with prefix
 * @param {string} prefix
 * @returns {Object}
 */
function createChild(prefix) {
  return {
    error: (msg, meta) => error(`[${prefix}] ${msg}`, meta),
    warn: (msg, meta) => warn(`[${prefix}] ${msg}`, meta),
    info: (msg, meta) => info(`[${prefix}] ${msg}`, meta),
    debug: (msg, meta) => debug(`[${prefix}] ${msg}`, meta),
    success: (msg, meta) => success(`[${prefix}] ${msg}`, meta),
  };
}

module.exports = {
  error,
  warn,
  info,
  debug,
  success,
  createChild,
  LOG_LEVELS,
};
