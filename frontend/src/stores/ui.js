import { writable, derived } from 'svelte/store';

export const sidebarOpen = writable(false);

export const notifications = writable([]);

let nextId = 0;

export function addNotification(type, message) {
  const id = ++nextId;
  notifications.update((list) => [...list, { id, type, message }]);
  setTimeout(() => {
    dismissNotification(id);
  }, 5000);
  return id;
}

export function dismissNotification(id) {
  notifications.update((list) => list.filter((n) => n.id !== id));
}

export const hasNotifications = derived(notifications, ($n) => $n.length > 0);
