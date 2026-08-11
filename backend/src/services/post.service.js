import prisma from '../utils/prisma.js';
import { PostStatus } from '../config/constants.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Allowed post status transitions, keyed by the current status.
 * @type {Record<string, string[]>}
 */
const VALID_TRANSITIONS = {
  [PostStatus.DRAFT]: [PostStatus.SCHEDULED, PostStatus.PUBLISHED],
  [PostStatus.SCHEDULED]: [PostStatus.PUBLISHED, PostStatus.DRAFT],
  [PostStatus.PUBLISHING]: [PostStatus.PUBLISHED, PostStatus.FAILED],
  [PostStatus.PUBLISHED]: [],
  [PostStatus.FAILED]: [PostStatus.DRAFT],
};

/**
 * Create a new post in DRAFT status, optionally linking accounts.
 *
 * @param {object} data - Post payload (`content`, `media`, `scheduledAt`, `accountIds`).
 * @param {string} shopId - Shop the post belongs to.
 * @param {string} createdById - User creating the post.
 * @returns {Promise<object>} The created post with its accounts.
 */
export async function createPost(data, shopId, createdById) {
  return prisma.post.create({
    data: {
      content: data.content,
      media: data.media || [],
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: PostStatus.DRAFT,
      shopId,
      createdById,
      accounts: data.accountIds
        ? { connect: data.accountIds.map((id) => ({ id })) }
        : undefined,
    },
    include: { accounts: true },
  });
}

/**
 * Schedule a post, validating the status transition and a future timestamp.
 *
 * @param {string} postId - ID of the post to schedule.
 * @param {string} scheduledAt - ISO timestamp for the scheduled publish.
 * @param {string} shopId - Shop the post belongs to (access scope).
 * @returns {Promise<object>} The updated post with its accounts.
 * @throws {ValidationError} When the transition is invalid or the time is in the past.
 */
export async function schedulePost(postId, scheduledAt, shopId) {
  const post = await getPostInShop(postId, shopId);

  if (!canTransition(post.status, PostStatus.SCHEDULED)) {
    throw new ValidationError(
      `Cannot schedule post in status ${post.status}`
    );
  }

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) {
    throw new ValidationError('Scheduled time must be in the future');
  }

  return prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.SCHEDULED, scheduledAt: scheduledDate },
    include: { accounts: true },
  });
}

/**
 * Publish a post, validating the status transition.
 *
 * @param {string} postId - ID of the post to publish.
 * @param {string} shopId - Shop the post belongs to (access scope).
 * @returns {Promise<object>} The updated post with its accounts.
 * @throws {ValidationError} When the transition is invalid.
 */
export async function publishPost(postId, shopId) {
  const post = await getPostInShop(postId, shopId);

  if (!canTransition(post.status, PostStatus.PUBLISHED)) {
    throw new ValidationError(
      `Cannot publish post in status ${post.status}`
    );
  }

  return prisma.post.update({
    where: { id: postId },
    data: {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    include: { accounts: true },
  });
}

/**
 * Load a post scoped to a shop, or throw when it does not exist.
 *
 * @param {string} postId - ID of the post to look up.
 * @param {string} shopId - Shop the post must belong to.
 * @returns {Promise<object>} The post.
 * @throws {ValidationError} When the post is not found in the shop.
 */
async function getPostInShop(postId, shopId) {
  const post = await prisma.post.findFirst({
    where: { id: postId, shopId },
  });

  if (!post) {
    throw new ValidationError('Post not found');
  }

  return post;
}

/**
 * Check whether a post may move from one status to another.
 *
 * @param {string} from - Current post status.
 * @param {string} to - Desired post status.
 * @returns {boolean} True when the transition is allowed.
 */
function canTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}