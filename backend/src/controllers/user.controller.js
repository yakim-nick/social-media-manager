import prisma from '../utils/prisma.js';
import { hashPassword, comparePassword } from '../services/auth.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export async function getProfile(req, res) {
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
    throw new NotFoundError('User not found');
  }

  res.json({ data: user });
}

export async function updateProfile(req, res) {
  const { name, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(avatar !== undefined && { avatar }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      shopId: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({ data: user });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters');
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) {
    throw new ValidationError('Current password is incorrect');
  }

  const hashed = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashed },
  });

  res.json({ data: { message: 'Password changed successfully' } });
}
