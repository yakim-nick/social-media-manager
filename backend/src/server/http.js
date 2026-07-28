import http from 'node:http';
import { URLSearchParams } from 'node:url';
import { compose } from './middleware.js';
import { attachResponseHelpers } from './response.js';

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
        if (onError) {
          onError(err, req, res);
        } else {
          res.error('INTERNAL_ERROR', 'Internal server error', 500);
        }
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

      const routeChain = compose([...match.middlewares, (rq, rs, nxt) => {
        Promise.resolve(match.handler(rq, rs)).catch(nxt);
      }]);

      routeChain(req, res, (routeErr) => {
        if (routeErr) {
          if (onError) {
            onError(routeErr, req, res);
          } else {
            res.error('INTERNAL_ERROR', 'Internal server error', 500);
          }
        }
      });
    });
  });

  return server;
}
