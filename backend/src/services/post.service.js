import prisma from '../utils/prisma.js';
import { PostStatus } from '../config/constants.js';
import { ValidationError } from '../utils/errors.js';

const VALID_TRANSITIONS = {
  [PostStatus.DRAFT]: [PostStatus.SCHEDULED, PostStatus.PUBLISHED],
  [PostStatus.SCHEDULED]: [PostStatus.PUBLISHED, PostStatus.DRAFT],
  [PostStatus.PUBLISHING]: [PostStatus.PUBLISHED, PostStatus.FAILED],
  [PostStatus.PUBLISHED]: [],
  [PostStatus.FAILED]: [PostStatus.DRAFT],
};

function canTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

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

export async function schedulePost(postId, scheduledAt, shopId) {
  const post = await prisma.post.findFirst({
    where: { id: postId, shopId },
  });

  if (!post) {
    throw new ValidationError('Post not found');
  }

  if (!canTransition(post.status, PostStatus.SCHEDULED)) {
    throw new ValidationError(
      `Cannot schedule post in status ${post.status}`
    );
  }

  const scheduleDate = new Date(scheduledAt);
  if (scheduleDate <= new Date()) {
    throw new ValidationError('Scheduled time must be in the future');
  }

  return prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.SCHEDULED, scheduledAt: scheduleDate },
    include: { accounts: true },
  });
}

export async function publishPost(postId, shopId) {
  const post = await prisma.post.findFirst({
    where: { id: postId, shopId },
  });

  if (!post) {
    throw new ValidationError('Post not found');
  }

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
