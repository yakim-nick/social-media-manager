import { AppError } from '../utils/errors.js';
import config from '../config/index.js';

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
