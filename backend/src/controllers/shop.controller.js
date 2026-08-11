import prisma from '../utils/prisma.js';
import { hashPassword } from '../services/auth.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { ShopRole } from '../config/constants.js';
import { parsePagination } from '../utils/pagination.js';
import { requireShopAccess } from '../utils/access.js';

/**
 * List the shops the authenticated user belongs to, with pagination.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function list(req, res) {
  const { page, limit, skip } = parsePagination(req.query);

  const where = { users: { some: { id: req.user.id } } };

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, accounts: true, posts: true } },
      },
    }),
    prisma.shop.count({ where }),
  ]);

  res.paginated(shops, total, page, limit);
}

/**
 * Create a shop owned by the authenticated user.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function create(req, res) {
  const { name, slug, timezone } = req.body;

  const existingShop = await prisma.shop.findUnique({ where: { slug } });
  if (existingShop) {
    throw new ValidationError('Shop slug already exists', [
      { path: 'slug', message: 'Slug is already taken' },
    ]);
  }

  const shop = await prisma.shop.create({
    data: {
      name,
      slug,
      timezone: timezone || 'UTC',
      users: { connect: { id: req.user.id } },
    },
  });

  // The creator becomes the shop owner.
  await prisma.user.update({
    where: { id: req.user.id },
    data: { shopId: shop.id, role: ShopRole.OWNER },
  });

  res.json({ data: shop }, 201);
}

/**
 * Return a single shop the user belongs to, with usage counts.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function getById(req, res) {
  const shop = await requireShopAccess(req.params.id, req.user.id, {
    _count: { select: { users: true, accounts: true, posts: true, media: true } },
  });

  res.json({ data: shop });
}

/**
 * Update a shop's editable fields, rejecting slug collisions.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function update(req, res) {
  const shop = await requireShopAccess(req.params.id, req.user.id);

  if (req.body.slug && req.body.slug !== shop.slug) {
    const existingShop = await prisma.shop.findUnique({ where: { slug: req.body.slug } });
    if (existingShop) {
      throw new ValidationError('Shop slug already exists');
    }
  }

  const updated = await prisma.shop.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name ?? undefined,
      slug: req.body.slug ?? undefined,
      logo: req.body.logo ?? undefined,
      timezone: req.body.timezone ?? undefined,
    },
  });

  res.json({ data: updated });
}

/**
 * Delete a shop owned by the authenticated user.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function remove(req, res) {
  await requireShopAccess(req.params.id, req.user.id);

  await prisma.shop.delete({ where: { id: req.params.id } });

  res.json({ data: { message: 'Shop deleted successfully' } });
}

/**
 * Add a member user to a shop owned by the authenticated user.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function addMember(req, res) {
  const { email, name, password } = req.body;

  // Authorization is enforced by the requireRole(OWNER) middleware; here we
  // only need to confirm the shop exists.
  const shop = await prisma.shop.findUnique({
    where: { id: req.params.id },
  });

  if (!shop) {
    throw new NotFoundError('Shop not found');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ValidationError('Email already registered');
  }

  const hashedPassword = await hashPassword(password);

  const newMember = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      shopId: shop.id,
      role: ShopRole.MEMBER,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  res.json({ data: newMember }, 201);
}