import { Router } from './server/router.js';
import { cors } from './middleware/cors.js';
import { logger } from './middleware/logger.js';
import { bodyParser } from './server/bodyParser.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerRoutes } from './routes/index.js';

const router = new Router();
registerRoutes(router);

const middlewares = [
  cors(),
  logger(),
  bodyParser(),
  rateLimiter(),
];

export { router, middlewares };
