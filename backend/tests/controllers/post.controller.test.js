import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createMockPrisma, createTestReq, createTestRes } from '../helpers.js';
import { PostStatus } from '../../src/config/constants.js';

const mockPrisma = createMockPrisma();

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const { list, create, getById, update, remove, schedule, publish } =
  await import('../../src/controllers/post.controller.js');

const testShop = {
  id: 'shop-1',
  name: 'Test Shop',
  slug: 'test-shop',
  timezone: 'UTC',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const testPost = {
  id: 'post-1',
  content: 'Test post content',
  media: [],
  scheduledAt: null,
  publishedAt: null,
  status: PostStatus.DRAFT,
  shopId: 'shop-1',
  createdById: 'user-1',
  accounts: [],
  _count: { accounts: 0 },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Reset all mock function implementations + call data.
 * Must be followed by fresh mockResolvedValue calls.
 */
function resetMocks() {
  Object.values(mockPrisma).forEach((model) => {
    if (model && typeof model === 'object') {
      Object.values(model).forEach((fn) => {
        if (jest.isMockFunction(fn)) fn.mockReset();
      });
    }
  });
}

describe('post controller - list', () => {
  let req;
  let res;

  beforeEach(() => {
    resetMocks();
    req = createTestReq('GET', '/api/v1/posts');
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.shop.findMany.mockResolvedValue([{ id: 'shop-1' }]);
  });

  it('returns paginated posts', async () => {
    mockPrisma.post.findMany.mockResolvedValue([testPost]);
    mockPrisma.post.count.mockResolvedValue(1);

    await list(req, res);

    expect(res.paginated).toHaveBeenCalledWith(
      [testPost],
      1,
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('returns empty array when no posts exist', async () => {
    mockPrisma.post.findMany.mockResolvedValue([]);
    mockPrisma.post.count.mockResolvedValue(0);

    await list(req, res);

    expect(res.paginated).toHaveBeenCalledWith(
      [],
      0,
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('filters by status when query param is provided', async () => {
    req.query.status = 'DRAFT';
    mockPrisma.post.findMany.mockResolvedValue([]);
    mockPrisma.post.count.mockResolvedValue(0);

    await list(req, res);

    expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'DRAFT' }),
      }),
    );
  });

  it('filters by shopId when query param is provided', async () => {
    req.query.shopId = 'shop-1';
    mockPrisma.post.findMany.mockResolvedValue([]);
    mockPrisma.post.count.mockResolvedValue(0);

    await list(req, res);

    expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ shopId: 'shop-1' }),
      }),
    );
  });

  it('orders by createdAt descending', async () => {
    mockPrisma.post.findMany.mockResolvedValue([]);
    mockPrisma.post.count.mockResolvedValue(0);

    await list(req, res);

    expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    );
  });
});

describe('post controller - create', () => {
  let req;
  let res;

  beforeEach(() => {
    resetMocks();
    req = createTestReq('POST', '/api/v1/posts', {
      content: 'New post',
      media: [],
      shopId: 'shop-1',
      accountIds: ['acct-1'],
    });
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.shop.findFirst.mockResolvedValue(testShop);
  });

  it('creates a post and returns it with status 201', async () => {
    mockPrisma.post.create.mockResolvedValue({ ...testPost, id: 'post-new', content: 'New post' });

    await create(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    const [payload, statusCode] = res.json.mock.calls[0];
    expect(statusCode).toBe(201);
    expect(payload.data.content).toBe('New post');
  });

  it('checks shop membership before creating', async () => {
    mockPrisma.post.create.mockResolvedValue({ ...testPost, content: 'New post' });

    await create(req, res);

    expect(mockPrisma.shop.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'shop-1',
          users: { some: { id: 'user-1' } },
        }),
      }),
    );
  });

  it('throws NotFoundError when shop does not exist', async () => {
    mockPrisma.shop.findFirst.mockResolvedValue(null);

    await expect(create(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('sets the createdById to the current user', async () => {
    mockPrisma.post.create.mockResolvedValue({ ...testPost, content: 'New post', createdById: 'user-1' });

    await create(req, res);

    expect(mockPrisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ createdById: 'user-1' }),
      }),
    );
  });
});

