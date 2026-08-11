/**
 * Compose an array of middleware into a single chain.
 *
 * Middleware are invoked in order; each calls `next()` to continue.
 * A middleware with arity 4 is treated as an error handler: it is skipped
 * during normal flow and only invoked when an error propagates. Errors that
 * reach the end of the chain are forwarded to the `done` callback.
 *
 * @param {Function[]} middlewares - Middleware functions `(req, res, next)`.
 * @returns {Function} Composed middleware `(req, res, done)`.
 */
export function compose(middlewares) {
  return (req, res, done) => {
    let index = 0;

    function next(err) {
      if (err) {
        const errorMiddleware = middlewares.slice(index).find((m) => m.length === 4);
        if (errorMiddleware) {
          errorMiddleware(err, req, res, next);
        } else if (done) {
          done(err);
        }
        return;
      }

      const middleware = middlewares[index++];
      if (!middleware) {
        if (done) done();
        return;
      }

      // Skip error handlers (arity 4) during the normal flow.
      if (middleware.length === 4) {
        next();
        return;
      }

      try {
        middleware(req, res, next);
      } catch (caughtError) {
        next(caughtError);
      }
    }

    next();
  };
}