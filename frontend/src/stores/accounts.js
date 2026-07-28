import { writable } from 'svelte/store';
import { api } from '../utils/api.js';

export const accounts = writable([]);
export const accountsLoading = writable(false);
export const accountsError = writable(null);

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

export async function connectAccount(data) {
  const result = await api.post('/accounts/connect', data);
  accounts.update((list) => [...list, result.account || result]);
  return result;
}

export async function disconnectAccount(id) {
  await api.delete(`/accounts/${id}`);
  accounts.update((list) => list.filter((a) => (a.id || a._id) !== id));
}
