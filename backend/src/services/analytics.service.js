import prisma from '../utils/prisma.js';

export async function recordAnalytics(data) {
  return prisma.analytics.upsert({
    where: {
      accountId_date: {
        accountId: data.accountId,
        date: new Date(data.date),
      },
    },
    update: {
      followers: data.followers ?? 0,
      likes: data.likes ?? 0,
      comments: data.comments ?? 0,
      shares: data.shares ?? 0,
      impressions: data.impressions ?? 0,
      reach: data.reach ?? 0,
      metadata: data.metadata ?? undefined,
    },
    create: {
      accountId: data.accountId,
      date: new Date(data.date),
      followers: data.followers ?? 0,
      likes: data.likes ?? 0,
      comments: data.comments ?? 0,
      shares: data.shares ?? 0,
      impressions: data.impressions ?? 0,
      reach: data.reach ?? 0,
      metadata: data.metadata ?? undefined,
    },
  });
}

export async function getAnalytics(filters) {
  const where = { accountId: filters.accountId };

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
  }

  return prisma.analytics.findMany({
    where,
    orderBy: { date: 'asc' },
    include: { account: { select: { id: true, platform: true, name: true } } },
  });
}
