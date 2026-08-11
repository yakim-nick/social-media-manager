import prisma from '../utils/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../services/auth.service.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';
import config from '../config/index.js';

/**
 * Register a new user, create a session for them, and return the user + token.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function register(req, res) {
  const { email, name, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ValidationError('Email already registered', [
      { path: 'email', message: 'Email already in use' },
    ]);
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, name, password: hashedPassword },
    select: { id: true, email: true, name: true, role: true, shopId: true, createdAt: true },
  });

  const token = await createSessionForUser(user);

  res.json({ data: { user, token } }, 201);
}

/**
 * Authenticate a user by email + password and return the user + token.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = await createSessionForUser(user);

  // Never leak the password hash back to the client.
  const { password: _password, ...safeUser } = user;

  res.json({ data: { user: safeUser, token } });
}

/**
 * Invalidate the session associated with the current request token.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function logout(req, res) {
  const token = req.token;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  res.json({ data: { message: 'Logged out successfully' } });
}

/**
 * Return the profile of the authenticated user, including their shop.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      shopId: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
      shop: { select: { id: true, name: true, slug: true, logo: true } },
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  res.json({ data: user });
}

/**
 * Generate a JWT for the user and persist it as a database session.
 *
 * @param {object} user - User record with `id`, `email` and `role`.
 * @returns {Promise<string>} The signed session token.
 */
async function createSessionForUser(user) {
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  const expiresAt = new Date(Date.now() + expiresInToMs(config.jwt.expiresIn));

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Convert a JWT expiry string like `7d`, `12h`, `30m` or `45s` to milliseconds.
 *
 * @param {string} expiresIn - Expiry duration string.
 * @returns {number} Duration in milliseconds.
 */
function expiresInToMs(expiresIn) {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'd': return amount * 86400000;
    case 'h': return amount * 3600000;
    case 'm': return amount * 60000;
    case 's': return amount * 1000;
    default: return 7 * 86400000;
  }
}