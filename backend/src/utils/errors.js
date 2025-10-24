// ============================================
// backend/src/utils/errors.js
// ============================================
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors = null) {
    super(400, message, errors);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

module.exports = {
  ApiError,
  NotFoundError,
  ValidationError,
  UnauthorizedError
};
