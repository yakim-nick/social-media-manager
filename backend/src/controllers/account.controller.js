import prisma from '../utils/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { PAGINATION_DEFAULTS } from '../config/constants.js';

export async function list(req, res) {
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.page;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION_DEFAULTS.limit,
    PAGINATION_DEFAULTS.maxLimit
  );
  const skip = (page - 1) * limit;

  const shop = await prisma.shop.findFirst({
    where: {
      id: req.query.shopId || undefined,
      users: { some: { id: req.user.id } },
    },
  });

  if (!shop && req.query.shopId) {
    throw new NotFoundError('Shop not found');
  }

  const where = {};
  if (shop) {
    where.shopId = shop.id;
  } else {
    const userShops = await prisma.shop.findMany({
      where: { users: { some: { id: req.user.id } } },
      select: { id: true },
    });
    where.shopId = { in: userShops.map((s) => s.id) };
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

export async function create(req, res) {
  const { platform, accountId, name, accessToken, refreshToken, shopId } = req.body;

  const shop = await prisma.shop.findFirst({
    where: {
      id: shopId,
      users: { some: { id: req.user.id } },
    },
  });

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

export async function update(req, res) {
  const account = await prisma.socialAccount.findFirst({
    where: { id: req.params.id },
    include: { shop: { select: { id: true } } },
  });

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: account.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this account');
  }

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

export async function remove(req, res) {
  const account = await prisma.socialAccount.findFirst({
    where: { id: req.params.id },
  });

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: account.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this account');
  }

  await prisma.socialAccount.delete({ where: { id: req.params.id } });

  res.json({ data: { message: 'Account deleted successfully' } });
}

export async function sync(req, res) {
  const account = await prisma.socialAccount.findFirst({
    where: { id: req.params.id },
  });

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: account.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this account');
  }

  await prisma.socialAccount.update({
    where: { id: req.params.id },
    data: { lastSyncedAt: new Date() },
  });

  res.json({ data: { synced: true, message: 'Sync initiated successfully' } });
}
