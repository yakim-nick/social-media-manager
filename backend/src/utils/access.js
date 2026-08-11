import prisma from './prisma.js';
import { NotFoundError, ForbiddenError } from './errors.js';

/**
 * Return the IDs of every shop the given user belongs to.
 *
 * @param {string} userId - ID of the authenticated user.
 * @returns {Promise<string[]>} Shop IDs the user is a member of.
 */
export async function getUserShopIds(userId) {
  const userShops = await prisma.shop.findMany({
    where: { users: { some: { id: userId } } },
    select: { id: true },
  });
  return userShops.map((shop) => shop.id);
}

/**
 * Find a shop by id, but only when the given user is a member of it.
 *
 * @param {string} shopId - ID of the shop to look up.
 * @param {string} userId - ID of the authenticated user.
 * @param {object} [include] - Optional Prisma `include` for the shop query.
 * @returns {Promise<object|null>} The shop, or null when missing / no access.
 */
export async function findShopForUser(shopId, userId, include) {
  return prisma.shop.findFirst({
    where: { id: shopId, users: { some: { id: userId } } },
    include,
  });
}

/**
 * Load a shop the user belongs to, or throw 404 when it does not exist.
 *
 * @param {string} shopId - ID of the shop to look up.
 * @param {string} userId - ID of the authenticated user.
 * @param {object} [include] - Optional Prisma `include` for the shop query.
 * @returns {Promise<object>} The shop.
 * @throws {NotFoundError} When the shop is missing or the user has no access.
 */
export async function requireShopAccess(shopId, userId, include) {
  const shop = await findShopForUser(shopId, userId, include);
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }
  return shop;
}

/**
 * Load a post and verify the user belongs to the post's shop.
 *
 * Distinguishes a missing post (404) from a post the user cannot access (403).
 *
 * @param {string} postId - ID of the post to look up.
 * @param {string} userId - ID of the authenticated user.
 * @param {object} [include] - Optional Prisma `include` for the post query.
 * @returns {Promise<object>} The post.
 * @throws {NotFoundError} When the post does not exist.
 * @throws {ForbiddenError} When the user is not a member of the post's shop.
 */
export async function requirePostAccess(postId, userId, include) {
  const post = await prisma.post.findFirst({ where: { id: postId }, include });
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const membership = await findShopForUser(post.shopId, userId);
  if (!membership) {
    throw new ForbiddenError('You do not have access to this post');
  }

  return post;
}

/**
 * Load a social account and verify the user belongs to the account's shop.
 *
 * Distinguishes a missing account (404) from an account the user cannot access (403).
 *
 * @param {string} accountId - ID of the social account to look up.
 * @param {string} userId - ID of the authenticated user.
 * @returns {Promise<object>} The social account.
 * @throws {NotFoundError} When the account does not exist.
 * @throws {ForbiddenError} When the user is not a member of the account's shop.
 */
export async function requireAccountAccess(accountId, userId) {
  const account = await prisma.socialAccount.findFirst({ where: { id: accountId } });
  if (!account) {
    throw new NotFoundError('Account not found');
  }

  const membership = await findShopForUser(account.shopId, userId);
  if (!membership) {
    throw new ForbiddenError('You do not have access to this account');
  }

  return account;
}

/**
 * Load a media record and verify the user belongs to the media's shop.
 *
 * @param {string} mediaId - ID of the media record to look up.
 * @param {string} userId - ID of the authenticated user.
 * @returns {Promise<object>} The media record.
 * @throws {NotFoundError} When the media record does not exist.
 * @throws {ForbiddenError} When the user is not a member of the media's shop.
 */
export async function requireMediaAccess(mediaId, userId) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) {
    throw new NotFoundError('Media not found');
  }

  const membership = await findShopForUser(media.shopId, userId);
  if (!membership) {
    throw new ForbiddenError('You do not have access to this media');
  }

  return media;
}