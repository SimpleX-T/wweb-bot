/**
 * Middlewares Index
 */

const {
  ApiError,
  notFound,
  errorHandler,
  asyncHandler,
} = require("./error.middleware");
const validator = require("./validator.middleware");

module.exports = {
  ApiError,
  notFound,
  errorHandler,
  asyncHandler,
  ...validator,
};
