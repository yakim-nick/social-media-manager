import { z } from 'zod';
import * as userController from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * User routes: profile read/update and password change.
 */
const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatar: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export default [
  {
    method: 'GET',
    path: '/api/v1/users/profile',
    middlewares: [requireAuth],
    handler: asyncHandler(userController.getProfile),
  },
  {
    method: 'PUT',
    path: '/api/v1/users/profile',
    middlewares: [requireAuth, validate(updateProfileSchema)],
    handler: asyncHandler(userController.updateProfile),
  },
  {
    method: 'PUT',
    path: '/api/v1/users/password',
    middlewares: [requireAuth, validate(changePasswordSchema)],
    handler: asyncHandler(userController.changePassword),
  },
];
