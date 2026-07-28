import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  sidebarOpen,
  notifications,
  addNotification,
  dismissNotification,
  hasNotifications,
} from '../ui.js';

describe('ui store', () => {
  beforeEach(() => {
    sidebarOpen.set(false);
    notifications.set([]);
    vi.useFakeTimers();
  });

  it('sidebarOpen starts closed', () => {
    expect(get(sidebarOpen)).toBe(false);
  });

  it('adds a notification', () => {
    const id = addNotification('success', 'Operation successful');
    const notifs = get(notifications);
    expect(notifs).toHaveLength(1);
    expect(notifs[0].type).toBe('success');
    expect(notifs[0].message).toBe('Operation successful');
    expect(notifs[0].id).toBe(id);
    expect(get(hasNotifications)).toBe(true);
  });

  it('auto-dismisses notification after 5 seconds', () => {
    addNotification('info', 'Auto dismiss');
    expect(get(notifications)).toHaveLength(1);

    vi.advanceTimersByTime(5000);
    expect(get(notifications)).toHaveLength(0);
    expect(get(hasNotifications)).toBe(false);
  });

  it('dismisses a specific notification', () => {
    const id1 = addNotification('success', 'First');
    const id2 = addNotification('warning', 'Second');

    expect(get(notifications)).toHaveLength(2);

    dismissNotification(id1);
    const remaining = get(notifications);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(id2);
  });

  it('toggles sidebarOpen', () => {
    sidebarOpen.set(true);
    expect(get(sidebarOpen)).toBe(true);

    sidebarOpen.set(false);
    expect(get(sidebarOpen)).toBe(false);
  });
});
