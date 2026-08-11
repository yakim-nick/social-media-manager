import prisma from '../utils/prisma.js';
import { ForbiddenError, ValidationError } from '../utils/errors.js';
import * as analyticsService from '../services/analytics.service.js';

/**
 * Return analytics for a single account the user has access to.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
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

  const shopMembership = await prisma.shop.findFirst({
    where: { id: account.shopId, users: { some: { id: req.user.id } } },
  });

  if (!shopMembership) {
    throw new ForbiddenError('You do not have access to this account');
  }

  const analytics = await analyticsService.getAnalytics({
    accountId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  res.json({ data: analytics });
}