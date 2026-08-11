/**
 * Analytics routes: metric queries for a single account.
 */
import { requireAuth } from '../middleware/auth.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import asyncHandler from '../utils/asyncHandler.js';

export default [
  {
    method: 'GET',
    path: '/api/v1/analytics',
    middlewares: [requireAuth],
    handler: asyncHandler(analyticsController.query),
  },
];
