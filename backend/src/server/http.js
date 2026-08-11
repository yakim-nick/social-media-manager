import http from 'node:http';
import { URLSearchParams } from 'node:url';
import { compose } from './middleware.js';
import { attachResponseHelpers } from './response.js';

/**
 * Create an HTTP server wired to the app's global middleware chain and router.
 *
 * The global chain runs for every request; when it completes without error,
 * the router is consulted and the matched route's middleware + handler run
 * as a second composed chain. Errors from either chain are delegated to the
 * `onError` handler.
 *
 * @param {object} options - Server options.
 * @param {Function[]} [options.middlewares] - Global middleware chain.
 * @param {import('./router.js').Router} [options.router] - Route matcher.
 * @param {Function} [options.onError] - Error handler `(err, req, res)`.
 * @returns {import('node:http').Server} The configured HTTP server.
 */
export function createServer(options) {
  const { middlewares = [], router, onError } = options;

  const globalChain = compose(middlewares);

  const server = http.createServer((req, res) => {
    const [pathname, queryString] = req.url.split('?');
    req.path = pathname;
    req.query = Object.fromEntries(new URLSearchParams(queryString || ''));

    attachResponseHelpers(req, res);

    globalChain(req, res, (err) => {
      if (err) {
        handleChainError(err, req, res, onError);
        return;
      }

      if (!router) {
        res.error('NOT_FOUND', 'Not found', 404);
        return;
      }

      const match = router.match(req.method, pathname);
      if (!match) {
        res.error('NOT_FOUND', 'Not found', 404);
        return;
      }

      req.params = match.params;

      const routeChain = compose([
        ...match.middlewares,
        (rq, rs, next) => {
          Promise.resolve(match.handler(rq, rs)).catch(next);
        },
      ]);

      routeChain(req, res, (routeErr) => {
        if (routeErr) {
          handleChainError(routeErr, req, res, onError);
        }
      });
    });
  });

  return server;
}

/**
 * Report a chain error through the configured error handler, falling back to
 * a generic 500 response when no handler is provided.
 *
 * @param {Error} err - Error raised by a middleware or route handler.
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 * @param {Function} [onError] - Error handler `(err, req, res)`.
 */
function handleChainError(err, req, res, onError) {
  if (onError) {
    onError(err, req, res);
  } else {
    res.error('INTERNAL_ERROR', 'Internal server error', 500);
  }
}