describe('post controller - getById', () => {
  let req;
  let res;

  beforeEach(() => {
    resetMocks();
    req = createTestReq('GET', '/api/v1/posts/post-1');
    req.params = { id: 'post-1' };
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.post.findFirst.mockResolvedValue(testPost);
    mockPrisma.shop.findFirst.mockResolvedValue({ id: 'shop-1' });
  });

  it('returns the post', async () => {
    await getById(req, res);
    expect(res.json).toHaveBeenCalledWith({ data: testPost });
  });

  it('throws 404 when post is not found', async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);

    await expect(getById(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('throws 403 when user is not a member of the shop', async () => {
    // Override shop.findFirst to return null (not a member)
    mockPrisma.shop.findFirst.mockResolvedValue(null);

    await expect(getById(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 403 }),
    );
  });
});

describe('post controller - update', () => {
  let req;
  let res;

  beforeEach(() => {
    resetMocks();
    req = createTestReq('PUT', '/api/v1/posts/post-1', { content: 'Updated content' });
    req.params = { id: 'post-1' };
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.post.findFirst.mockResolvedValue(testPost);
    mockPrisma.shop.findFirst.mockResolvedValue({ id: 'shop-1' });
  });

  it('updates the post', async () => {
    const updatedPost = { ...testPost, content: 'Updated content' };
    mockPrisma.post.update.mockResolvedValue(updatedPost);

    await update(req, res);

    expect(mockPrisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post-1' },
        data: { content: 'Updated content' },
      }),
    );
    expect(res.json).toHaveBeenCalledWith({ data: updatedPost });
  });

  it('throws 404 when post is not found', async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);

    await expect(update(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('throws 403 when user is not a shop member', async () => {
    mockPrisma.shop.findFirst.mockResolvedValue(null);

    await expect(update(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 403 }),
    );
  });
});

describe('post controller - remove', () => {
  let req;
  let res;

  beforeEach(() => {
    resetMocks();
    req = createTestReq('DELETE', '/api/v1/posts/post-1');
    req.params = { id: 'post-1' };
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.post.findFirst.mockResolvedValue(testPost);
    mockPrisma.shop.findFirst.mockResolvedValue({ id: 'shop-1' });
  });

  it('deletes the post', async () => {
    mockPrisma.post.delete.mockResolvedValue(testPost);

    await remove(req, res);

    expect(mockPrisma.post.delete).toHaveBeenCalledWith({
      where: { id: 'post-1' },
    });
    expect(res.json).toHaveBeenCalledWith({
      data: { message: 'Post deleted successfully' },
    });
  });

  it('throws 404 when post is not found', async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);

    await expect(remove(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('throws 403 when user is not a shop member', async () => {
    mockPrisma.shop.findFirst.mockResolvedValue(null);

    await expect(remove(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 403 }),
    );
  });
});

describe('post controller - schedule', () => {
  let req;
  let res;

  const draftPost = { ...testPost, status: PostStatus.DRAFT };
  const scheduledPost = { ...testPost, status: PostStatus.SCHEDULED, scheduledAt: new Date('2025-01-01') };

  beforeEach(() => {
    resetMocks();
    req = createTestReq('POST', '/api/v1/posts/post-1/schedule', {
      scheduledAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    });
    req.params = { id: 'post-1' };
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.post.findFirst.mockResolvedValue(draftPost);
    mockPrisma.shop.findFirst.mockResolvedValue({ id: 'shop-1' });
  });

  it('transitions a DRAFT post to SCHEDULED', async () => {
    mockPrisma.post.update.mockResolvedValue(scheduledPost);

    await schedule(req, res);

    expect(mockPrisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PostStatus.SCHEDULED }),
      }),
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('throws 404 when post is not found', async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);

    await expect(schedule(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe('post controller - publish', () => {
  let req;
  let res;

  const draftPost = { ...testPost, status: PostStatus.DRAFT };
  const publishedPost = { ...testPost, status: PostStatus.PUBLISHED, publishedAt: new Date() };

  beforeEach(() => {
    resetMocks();
    req = createTestReq('POST', '/api/v1/posts/post-1/publish');
    req.params = { id: 'post-1' };
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.post.findFirst.mockResolvedValue(draftPost);
    mockPrisma.shop.findFirst.mockResolvedValue({ id: 'shop-1' });
  });

  it('transitions a DRAFT post to PUBLISHED', async () => {
    mockPrisma.post.update.mockResolvedValue(publishedPost);

    await publish(req, res);

    expect(mockPrisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PostStatus.PUBLISHED }),
      }),
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('throws 404 when post is not found', async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);

    await expect(publish(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('sets publishedAt to current date', async () => {
    mockPrisma.post.update.mockResolvedValue(publishedPost);

    await publish(req, res);

    const updateCall = mockPrisma.post.update.mock.calls[0][0];
    expect(updateCall.data).toHaveProperty('publishedAt');
    expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
  });
});
