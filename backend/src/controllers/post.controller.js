import prisma from '../utils/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { PAGINATION_DEFAULTS } from '../config/constants.js';
import * as postService from '../services/post.service.js';

export async function list(req, res) {
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.page;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION_DEFAULTS.limit,
    PAGINATION_DEFAULTS.maxLimit
  );
  const skip = (page - 1) * limit;

  const userShops = await prisma.shop.findMany({
    where: { users: { some: { id: req.user.id } } },
    select: { id: true },
  });
  const shopIds = userShops.map((s) => s.id);

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

export async function getById(req, res) {
  const post = await prisma.post.findFirst({
    where: { id: req.params.id },
    include: {
      accounts: { select: { id: true, platform: true, name: true, avatar: true } },
      shop: { select: { id: true, name: true } },
    },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: post.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this post');
  }

  res.json({ data: post });
}

export async function update(req, res) {
  const post = await prisma.post.findFirst({
    where: { id: req.params.id },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: post.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this post');
  }

  const data = {};
  if (req.body.content !== undefined) data.content = req.body.content;
  if (req.body.media !== undefined) data.media = req.body.media;
  if (req.body.accountIds !== undefined) {
    data.accounts = { set: req.body.accountIds.map((id) => ({ id })) };
  }

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data,
    include: { accounts: true },
  });

  res.json({ data: updated });
}

export async function remove(req, res) {
  const post = await prisma.post.findFirst({
    where: { id: req.params.id },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: post.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this post');
  }

  await prisma.post.delete({ where: { id: req.params.id } });

  res.json({ data: { message: 'Post deleted successfully' } });
}

export async function schedule(req, res) {
  const post = await prisma.post.findFirst({
    where: { id: req.params.id },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: post.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this post');
  }

  const updated = await postService.schedulePost(
    req.params.id,
    req.body.scheduledAt,
    post.shopId
  );

  res.json({ data: updated });
}

export async function publish(req, res) {
  const post = await prisma.post.findFirst({
    where: { id: req.params.id },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: post.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this post');
  }

  const updated = await postService.publishPost(req.params.id, post.shopId);

  res.json({ data: updated });
}
