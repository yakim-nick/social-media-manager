import { ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware factory that validates `req.body` against a Zod schema.
 *
 * On success the parsed (and possibly coerced) value replaces `req.body`.
 * On failure a ValidationError carrying per-field details is forwarded.
 *
 * @param {import('zod').ZodType} schema - Zod schema describing the expected body.
 * @returns {Function} Express-style middleware `(req, res, next)`.
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      const validatedBody = schema.parse(req.body);
      req.body = validatedBody;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new ValidationError('Validation failed', formatZodErrors(err)));
      }
      next(err);
    }
  };
}

/**
 * Flatten a ZodError into a list of per-field error descriptors.
 *
 * @param {import('zod').ZodError} zodError - Error raised by schema parsing.
 * @returns {Array<{path: string, message: string, code: string}>} Field errors.
 */
function formatZodErrors(zodError) {
  return zodError.errors.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}