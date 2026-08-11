import prisma from '../utils/prisma.js';

/**
 * Upsert a daily analytics snapshot for an account.
 *
 * Existing rows for the same account + date are updated; otherwise a new
 * row is created. Missing metric values default to zero.
 *
 * @param {object} data - Analytics snapshot (`accountId`, `date`, metrics).
 * @returns {Promise<object>} The upserted analytics row.
 */
export async function recordAnalytics(data) {
  const metrics = {
    followers: data.followers ?? 0,
    likes: data.likes ?? 0,
    comments: data.comments ?? 0,
    shares: data.shares ?? 0,
    impressions: data.impressions ?? 0,
    reach: data.reach ?? 0,
    metadata: data.metadata ?? undefined,
  };

  return prisma.analytics.upsert({
    where: {
      accountId_date: {
        accountId: data.accountId,
        date: new Date(data.date),
      },
    },
    update: metrics,
    create: {
      accountId: data.accountId,
      date: new Date(data.date),
      ...metrics,
    },
  });
}

/**
 * Fetch analytics rows for an account, optionally filtered by date range.
 *
 * @param {object} filters - Query filters (`accountId`, `dateFrom`, `dateTo`).
 * @returns {Promise<object[]>} Analytics rows ordered by date ascending.
 */
export async function getAnalytics(filters) {
  const where = { accountId: filters.accountId };

  const dateRange = buildDateRangeFilter(filters.dateFrom, filters.dateTo);
  if (dateRange) {
    where.date = dateRange;
  }

  return prisma.analytics.findMany({
    where,
    orderBy: { date: 'asc' },
    include: { account: { select: { id: true, platform: true, name: true } } },
  });
}

/**
 * Build a Prisma date-range filter from optional start/end dates.
 *
 * @param {string|undefined} dateFrom - Inclusive start date (ISO).
 * @param {string|undefined} dateTo - Inclusive end date (ISO).
 * @returns {object|null} Prisma `gte`/`lte` filter, or null when no range given.
 */
function buildDateRangeFilter(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) {
    return null;
  }

  const range = {};
  if (dateFrom) range.gte = new Date(dateFrom);
  if (dateTo) range.lte = new Date(dateTo);
  return range;
}