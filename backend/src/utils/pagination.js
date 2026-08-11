import { PAGINATION_DEFAULTS } from '../config/constants.js';

/**
 * Parse pagination query parameters into validated page/limit/skip values.
 *
 * Falls back to configured defaults when a parameter is missing or invalid,
 * and caps the limit at the configured maximum to prevent excessive result sets.
 *
 * @param {object} query - Express-style query object (e.g. `req.query`).
 * @returns {{ page: number, limit: number, skip: number }} Pagination values.
 */
export function parsePagination(query) {
  const page = parseInt(query.page, 10) || PAGINATION_DEFAULTS.page;
  const limit = Math.min(
    parseInt(query.limit, 10) || PAGINATION_DEFAULTS.limit,
    PAGINATION_DEFAULTS.maxLimit
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}