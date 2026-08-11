import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { parsePagination } from '../utils/pagination.js';
import { requirePostAccess, getUserShopIds } from '../utils/access.js';
import * as postService from '../services/post.service.js';

/**
 * List posts visible to the authenticated user, with pagination and filters.
 *
 * Results are scoped to the user's shops; an optional `status` or `shopId`
 * query parameter narrows the result set further.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function list(req, res) {
  const { page, limit, skip } = parsePagination(req.query);

  const shopIds = await getUserShopIds(req.user.id);

  const where = { shopId: { in: shopIds } };
  if (req.query.status) where.status = req.query.status;
  if (req.query.shopId) where.shopId = req.query.shopId;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        accounts: { select: { id: true, platform: true, name: true } },
        _count: { select: { accounts: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  res.paginated(posts, total, page, limit);
}

/**
 * Create a post in a shop the user belongs to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function create(req, res) {
  const shop = await prisma.shop.findFirst({
    where: {
      id: req.body.shopId,
      users: { some: { id: req.user.id } },
    },
  });

  if (!shop) {
    throw new NotFoundError('Shop not found');
  }

  const post = await postService.createPost(req.body, shop.id, req.user.id);

  res.json({ data: post }, 201);
}

/**
 * Return a single post the user has access to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function getById(req, res) {
  const post = await requirePostAccess(req.params.id, req.user.id, {
    accounts: { select: { id: true, platform: true, name: true, avatar: true } },
    shop: { select: { id: true, name: true } },
  });

  res.json({ data: post });
}

/**
 * Update editable fields of a post the user has access to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function update(req, res) {
  await requirePostAccess(req.params.id, req.user.id);

  const updateData = {};
  if (req.body.content !== undefined) updateData.content = req.body.content;
  if (req.body.media !== undefined) updateData.media = req.body.media;
  if (req.body.accountIds !== undefined) {
    updateData.accounts = { set: req.body.accountIds.map((id) => ({ id })) };
  }

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: updateData,
    include: { accounts: true },
  });

  res.json({ data: updated });
}

/**
 * Delete a post the user has access to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function remove(req, res) {
  await requirePostAccess(req.params.id, req.user.id);

  await prisma.post.delete({ where: { id: req.params.id } });

  res.json({ data: { message: 'Post deleted successfully' } });
}

/**
 * Schedule a post the user has access to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function schedule(req, res) {
  const post = await requirePostAccess(req.params.id, req.user.id);

  const updated = await postService.schedulePost(
    req.params.id,
    req.body.scheduledAt,
    post.shopId
  );

  res.json({ data: updated });
}

/**
 * Publish a post the user has access to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function publish(req, res) {
  const post = await requirePostAccess(req.params.id, req.user.id);

  const updated = await postService.publishPost(req.params.id, post.shopId);

  res.json({ data: updated });
}