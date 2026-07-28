import { z } from 'zod';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default [
  {
    method: 'POST',
    path: '/api/v1/auth/register',
    middlewares: [validate(registerSchema)],
    handler: asyncHandler(authController.register),
  },
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    middlewares: [validate(loginSchema)],
    handler: asyncHandler(authController.login),
  },
  {
    method: 'POST',
    path: '/api/v1/auth/logout',
    middlewares: [requireAuth],
    handler: asyncHandler(authController.logout),
  },
  {
    method: 'GET',
    path: '/api/v1/auth/me',
    middlewares: [requireAuth],
    handler: asyncHandler(authController.getMe),
  },
];
