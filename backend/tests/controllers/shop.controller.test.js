import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createMockPrisma, createTestReq, createTestRes } from '../helpers.js';

const mockPrisma = createMockPrisma();

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const { list, create, getById, update, remove, addMember } =
  await import('../../src/controllers/shop.controller.js');

const testShop = {
  id: 'shop-1',
  name: 'Test Shop',
  slug: 'test-shop',
  logo: null,
  timezone: 'UTC',
  _count: { users: 1, accounts: 0, posts: 0, media: 0 },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('shop controller - list', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('GET', '/api/v1/shops');
    req.user = { id: 'user-1' };
    res = createTestRes();
  });

  it('returns paginated shops', async () => {
    mockPrisma.shop.findMany.mockResolvedValue([testShop]);
    mockPrisma.shop.count.mockResolvedValue(1);

    await list(req, res);

    expect(res.paginated).toHaveBeenCalledWith(
      [testShop],
      1,
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('returns empty array when user has no shops', async () => {
    mockPrisma.shop.findMany.mockResolvedValue([]);
    mockPrisma.shop.count.mockResolvedValue(0);

    await list(req, res);

    expect(res.paginated).toHaveBeenCalledWith([], 0, expect.any(Number), expect.any(Number));
  });

  it('only returns shops where user is a member', async () => {
    mockPrisma.shop.findMany.mockResolvedValue([]);
    mockPrisma.shop.count.mockResolvedValue(0);

    await list(req, res);

    expect(mockPrisma.shop.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { users: { some: { id: 'user-1' } } },
      }),
    );
  });
});

describe('shop controller - create', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('POST', '/api/v1/shops', {
      name: 'New Shop',
      slug: 'new-shop',
      timezone: 'America/New_York',
    });
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.shop.findUnique.mockResolvedValue(null);
    mockPrisma.shop.create.mockResolvedValue({
      id: 'shop-new',
      name: 'New Shop',
      slug: 'new-shop',
      logo: null,
      timezone: 'America/New_York',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
    mockPrisma.user.update.mockResolvedValue({});
  });

  it('creates shop and returns it with status 201', async () => {
    await create(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    const [payload, statusCode] = res.json.mock.calls[0];
    expect(statusCode).toBe(201);
    expect(payload.data.name).toBe('New Shop');
    expect(payload.data.slug).toBe('new-shop');
  });

  it('connects the shop to the current user', async () => {
    await create(req, res);

    expect(mockPrisma.shop.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          users: { connect: { id: 'user-1' } },
        }),
      }),
    );
  });

  it('updates user role to OWNER after shop creation', async () => {
    await create(req, res);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { shopId: 'shop-new', role: 'OWNER' },
      }),
    );
  });

  it('rejects duplicate slug with 400', async () => {
    mockPrisma.shop.findUnique.mockResolvedValue(testShop);

    await expect(create(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
    expect(mockPrisma.shop.create).not.toHaveBeenCalled();
  });

  it('uses default timezone when not provided', async () => {
    req.body = { name: 'Shop', slug: 'shop' };
    delete req.body.timezone;
    mockPrisma.shop.findUnique.mockResolvedValue(null);
    mockPrisma.shop.create.mockResolvedValue({
      id: 'shop-new',
      name: 'Shop',
      slug: 'shop',
      logo: null,
      timezone: 'UTC',
    });

    await create(req, res);

    expect(mockPrisma.shop.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ timezone: 'UTC' }),
      }),
    );
  });
});

describe('shop controller - getById', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('GET', '/api/v1/shops/shop-1');
    req.params = { id: 'shop-1' };
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.shop.findFirst.mockResolvedValue(testShop);
  });

  it('returns the shop', async () => {
    await getById(req, res);

    expect(res.json).toHaveBeenCalledWith({ data: testShop });
  });

  it('throws 404 when shop is not found', async () => {
    mockPrisma.shop.findFirst.mockResolvedValue(null);

    await expect(getById(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('only returns shop where user is a member', async () => {
    await getById(req, res);

    expect(mockPrisma.shop.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'shop-1', users: { some: { id: 'user-1' } } },
      }),
    );
  });
});

