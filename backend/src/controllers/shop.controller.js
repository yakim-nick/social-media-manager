import prisma from '../utils/prisma.js';
import { hashPassword } from '../services/auth.service.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { ShopRole, PAGINATION_DEFAULTS } from '../config/constants.js';

export async function list(req, res) {
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.page;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION_DEFAULTS.limit,
    PAGINATION_DEFAULTS.maxLimit
  );
  const skip = (page - 1) * limit;

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

export async function create(req, res) {
  const { name, slug, timezone } = req.body;

  const existing = await prisma.shop.findUnique({ where: { slug } });
  if (existing) {
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

  await prisma.user.update({
    where: { id: req.user.id },
    data: { shopId: shop.id, role: ShopRole.OWNER },
  });

  res.json({ data: shop }, 201);
}

export async function getById(req, res) {
  const shop = await prisma.shop.findFirst({
    where: {
      id: req.params.id,
      users: { some: { id: req.user.id } },
    },
    include: {
      _count: { select: { users: true, accounts: true, posts: true, media: true } },
    },
  });

  if (!shop) {
    throw new NotFoundError('Shop not found');
  }

  res.json({ data: shop });
}

export async function update(req, res) {
  const shop = await prisma.shop.findFirst({
    where: {
      id: req.params.id,
      users: { some: { id: req.user.id } },
    },
  });

  if (!shop) {
    throw new NotFoundError('Shop not found');
  }

  if (req.body.slug && req.body.slug !== shop.slug) {
    const existing = await prisma.shop.findUnique({ where: { slug: req.body.slug } });
    if (existing) {
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

export async function remove(req, res) {
  const shop = await prisma.shop.findFirst({
    where: {
      id: req.params.id,
      users: { some: { id: req.user.id } },
    },
  });

  if (!shop) {
    throw new NotFoundError('Shop not found');
  }

  await prisma.shop.delete({ where: { id: req.params.id } });

  res.json({ data: { message: 'Shop deleted successfully' } });
}

export async function addMember(req, res) {
  const { email, name, password } = req.body;

  const shop = await prisma.shop.findUnique({
    where: { id: req.params.id },
  });

  if (!shop) {
    throw new NotFoundError('Shop not found');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ValidationError('Email already registered');
  }

  const hashed = await hashPassword(password);

  const member = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      shopId: shop.id,
      role: ShopRole.MEMBER,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  res.json({ data: member }, 201);
}
