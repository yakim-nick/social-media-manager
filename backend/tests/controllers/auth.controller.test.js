import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { createMockPrisma, createTestReq, createTestRes, generateTestToken } from '../helpers.js';

const mockPrisma = createMockPrisma();

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const { register, login, logout, getMe } = await import('../../src/controllers/auth.controller.js');

const testUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  password: bcrypt.hashSync('password123', 12),
  role: 'OWNER',
  shopId: null,
  avatar: null,
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
};

const safeUser = {
  id: testUser.id,
  email: testUser.email,
  name: testUser.name,
  role: testUser.role,
  shopId: testUser.shopId,
  createdAt: testUser.createdAt,
};

describe('auth controller - register', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('POST', '/api/v1/auth/register', {
      email: 'new@example.com',
      name: 'New User',
      password: 'password123',
    });
    res = createTestRes();
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-2',
      email: 'new@example.com',
      name: 'New User',
      role: 'OWNER',
      shopId: null,
      createdAt: new Date().toISOString(),
    });
    mockPrisma.session.create.mockResolvedValue({
      id: 'session-1',
      userId: 'user-2',
      token: 'some-token',
      expiresAt: new Date(Date.now() + 86400000),
    });
  });

  it('creates user and returns token + user with status 201', async () => {
    await register(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    const [payload, statusCode] = res.json.mock.calls[0];
    expect(statusCode).toBe(201);
    expect(payload.data).toHaveProperty('user');
    expect(payload.data).toHaveProperty('token');
    expect(payload.data.user.email).toBe('new@example.com');
  });

  it('hashes the password before storing', async () => {
    await register(req, res);

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.password).not.toBe('password123');
    expect(createCall.data.password).toMatch(/^\$2[ab]\$12\$/); // bcrypt hash
  });

  it('throws ValidationError (400) when email is already registered', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(testUser);

    await expect(register(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );

    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('creates a session for the new user', async () => {
    await register(req, res);

    expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
    const sessionData = mockPrisma.session.create.mock.calls[0][0].data;
    expect(sessionData.userId).toBe('user-2');
  });
});

describe('auth controller - login', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('POST', '/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    res = createTestRes();
  });

  it('returns token + user for valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(testUser);

    await login(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    const [payload] = res.json.mock.calls[0];
    expect(payload.data).toHaveProperty('user');
    expect(payload.data).toHaveProperty('token');
    expect(payload.data.user.email).toBe('test@example.com');
  });

  it('does not include password in the response', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(testUser);

    await login(req, res);

    const [payload] = res.json.mock.calls[0];
    expect(payload.data.user).not.toHaveProperty('password');
  });

  it('returns 401 for non-existent email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(login(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('returns 401 for wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(testUser);
    req.body.password = 'wrongpassword';

    await expect(login(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('creates a new session on login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(testUser);

    await login(req, res);

    expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
  });
});

describe('auth controller - logout', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('POST', '/api/v1/auth/logout');
    res = createTestRes();
  });

  it('deletes session for the current token', async () => {
    req.token = 'test-token-123';

    await logout(req, res);

    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: { token: 'test-token-123' },
    });
  });

  it('returns success message', async () => {
    req.token = 'test-token-123';

    await logout(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: { message: 'Logged out successfully' },
    });
  });

  it('succeeds even when no token is present', async () => {
    req.token = null;

    await expect(logout(req, res)).resolves.not.toThrow();
    expect(res.json).toHaveBeenCalled();
  });

  it('succeeds even when token is undefined', async () => {
    delete req.token;

    await expect(logout(req, res)).resolves.not.toThrow();
    expect(res.json).toHaveBeenCalled();
  });
});

describe('auth controller - getMe', () => {
  let req;
  let res;

  const userWithShop = {
    ...testUser,
    shop: { id: 'shop-1', name: 'Test Shop', slug: 'test-shop', logo: null },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    req = createTestReq('GET', '/api/v1/auth/me');
    req.user = { id: 'user-1' };
    res = createTestRes();
  });

  it('returns user data when user exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(userWithShop);

    await getMe(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    const [payload] = res.json.mock.calls[0];
    expect(payload.data).toHaveProperty('id', 'user-1');
    expect(payload.data).toHaveProperty('email', 'test@example.com');
    expect(payload.data.shop).toBeDefined();
  });

  it('includes shop relation in the response', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(userWithShop);

    await getMe(req, res);

    const [payload] = res.json.mock.calls[0];
    expect(payload.data.shop).toEqual({
      id: 'shop-1',
      name: 'Test Shop',
      slug: 'test-shop',
      logo: null,
    });
  });

  it('returns 401 when user is not found in database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(getMe(req, res)).rejects.toThrow(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('queries user by the id from req.user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(userWithShop);

    await getMe(req, res);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
      }),
    );
  });
});
