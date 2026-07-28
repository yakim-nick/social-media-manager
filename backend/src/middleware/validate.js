import { ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        return next(new ValidationError('Validation failed', details));
      }
      next(err);
    }
  };
}