describe('shop controller - update', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('PUT', '/api/v1/shops/shop-1', {
      name: 'Updated Shop',
    });
    req.params = { id: 'shop-1' };
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.shop.findFirst.mockResolvedValue(testShop);
  });

  it('updates shop name', async () => {
    const updatedShop = { ...testShop, name: 'Updated Shop' };
    mockPrisma.shop.update.mockResolvedValue(updatedShop);

    await update(req, res);

    expect(mockPrisma.shop.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'shop-1' },
        data: { name: 'Updated Shop' },
      }),
    );
    expect(res.json).toHaveBeenCalledWith({ data: updatedShop });
  });

  it('throws 404 when shop is not found', async () => {
    mockPrisma.shop.findFirst.mockResolvedValue(null);

    await expect(update(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('rejects slug change when slug is already taken', async () => {
    req.body = { slug: 'taken-slug' };
    mockPrisma.shop.findUnique.mockResolvedValue({ id: 'other-shop', slug: 'taken-slug' });

    await expect(update(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('allows updating slug to the same value', async () => {
    req.body = { slug: 'test-shop' };
    mockPrisma.shop.findUnique.mockResolvedValue(testShop); // same shop
    mockPrisma.shop.update.mockResolvedValue({ ...testShop, slug: 'test-shop' });

    await update(req, res);

    // Should not throw (slug is the same)
    expect(res.json).toHaveBeenCalled();
  });
});

describe('shop controller - remove', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('DELETE', '/api/v1/shops/shop-1');
    req.params = { id: 'shop-1' };
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.shop.findFirst.mockResolvedValue(testShop);
  });

  it('deletes the shop', async () => {
    mockPrisma.shop.delete.mockResolvedValue(testShop);

    await remove(req, res);

    expect(mockPrisma.shop.delete).toHaveBeenCalledWith({
      where: { id: 'shop-1' },
    });
    expect(res.json).toHaveBeenCalledWith({
      data: { message: 'Shop deleted successfully' },
    });
  });

  it('throws 404 when shop is not found', async () => {
    mockPrisma.shop.findFirst.mockResolvedValue(null);

    await expect(remove(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe('shop controller - addMember', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('POST', '/api/v1/shops/shop-1/members', {
      email: 'member@example.com',
      name: 'New Member',
      password: 'password123',
    });
    req.params = { id: 'shop-1' };
    req.user = { id: 'user-1' };
    res = createTestRes();
    mockPrisma.shop.findUnique.mockResolvedValue(testShop);
    mockPrisma.user.findUnique.mockResolvedValue(null);
  });

  it('creates a member user and returns it with status 201', async () => {
    const newMember = {
      id: 'user-new',
      email: 'member@example.com',
      name: 'New Member',
      role: 'MEMBER',
      createdAt: new Date('2024-01-01').toISOString(),
    };
    mockPrisma.user.create.mockResolvedValue(newMember);

    await addMember(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    const [payload, statusCode] = res.json.mock.calls[0];
    expect(statusCode).toBe(201);
    expect(payload.data.email).toBe('member@example.com');
    expect(payload.data.role).toBe('MEMBER');
  });

  it('assigns the member to the shop', async () => {
    mockPrisma.user.create.mockResolvedValue({ id: 'user-new', email: 'member@example.com', role: 'MEMBER' });

    await addMember(req, res);

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shopId: 'shop-1',
          role: 'MEMBER',
        }),
      }),
    );
  });

  it('hashes the password for the new member', async () => {
    mockPrisma.user.create.mockResolvedValue({ id: 'user-new', email: 'member@example.com', role: 'MEMBER' });

    await addMember(req, res);

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.password).toMatch(/^\$2[ab]\$12\$/);
    expect(createCall.data.password).not.toBe('password123');
  });

  it('throws 404 when shop is not found', async () => {
    mockPrisma.shop.findUnique.mockResolvedValue(null);

    await expect(addMember(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('throws 400 when email already registered', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'member@example.com',
    });

    await expect(addMember(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });
});
