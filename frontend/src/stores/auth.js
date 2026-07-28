import { writable, derived } from 'svelte/store';
import { api } from '../utils/api.js';

export const user = writable(null);
export const authLoading = writable(false);
export const authError = writable(null);

export const isAuthenticated = derived(user, ($user) => $user !== null);

export async function login(email, password) {
  authLoading.set(true);
  authError.set(null);
  try {
    const data = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    if (data.user) {
      user.set(data.user);
    } else {
      user.set(data);
    }
    return data;
  } catch (err) {
    authError.set(err.message || 'Login failed');
    throw err;
  } finally {
    authLoading.set(false);
  }
}

export async function register(email, password, name, shopName) {
  authLoading.set(true);
  authError.set(null);
  try {
    const data = await api.post('/auth/register', { email, password, name, shopName });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    if (data.user) {
      user.set(data.user);
    } else {
      user.set(data);
    }
    return data;
  } catch (err) {
    authError.set(err.message || 'Registration failed');
    throw err;
  } finally {
    authLoading.set(false);
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore logout errors
  } finally {
    localStorage.removeItem('auth_token');
    user.set(null);
  }
}

export async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    user.set(null);
    return;
  }
  try {
    const data = await api.get('/auth/me');
    user.set(data.user || data);
  } catch {
    localStorage.removeItem('auth_token');
    user.set(null);
  }
}
