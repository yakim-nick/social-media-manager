import { writable, derived } from 'svelte/store';

const NOTIFICATION_DURATION_MS = 5000;

/** Whether the mobile sidebar is currently open. */
export const sidebarOpen = writable(false);

/** Active toast notifications. */
export const notifications = writable([]);

let nextId = 0;

/**
 * Show a toast notification that auto-dismisses after a few seconds.
 *
 * @param {string} type - Notification type (success, error, warning, info).
 * @param {string} message - Message to display.
 * @returns {number} The notification id (for manual dismissal).
 */
export function addNotification(type, message) {
  const id = ++nextId;
  notifications.update((list) => [...list, { id, type, message }]);
  setTimeout(() => {
    dismissNotification(id);
  }, NOTIFICATION_DURATION_MS);
  return id;
}

/**
 * Remove a notification from the list.
 *
 * @param {number} id - Notification id to remove.
 */
export function dismissNotification(id) {
  notifications.update((list) => list.filter((notification) => notification.id !== id));
}

/** Derived flag: true when at least one notification is visible. */
export const hasNotifications = derived(notifications, ($notifications) => $notifications.length > 0);