import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';
import { createMockPrisma, createTestReq, createTestRes } from '../helpers.js';

// We need to mock @prisma/client BEFORE importing modules that use prisma.
// Since unstable_mockModule must be called at top level (sync), we do it here.
// Then we use dynamic import for the middleware.
const mockPrisma = createMockPrisma();

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const { requireAuth, requireRole } = await import('../../src/middleware/auth.js');

function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });
}

describe('requireAuth', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = createTestReq('GET', '/api/v1/protected');
    res = createTestRes();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('calls next() with user when token and session are valid', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'OWNER',
      shopId: 'shop-1',
      avatar: null,
    };

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    req.headers.authorization = `Bearer ${token}`;

    const futureDate = new Date(Date.now() + 86400000);
    mockPrisma.session.findUnique.mockResolvedValue({
      token,
      expiresAt: futureDate,
      user,
    });

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no error
    expect(req.user).toEqual(user);
    expect(req.token).toBe(token);
  });

  it('returns 401 when no authorization header is present', async () => {
    delete req.headers.authorization;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      }),
    );
  });

  it('returns 401 when authorization header does not start with Bearer', async () => {
    req.headers.authorization = 'Basic somecreds';

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('returns 401 when token is malformed', async () => {
    req.headers.authorization = 'Bearer not-a-valid-jwt';

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('returns 401 when session is not found in DB', async () => {
    const token = generateToken({ id: 'user-1', email: 'test@example.com', role: 'OWNER' });
    req.headers.authorization = `Bearer ${token}`;
    mockPrisma.session.findUnique.mockResolvedValue(null);

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('returns 401 when session has expired', async () => {
    const token = generateToken({ id: 'user-1', email: 'test@example.com', role: 'OWNER' });
    req.headers.authorization = `Bearer ${token}`;

    const pastDate = new Date(Date.now() - 86400000);
    mockPrisma.session.findUnique.mockResolvedValue({
      token,
      expiresAt: pastDate,
      user: { id: 'user-1' },
    });

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('uses the token from the header to query the session', async () => {
    const token = generateToken({ id: 'user-1', email: 'test@example.com', role: 'OWNER' });
    req.headers.authorization = `Bearer ${token}`;

    mockPrisma.session.findUnique.mockResolvedValue({
      token,
      expiresAt: new Date(Date.now() + 86400000),
      user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'OWNER', shopId: null, avatar: null },
    });

    await requireAuth(req, res, next);

    expect(mockPrisma.session.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { token },
      }),
    );
  });
});

describe('requireRole', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = createTestReq('GET', '/api/v1/admin');
    res = createTestRes();
    next = jest.fn();
  });

  it('calls next() when user has the required role', () => {
    req.user = { id: 'user-1', role: 'OWNER' };
    const middleware = requireRole('OWNER');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user has one of the required roles', () => {
    req.user = { id: 'user-1', role: 'ADMIN' };
    const middleware = requireRole('OWNER', 'ADMIN');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 when user does not have the required role', () => {
    req.user = { id: 'user-1', role: 'MEMBER' };
    const middleware = requireRole('OWNER');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }),
    );
  });

  it('returns 401 when no user is attached to req', () => {
    req.user = undefined;
    const middleware = requireRole('OWNER');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: 'UNAUTHORIZED' }),
    );
  });

  it('returns 401 when user is null', () => {
    req.user = null;
    const middleware = requireRole('OWNER');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});
