/**
 * Base class for all application errors.
 *
 * Carries an HTTP status code plus a machine-readable error code and
 * optional structured details for the API response.
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code.
   * @param {string} code - Machine-readable error code.
   * @param {string} message - Human-readable error message.
   * @param {*} [details] - Optional structured error details.
   */
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Error for missing resources (HTTP 404). */
export class NotFoundError extends AppError {
  /**
   * @param {string} [message='Resource not found'] - Error message.
   * @param {*} [details] - Optional structured error details.
   */
  constructor(message = 'Resource not found', details) {
    super(404, 'NOT_FOUND', message, details);
    this.name = 'NotFoundError';
  }
}

/** Error for invalid request input (HTTP 400). */
export class ValidationError extends AppError {
  /**
   * @param {string} [message='Validation failed'] - Error message.
   * @param {*} [details] - Optional structured error details.
   */
  constructor(message = 'Validation failed', details) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

/** Error for missing or invalid authentication (HTTP 401). */
export class UnauthorizedError extends AppError {
  /**
   * @param {string} [message='Unauthorized'] - Error message.
   */
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

/** Error for authenticated users lacking permission (HTTP 403). */
export class ForbiddenError extends AppError {
  /**
   * @param {string} [message='Forbidden'] - Error message.
   */
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}