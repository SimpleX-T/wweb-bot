/**
 * Validation Middleware
 * Input validation for API endpoints
 */

const { ApiError } = require("./error.middleware");

/**
 * Validate required fields in request body
 */
function validateBody(requiredFields) {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      return next(
        new ApiError(
          `Missing required fields: ${missing.join(", ")}`,
          400,
          "VALIDATION_ERROR"
        )
      );
    }

    next();
  };
}

/**
 * Validate required query parameters
 */
function validateQuery(requiredParams) {
  return (req, res, next) => {
    const missing = requiredParams.filter((param) => !req.query[param]);

    if (missing.length > 0) {
      return next(
        new ApiError(
          `Missing required query parameters: ${missing.join(", ")}`,
          400,
          "VALIDATION_ERROR"
        )
      );
    }

    next();
  };
}

/**
 * Validate chat ID format
 */
function validateChatId(req, res, next) {
  const chatId = req.params.chatId || req.params.id || req.body.chatId;

  if (!chatId) {
    return next(new ApiError("Chat ID is required", 400, "VALIDATION_ERROR"));
  }

  // Basic validation for WhatsApp ID format
  const isValidFormat =
    /^[\d]+@(c\.us|g\.us|broadcast|newsletter)$/.test(chatId) ||
    /^[\d]+$/.test(chatId);

  if (!isValidFormat) {
    return next(
      new ApiError("Invalid chat ID format", 400, "VALIDATION_ERROR")
    );
  }

  next();
}

/**
 * Validate phone number format
 */
function validatePhoneNumber(req, res, next) {
  const phoneNumber = req.body.phoneNumber || req.params.phoneNumber;

  if (!phoneNumber) {
    return next(
      new ApiError("Phone number is required", 400, "VALIDATION_ERROR")
    );
  }

  // Remove all non-numeric characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Basic validation
  if (cleaned.length < 10 || cleaned.length > 15) {
    return next(
      new ApiError("Invalid phone number format", 400, "VALIDATION_ERROR")
    );
  }

  next();
}

/**
 * Validate message content
 */
function validateMessage(req, res, next) {
  const { content, type } = req.body;

  if (!content && type !== "location" && type !== "poll") {
    return next(
      new ApiError("Message content is required", 400, "VALIDATION_ERROR")
    );
  }

  next();
}

/**
 * Validate participant IDs array
 */
function validateParticipants(req, res, next) {
  const { participants } = req.body;

  if (!participants) {
    return next(
      new ApiError("Participants array is required", 400, "VALIDATION_ERROR")
    );
  }

  if (!Array.isArray(participants)) {
    return next(
      new ApiError("Participants must be an array", 400, "VALIDATION_ERROR")
    );
  }

  if (participants.length === 0) {
    return next(
      new ApiError(
        "At least one participant is required",
        400,
        "VALIDATION_ERROR"
      )
    );
  }

  next();
}

/**
 * Validate auto-message configuration
 */
function validateAutoMessage(req, res, next) {
  const { type, message, enabled } = req.body;
  const validTypes = ["welcome", "farewell", "rules"];

  if (type && !validTypes.includes(type)) {
    return next(
      new ApiError(
        `Invalid auto-message type. Must be one of: ${validTypes.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      )
    );
  }

  if (enabled === true && (!message || message.trim() === "")) {
    return next(
      new ApiError(
        "Message content is required when enabling auto-message",
        400,
        "VALIDATION_ERROR"
      )
    );
  }

  next();
}

/**
 * Validate media data
 */
function validateMedia(req, res, next) {
  const { url, path, base64, mimetype } = req.body;

  if (!url && !path && !base64) {
    return next(
      new ApiError(
        "Media source is required. Provide url, path, or base64 data.",
        400,
        "VALIDATION_ERROR"
      )
    );
  }

  if (base64 && !mimetype) {
    return next(
      new ApiError(
        "Mimetype is required when sending base64 media",
        400,
        "VALIDATION_ERROR"
      )
    );
  }

  next();
}

/**
 * Validate poll data
 */
function validatePoll(req, res, next) {
  const { question, options } = req.body;

  if (!question || question.trim() === "") {
    return next(
      new ApiError("Poll question is required", 400, "VALIDATION_ERROR")
    );
  }

  if (!options || !Array.isArray(options)) {
    return next(
      new ApiError("Poll options must be an array", 400, "VALIDATION_ERROR")
    );
  }

  if (options.length < 2) {
    return next(
      new ApiError("Poll must have at least 2 options", 400, "VALIDATION_ERROR")
    );
  }

  if (options.length > 12) {
    return next(
      new ApiError("Poll can have at most 12 options", 400, "VALIDATION_ERROR")
    );
  }

  next();
}

/**
 * Sanitize input strings
 */
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === "string") {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);

  next();
}

module.exports = {
  validateBody,
  validateQuery,
  validateChatId,
  validatePhoneNumber,
  validateMessage,
  validateParticipants,
  validateAutoMessage,
  validateMedia,
  validatePoll,
  sanitizeInput,
};
