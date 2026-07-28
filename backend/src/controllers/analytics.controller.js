import prisma from '../utils/prisma.js';
import { ForbiddenError, ValidationError } from '../utils/errors.js';
import * as analyticsService from '../services/analytics.service.js';

export async function query(req, res) {
  const { accountId, dateFrom, dateTo } = req.query;

  if (!accountId) {
    throw new ValidationError('accountId is required');
  }

  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new ValidationError('Account not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: account.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this account');
  }

  const analytics = await analyticsService.getAnalytics({
    accountId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  res.json({ data: analytics });
}
