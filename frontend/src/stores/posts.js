import { writable } from 'svelte/store';
import { api } from '../utils/api.js';

/** List of posts for the current view. */
export const posts = writable([]);
/** True while a post fetch is in flight. */
export const postsLoading = writable(false);
/** Last post-fetch error message, or null. */
export const postsError = writable(null);
/** Pagination metadata for the current post list. */
export const postsPagination = writable({ page: 1, totalPages: 1, total: 0 });

/**
 * Fetch posts with optional filters, updating the list and pagination state.
 *
 * @param {object} [params] - Query parameters (status, shopId, page, limit...).
 * @returns {Promise<object>} The raw API response.
 */
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

/**
 * Create a post and prepend it to the list.
 *
 * @param {object} data - Post payload.
 * @returns {Promise<object>} The created post.
 */
export async function createPost(data) {
  const result = await api.post('/posts', data);
  posts.update((list) => [result.post || result, ...list]);
  return result;
}

/**
 * Update a post and merge the result into the list.
 *
 * @param {string} id - Post ID.
 * @param {object} data - Fields to update.
 * @returns {Promise<object>} The updated post.
 */
export async function updatePost(id, data) {
  const result = await api.put(`/posts/${id}`, data);
  replacePostInList(id, result.post || result);
  return result;
}

/**
 * Delete a post and remove it from the list.
 *
 * @param {string} id - Post ID.
 */
export async function deletePost(id) {
  await api.delete(`/posts/${id}`);
  posts.update((list) => list.filter((post) => (post.id || post._id) !== id));
}

/**
 * Schedule a post and merge the result into the list.
 *
 * @param {string} id - Post ID.
 * @param {string} scheduledAt - ISO timestamp for the scheduled publish.
 * @returns {Promise<object>} The updated post.
 */
export async function schedulePost(id, scheduledAt) {
  const result = await api.put(`/posts/${id}/schedule`, { scheduledAt });
  replacePostInList(id, result.post || result);
  return result;
}

/**
 * Publish a post and merge the result into the list.
 *
 * @param {string} id - Post ID.
 * @returns {Promise<object>} The updated post.
 */
export async function publishPost(id) {
  const result = await api.post(`/posts/${id}/publish`);
  replacePostInList(id, result.post || result);
  return result;
}

/**
 * Replace a post in the list with its updated version.
 *
 * @param {string} id - Post ID to match.
 * @param {object} updatedPost - Updated post data to merge in.
 */
function replacePostInList(id, updatedPost) {
  posts.update((list) =>
    list.map((post) => ((post.id || post._id) === id ? { ...post, ...updatedPost } : post))
  );
}