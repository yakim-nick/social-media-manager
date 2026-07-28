import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { user, isAuthenticated, authLoading, login, logout } from '../auth.js';

describe('auth store', () => {
  beforeEach(() => {
    user.set(null);
    authLoading.set(false);
    localStorage.clear();
  });

  it('starts with no user', () => {
    expect(get(user)).toBeNull();
    expect(get(isAuthenticated)).toBe(false);
  });

  it('updates user and isAuthenticated on login', async () => {
    const mockUser = { id: '1', name: 'Test', email: 'test@example.com' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ user: mockUser, token: 'fake-token' }),
      text: async () => '',
    });

    await login('test@example.com', 'password123');

    expect(get(user)).toEqual(mockUser);
    expect(get(isAuthenticated)).toBe(true);
    expect(localStorage.getItem('auth_token')).toBe('fake-token');
  });

  it('clears user and token on logout', async () => {
    // Set initial authenticated state
    const mockUser = { id: '1', name: 'Test', email: 'test@example.com' };
    user.set(mockUser);
    localStorage.setItem('auth_token', 'fake-token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({}),
      text: async () => '',
    });

    await logout();

    expect(get(user)).toBeNull();
    expect(get(isAuthenticated)).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('handles login failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ message: 'Invalid credentials' }),
      text: async () => '',
    });

    await expect(login('test@example.com', 'wrong')).rejects.toThrow();
    expect(get(user)).toBeNull();
    expect(get(isAuthenticated)).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('handles network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(login('test@example.com', 'password123')).rejects.toThrow();
    expect(get(user)).toBeNull();
  });
});
