/**
 * Wrap an async route handler so rejected promises are forwarded to the
 * error-handling middleware instead of crashing the process.
 *
 * @param {Function} handler - Async handler `(req, res, next)`.
 * @returns {Function} Express-style middleware `(req, res, next)`.
 */
export default function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}