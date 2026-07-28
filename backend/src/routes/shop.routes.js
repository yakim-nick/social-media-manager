import { z } from 'zod';
import * as shopController from '../controllers/shop.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ShopRole } from '../config/constants.js';
import asyncHandler from '../utils/asyncHandler.js';

const createShopSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  timezone: z.string().optional(),
});

const updateShopSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  logo: z.string().optional(),
  timezone: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default [
  {
    method: 'GET',
    path: '/api/v1/shops',
    middlewares: [requireAuth],
    handler: asyncHandler(shopController.list),
  },
  {
    method: 'POST',
    path: '/api/v1/shops',
    middlewares: [requireAuth, validate(createShopSchema)],
    handler: asyncHandler(shopController.create),
  },
  {
    method: 'GET',
    path: '/api/v1/shops/:id',
    middlewares: [requireAuth],
    handler: asyncHandler(shopController.getById),
  },
  {
    method: 'PUT',
    path: '/api/v1/shops/:id',
    middlewares: [requireAuth, requireRole(ShopRole.OWNER), validate(updateShopSchema)],
    handler: asyncHandler(shopController.update),
  },
  {
    method: 'DELETE',
    path: '/api/v1/shops/:id',
    middlewares: [requireAuth, requireRole(ShopRole.OWNER)],
    handler: asyncHandler(shopController.remove),
  },
  {
    method: 'POST',
    path: '/api/v1/shops/:id/members',
    middlewares: [requireAuth, requireRole(ShopRole.OWNER), validate(addMemberSchema)],
    handler: asyncHandler(shopController.addMember),
  },
];
