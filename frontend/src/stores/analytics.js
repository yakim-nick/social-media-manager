import { writable } from 'svelte/store';
import { api } from '../utils/api.js';

export const analyticsData = writable(null);
export const analyticsLoading = writable(false);
export const analyticsError = writable(null);

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
