import { z } from 'zod';
import * as accountController from '../controllers/account.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Platform } from '../config/constants.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Social account routes: CRUD plus a sync trigger.
 */
const createAccountSchema = z.object({
  platform: z.nativeEnum(Platform),
  accountId: z.string().min(1),
  name: z.string().min(1).max(255),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  shopId: z.string().uuid(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  isActive: z.boolean().optional(),
});

export default [
  {
    method: 'GET',
    path: '/api/v1/accounts',
    middlewares: [requireAuth],
    handler: asyncHandler(accountController.list),
  },
  {
    method: 'POST',
    path: '/api/v1/accounts',
    middlewares: [requireAuth, validate(createAccountSchema)],
    handler: asyncHandler(accountController.create),
  },
  {
    method: 'PUT',
    path: '/api/v1/accounts/:id',
    middlewares: [requireAuth, validate(updateAccountSchema)],
    handler: asyncHandler(accountController.update),
  },
  {
    method: 'DELETE',
    path: '/api/v1/accounts/:id',
    middlewares: [requireAuth],
    handler: asyncHandler(accountController.remove),
  },
  {
    method: 'POST',
    path: '/api/v1/accounts/:id/sync',
    middlewares: [requireAuth],
    handler: asyncHandler(accountController.sync),
  },
];
