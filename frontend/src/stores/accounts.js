import { writable } from 'svelte/store';
import { api } from '../utils/api.js';

/** List of connected social accounts. */
export const accounts = writable([]);
/** True while an account fetch is in flight. */
export const accountsLoading = writable(false);
/** Last account-fetch error message, or null. */
export const accountsError = writable(null);

/**
 * Fetch all accounts visible to the current user.
 *
 * @returns {Promise<object>} The raw API response.
 */
export async function fetchAccounts() {
  accountsLoading.set(true);
  accountsError.set(null);
  try {
    const data = await api.get('/accounts');
    accounts.set(data.accounts || data.data || []);
    return data;
  } catch (err) {
    accountsError.set(err.message || 'Failed to fetch accounts');
    throw err;
  } finally {
    accountsLoading.set(false);
  }
}

/**
 * Connect a new social account and append it to the list.
 *
 * @param {object} data - Account connection payload.
 * @returns {Promise<object>} The connected account.
 */
export async function connectAccount(data) {
  const result = await api.post('/accounts/connect', data);
  accounts.update((list) => [...list, result.account || result]);
  return result;
}

/**
 * Disconnect an account and remove it from the list.
 *
 * @param {string} id - Account ID.
 */
export async function disconnectAccount(id) {
  await api.delete(`/accounts/${id}`);
  accounts.update((list) => list.filter((account) => (account.id || account._id) !== id));
}