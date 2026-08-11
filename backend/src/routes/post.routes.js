import { z } from 'zod';
import * as postController from '../controllers/post.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Post routes: CRUD plus schedule and publish lifecycle actions.
 */
const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  media: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  shopId: z.string().uuid(),
  accountIds: z.array(z.string().uuid()).min(1, 'At least one account is required'),
});

const updatePostSchema = z.object({
  content: z.string().min(1).optional(),
  media: z.array(z.string()).optional(),
  accountIds: z.array(z.string().uuid()).optional(),
});

const schedulePostSchema = z.object({
  scheduledAt: z.string().datetime('Invalid datetime format'),
});

export default [
  {
    method: 'GET',
    path: '/api/v1/posts',
    middlewares: [requireAuth],
    handler: asyncHandler(postController.list),
  },
  {
    method: 'POST',
    path: '/api/v1/posts',
    middlewares: [requireAuth, validate(createPostSchema)],
    handler: asyncHandler(postController.create),
  },
  {
    method: 'GET',
    path: '/api/v1/posts/:id',
    middlewares: [requireAuth],
    handler: asyncHandler(postController.getById),
  },
  {
    method: 'PUT',
    path: '/api/v1/posts/:id',
    middlewares: [requireAuth, validate(updatePostSchema)],
    handler: asyncHandler(postController.update),
  },
  {
    method: 'DELETE',
    path: '/api/v1/posts/:id',
    middlewares: [requireAuth],
    handler: asyncHandler(postController.remove),
  },
  {
    method: 'POST',
    path: '/api/v1/posts/:id/schedule',
    middlewares: [requireAuth, validate(schedulePostSchema)],
    handler: asyncHandler(postController.schedule),
  },
  {
    method: 'POST',
    path: '/api/v1/posts/:id/publish',
    middlewares: [requireAuth],
    handler: asyncHandler(postController.publish),
  },
];
