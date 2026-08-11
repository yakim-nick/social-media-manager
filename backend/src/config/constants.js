/**
 * Supported social media platforms.
 * @enum {string}
 */
export const Platform = Object.freeze({
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
  TWITTER: 'TWITTER',
  LINKEDIN: 'LINKEDIN',
  TIKTOK: 'TIKTOK',
});

/**
 * Lifecycle states a post can be in.
 * @enum {string}
 */
export const PostStatus = Object.freeze({
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHING: 'PUBLISHING',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
});

/**
 * Roles a user can hold within a shop.
 * @enum {string}
 */
export const ShopRole = Object.freeze({
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
});

/**
 * Shared defaults for paginated list endpoints.
 */
export const PAGINATION_DEFAULTS = Object.freeze({
  page: 1,
  limit: 20,
  maxLimit: 100,
});