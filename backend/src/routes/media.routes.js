import { requireAuth } from '../middleware/auth.js';
import * as mediaController from '../controllers/media.controller.js';
import asyncHandler from '../utils/asyncHandler.js';

export default [
  {
    method: 'POST',
    path: '/api/v1/media/upload',
    middlewares: [requireAuth, mediaController.uploadMiddleware()],
    handler: asyncHandler(mediaController.saveMediaRecord),
  },
  {
    method: 'GET',
    path: '/api/v1/media',
    middlewares: [requireAuth],
    handler: asyncHandler(mediaController.list),
  },
  {
    method: 'DELETE',
    path: '/api/v1/media/:id',
    middlewares: [requireAuth],
    handler: asyncHandler(mediaController.remove),
  },
];
