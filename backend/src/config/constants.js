export const Platform = Object.freeze({
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
  TWITTER: 'TWITTER',
  LINKEDIN: 'LINKEDIN',
  TIKTOK: 'TIKTOK',
});

export const PostStatus = Object.freeze({
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHING: 'PUBLISHING',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
});

export const ShopRole = Object.freeze({
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
});

export const PAGINATION_DEFAULTS = Object.freeze({
  page: 1,
  limit: 20,
  maxLimit: 100,
});
