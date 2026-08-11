import config from '../config/index.js';

const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With';
const MAX_AGE_SECONDS = '86400';

/**
 * Middleware factory that applies CORS headers and answers preflight requests.
 *
 * The allowed origin list comes from config; a matching request origin is
 * echoed back, otherwise the first configured origin (or `*`) is used.
 *
 * @returns {Function} Express-style middleware `(req, res, next)`.
 */
export function cors() {
  const allowedOrigins = config.cors.origin.split(',').map((origin) => origin.trim());

  return (req, res, next) => {
    const requestOrigin = req.headers.origin;

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    } else if (allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (requestOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', MAX_AGE_SECONDS);

    // Short-circuit preflight requests without invoking the rest of the chain.
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    next();
  };
}