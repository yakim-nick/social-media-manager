import { writable, derived } from 'svelte/store';
import { api } from '../utils/api.js';

const TOKEN_STORAGE_KEY = 'auth_token';

/** The currently authenticated user, or null when logged out. */
export const user = writable(null);
/** True while a login/registration request is in flight. */
export const authLoading = writable(false);
/** Last authentication error message, or null. */
export const authError = writable(null);

/** Derived flag: true when a user is logged in. */
export const isAuthenticated = derived(user, ($user) => $user !== null);

/**
 * Log in with email + password, persisting the session token.
 *
 * @param {string} email - User email.
 * @param {string} password - User password.
 * @returns {Promise<object>} The auth response (`user` + `token`).
 */
export async function login(email, password) {
  authLoading.set(true);
  authError.set(null);
  try {
    const data = await api.post('/auth/login', { email, password });
    return applyAuthResult(data);
  } catch (err) {
    authError.set(err.message || 'Login failed');
    throw err;
  } finally {
    authLoading.set(false);
  }
}

/**
 * Register a new account, persisting the session token.
 *
 * @param {string} email - User email.
 * @param {string} password - User password.
 * @param {string} name - User display name.
 * @param {string} shopName - Name of the shop to create.
 * @returns {Promise<object>} The auth response (`user` + `token`).
 */
export async function register(email, password, name, shopName) {
  authLoading.set(true);
  authError.set(null);
  try {
    const data = await api.post('/auth/register', { email, password, name, shopName });
    return applyAuthResult(data);
  } catch (err) {
    authError.set(err.message || 'Registration failed');
    throw err;
  } finally {
    authLoading.set(false);
  }
}

/**
 * Log out: invalidate the session server-side and clear local state.
 */
export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore logout errors — local state must still be cleared.
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    user.set(null);
  }
}

/**
 * Restore the session from the stored token, if any.
 */
export async function checkAuth() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    user.set(null);
    return;
  }
  try {
    const data = await api.get('/auth/me');
    user.set(data.user || data);
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    user.set(null);
  }
}

/**
 * Persist the token and user from an auth response into local state.
 *
 * @param {object} data - Auth response (`user` + `token`).
 * @returns {object} The unchanged auth response.
 */
function applyAuthResult(data) {
  if (data.token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
  }
  if (data.user) {
    user.set(data.user);
  } else {
    user.set(data);
  }
  return data;
}