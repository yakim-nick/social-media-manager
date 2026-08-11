import { writable } from 'svelte/store';
import { api } from '../utils/api.js';

/** Analytics data for the current query, or null before the first fetch. */
export const analyticsData = writable(null);
/** True while an analytics fetch is in flight. */
export const analyticsLoading = writable(false);
/** Last analytics-fetch error message, or null. */
export const analyticsError = writable(null);

/**
 * Fetch analytics with optional filters.
 *
 * @param {object} [params] - Query parameters (accountId, dateFrom, dateTo).
 * @returns {Promise<object>} The raw API response.
 */
export async function fetchAnalytics(params = {}) {
  analyticsLoading.set(true);
  analyticsError.set(null);
  try {
    const data = await api.get('/analytics', params);
    analyticsData.set(data);
    return data;
  } catch (err) {
    analyticsError.set(err.message || 'Failed to fetch analytics');
    throw err;
  } finally {
    analyticsLoading.set(false);
  }
}