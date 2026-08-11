import { AppError } from '../utils/errors.js';
import config from '../config/index.js';

/**
 * Final error handler for the request pipeline.
 *
 * AppErrors are serialized with their structured code/details. Unknown errors
 * are logged; in development the raw message is exposed, while production
 * returns a generic message to avoid leaking internals.
 *
 * @param {Error} err - Error raised anywhere in the request pipeline.
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 * @param {Function} _next - Next handler (unused; this is the terminal handler).
 */
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    res.error(err.code, err.message, err.statusCode, err.details);
  } else {
    console.error(`[ERROR] ${err.stack || err.message}`);

    if (config.env === 'development') {
      res.error('INTERNAL_ERROR', err.message || 'Internal server error', 500);
    } else {
      res.error('INTERNAL_ERROR', 'Internal server error', 500);
    }
  }
}