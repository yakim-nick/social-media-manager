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

export function registerRoutes(router) {
  for (const routes of routeModules) {
    for (const route of routes) {
      const method = route.method.toLowerCase();
      const { path, middlewares, handler } = route;

      if (middlewares && middlewares.length > 0) {
        router[method](path, middlewares, handler);
      } else {
        router[method](path, handler);
      }
    }
  }

  router.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });
}
