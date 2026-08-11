import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { parsePagination } from '../utils/pagination.js';
import { requireAccountAccess, findShopForUser, getUserShopIds } from '../utils/access.js';

/**
 * List social accounts visible to the authenticated user, with pagination.
 *
 * When a `shopId` filter is given, results are scoped to that shop (and the
 * user's membership is verified); otherwise all of the user's shops are used.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function list(req, res) {
  const { page, limit, skip } = parsePagination(req.query);

  const shop = req.query.shopId
    ? await findShopForUser(req.query.shopId, req.user.id)
    : await prisma.shop.findFirst({ where: { users: { some: { id: req.user.id } } } });

  if (!shop && req.query.shopId) {
    throw new NotFoundError('Shop not found');
  }

  const where = {};
  if (shop) {
    where.shopId = shop.id;
  } else {
    const shopIds = await getUserShopIds(req.user.id);
    where.shopId = { in: shopIds };
  }

  const [accounts, total] = await Promise.all([
    prisma.socialAccount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.socialAccount.count({ where }),
  ]);

  res.paginated(accounts, total, page, limit);
}

/**
 * Create a social account linked to a shop the user belongs to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function create(req, res) {
  const { platform, accountId, name, accessToken, refreshToken, shopId } = req.body;

  const shop = await findShopForUser(shopId, req.user.id);
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }

  const account = await prisma.socialAccount.create({
    data: {
      platform,
      accountId,
      name,
      accessToken,
      refreshToken,
      shopId: shop.id,
      isActive: true,
    },
  });

  res.json({ data: account }, 201);
}

/**
 * Update an editable social account the user has access to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function update(req, res) {
  await requireAccountAccess(req.params.id, req.user.id);

  const updated = await prisma.socialAccount.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name ?? undefined,
      accessToken: req.body.accessToken ?? undefined,
      refreshToken: req.body.refreshToken ?? undefined,
      isActive: req.body.isActive ?? undefined,
    },
  });

  res.json({ data: updated });
}

/**
 * Delete a social account the user has access to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function remove(req, res) {
  await requireAccountAccess(req.params.id, req.user.id);

  await prisma.socialAccount.delete({ where: { id: req.params.id } });

  res.json({ data: { message: 'Account deleted successfully' } });
}

/**
 * Mark a social account as synced (stamp `lastSyncedAt`).
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function sync(req, res) {
  await requireAccountAccess(req.params.id, req.user.id);

  await prisma.socialAccount.update({
    where: { id: req.params.id },
    data: { lastSyncedAt: new Date() },
  });

  res.json({ data: { synced: true, message: 'Sync initiated successfully' } });
}