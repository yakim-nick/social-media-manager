import config from '../config/index.js';

const CLEANUP_INTERVAL_MS = 60000;

/**
 * In-memory request counter keyed by client IP.
 * @type {Map<string, {start: number, count: number}>}
 */
const clientHits = new Map();

// Periodically drop expired windows so the map does not grow unbounded.
setInterval(cleanupExpiredWindows, CLEANUP_INTERVAL_MS).unref();

/**
 * Middleware factory that enforces a per-IP request rate limit.
 *
 * Each client gets a sliding window starting at their first request; once the
 * window is exceeded, further requests are rejected with 429. Rate-limit
 * headers are set on every response.
 *
 * @returns {Function} Express-style middleware `(req, res, next)`.
 */
export function rateLimiter() {
  return (req, res, next) => {
    const clientIp = getClientIp(req);
    const now = Date.now();

    let clientEntry = clientHits.get(clientIp);
    if (!clientEntry || now - clientEntry.start > config.rateLimit.windowMs) {
      clientEntry = { start: now, count: 0 };
      clientHits.set(clientIp, clientEntry);
    }

    clientEntry.count += 1;

    res.setHeader('X-RateLimit-Limit', config.rateLimit.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.rateLimit.max - clientEntry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((clientEntry.start + config.rateLimit.windowMs) / 1000));

    if (clientEntry.count > config.rateLimit.max) {
      res.error('RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later', 429);
      return;
    }

    next();
  };
}

/**
 * Determine the client IP, honoring the `X-Forwarded-For` header when present.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @returns {string} The client IP, or 'unknown' when it cannot be determined.
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || 'unknown';
}

/**
 * Remove rate-limit entries whose window has already elapsed.
 */
function cleanupExpiredWindows() {
  const now = Date.now();
  for (const [key, entry] of clientHits) {
    if (now - entry.start > config.rateLimit.windowMs) {
      clientHits.delete(key);
    }
  }
}