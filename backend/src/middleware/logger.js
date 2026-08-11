const isDevelopment = process.env.NODE_ENV !== 'production';

const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

/**
 * Pick an ANSI color for a status code: green for 2xx, cyan for 3xx,
 * yellow for 4xx, red for 5xx.
 *
 * @param {number} status - HTTP status code.
 * @returns {string} ANSI color escape sequence.
 */
function statusColor(status) {
  if (status < 300) return COLORS.green;
  if (status < 400) return COLORS.cyan;
  if (status < 500) return COLORS.yellow;
  return COLORS.red;
}

/**
 * Middleware factory that logs one line per completed request.
 *
 * In development the log is colorized and timestamped; in production a
 * plain single-line format is used.
 *
 * @returns {Function} Express-style middleware `(req, res, next)`.
 */
export function logger() {
  return (req, res, next) => {
    const startTime = Date.now();

    res.once('finish', () => {
      const durationMs = Date.now() - startTime;
      const status = res.statusCode;

      if (isDevelopment) {
        const color = statusColor(status);
        console.log(
          `${COLORS.dim}[${new Date().toISOString()}]${COLORS.reset} ` +
          `${COLORS.cyan}${req.method}${COLORS.reset} ` +
          `${req.path} ` +
          `${color}${status}${COLORS.reset} ` +
          `${COLORS.dim}${durationMs}ms${COLORS.reset}`
        );
      } else {
        console.log(`${req.method} ${req.path} ${status} ${durationMs}ms`);
      }
    });

    next();
  };
}