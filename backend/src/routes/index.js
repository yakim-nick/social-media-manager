import authRoutes from './auth.routes.js';
import shopRoutes from './shop.routes.js';
import accountRoutes from './account.routes.js';
import postRoutes from './post.routes.js';
import mediaRoutes from './media.routes.js';
import analyticsRoutes from './analytics.routes.js';
import userRoutes from './user.routes.js';

const routeModules = [
  authRoutes,
  shopRoutes,
  accountRoutes,
  postRoutes,
  mediaRoutes,
  analyticsRoutes,
  userRoutes,
];

/**
 * Register every route module plus the health check on the given router.
 *
 * @param {import('../server/router.js').Router} router - Router to populate.
 */
export function registerRoutes(router) {
  for (const routes of routeModules) {
    for (const route of routes) {
      registerRoute(router, route);
    }
  }

  registerHealthRoute(router);
}

/**
 * Register a single route descriptor on the router.
 *
 * @param {import('../server/router.js').Router} router - Router to populate.
 * @param {{method: string, path: string, middlewares?: Function[], handler: Function}} route - Route descriptor.
 */
function registerRoute(router, route) {
  const method = route.method.toLowerCase();
  const { path, middlewares, handler } = route;

  if (middlewares && middlewares.length > 0) {
    router[method](path, middlewares, handler);
  } else {
    router[method](path, handler);
  }
}

/**
 * Register the `/api/v1/health` endpoint used by uptime checks.
 *
 * @param {import('../server/router.js').Router} router - Router to populate.
 */
function registerHealthRoute(router) {
  router.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });
}