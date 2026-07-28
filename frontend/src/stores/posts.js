import { writable } from 'svelte/store';
import { api } from '../utils/api.js';

export const posts = writable([]);
export const postsLoading = writable(false);
export const postsError = writable(null);
export const postsPagination = writable({ page: 1, totalPages: 1, total: 0 });

export async function fetchPosts(params = {}) {
  postsLoading.set(true);
  postsError.set(null);
  try {
    const data = await api.get('/posts', params);
    posts.set(data.posts || data.data || []);
    if (data.pagination || (data.page !== undefined)) {
      postsPagination.set({
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        total: data.total || 0,
      });
    }
    return data;
  } catch (err) {
    postsError.set(err.message || 'Failed to fetch posts');
    throw err;
  } finally {
    postsLoading.set(false);
  }
}

export async function createPost(data) {
  const result = await api.post('/posts', data);
  posts.update((list) => [result.post || result, ...list]);
  return result;
}

export async function updatePost(id, data) {
  const result = await api.put(`/posts/${id}`, data);
  posts.update((list) =>
    list.map((p) => ((p.id || p._id) === id ? { ...p, ...(result.post || result) } : p))
  );
  return result;
}

export async function deletePost(id) {
  await api.delete(`/posts/${id}`);
  posts.update((list) => list.filter((p) => (p.id || p._id) !== id));
}

export async function schedulePost(id, scheduledAt) {
  const result = await api.put(`/posts/${id}/schedule`, { scheduledAt });
  posts.update((list) =>
    list.map((p) => ((p.id || p._id) === id ? { ...p, ...(result.post || result) } : p))
  );
  return result;
}

export async function publishPost(id) {
  const result = await api.post(`/posts/${id}/publish`);
  posts.update((list) =>
    list.map((p) => ((p.id || p._id) === id ? { ...p, ...(result.post || result) } : p))
  );
  return result;
}
