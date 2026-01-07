/**
 * Error Handling Middleware
 * Centralized error handling for Express
 */

const logger = require("../utils/logger");
const { formatErrorResponse } = require("../utils/formatters");
const { ERROR_MESSAGES } = require("../config/constants");

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, code = "ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found handler
 */
function notFound(req, res, next) {
  const error = new ApiError(
    `Route ${req.originalUrl} not found`,
    404,
    "NOT_FOUND"
  );
  next(error);
}

/**
 * Main error handler
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = "Invalid ID format";
  }

  if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_KEY";
    message = "Duplicate entry";
  }

  // Handle WhatsApp client errors
  if (message.includes(ERROR_MESSAGES.CLIENT_NOT_READY)) {
    statusCode = 503;
    code = "SERVICE_UNAVAILABLE";
  }

  // Log error
  logger.error(`${code}: ${message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Send response
  res
    .status(statusCode)
    .json(
      formatErrorResponse(
        message,
        code,
        process.env.NODE_ENV === "development" ? err.stack : undefined
      )
    );
}

/**
 * Async handler wrapper to catch async errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  notFound,
  errorHandler,
  asyncHandler,
};
