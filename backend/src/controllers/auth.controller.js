import prisma from '../utils/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../services/auth.service.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';
import config from '../config/index.js';

export async function register(req, res) {
  const { email, name, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ValidationError('Email already registered', [
      { path: 'email', message: 'Email already in use' },
    ]);
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, name, password: hashed },
    select: { id: true, email: true, name: true, role: true, shopId: true, createdAt: true },
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  const expiresAt = new Date(Date.now() + ms(config.jwt.expiresIn));

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  res.json({ data: { user, token } }, 201);
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  const expiresAt = new Date(Date.now() + ms(config.jwt.expiresIn));

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const { password: _, ...safeUser } = user;

  res.json({ data: { user: safeUser, token } });
}

export async function logout(req, res) {
  const token = req.token;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  res.json({ data: { message: 'Logged out successfully' } });
}

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

function ms(expiresIn) {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'd': return num * 86400000;
    case 'h': return num * 3600000;
    case 'm': return num * 60000;
    case 's': return num * 1000;
    default: return 7 * 86400000;
  }
}
