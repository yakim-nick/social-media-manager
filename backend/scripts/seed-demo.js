#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { Platform, PostStatus, ShopRole, PrismaClient } from '@prisma/client';

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = 'DemoPassword123';
const DAY_MS = 24 * 60 * 60 * 1000;

const prisma = new PrismaClient();

/**
 * Seed the database with a demo shop, owner, account and a few sample posts.
 * Safe to re-run: existing records are updated in place and posts are only
 * created once.
 */
async function main() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const shop = await prisma.shop.upsert({
    where: { slug: 'demo-shop' },
    update: {},
    create: {
      name: 'Demo Shop',
      slug: 'demo-shop',
      timezone: 'UTC',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: { shopId: shop.id },
    create: {
      email: 'demo@example.com',
      name: 'Demo Owner',
      password: hashedPassword,
      role: ShopRole.OWNER,
      shopId: shop.id,
    },
  });

  const account = await prisma.socialAccount.upsert({
    where: { platform_accountId: { platform: Platform.INSTAGRAM, accountId: 'demo-instagram' } },
    update: { shopId: shop.id, isActive: true },
    create: {
      platform: Platform.INSTAGRAM,
      accountId: 'demo-instagram',
      name: 'Demo Shop Instagram',
      shopId: shop.id,
      isActive: true,
    },
  });

  await seedDemoPosts(shop.id, user.id, account.id);

  const posts = await prisma.post.findMany({ where: { shopId: shop.id } });

  console.log('Demo data seeded:');
  console.log(`  Shop:    ${shop.name} (${shop.slug})`);
  console.log(`  User:    ${user.email} / ${DEMO_PASSWORD}`);
  console.log(`  Account: ${account.name} (${account.platform})`);
  console.log(`  Posts:   ${posts.length} (${posts.map((post) => post.status).join(', ')})`);
}

/**
 * Create sample posts for the demo shop if none exist yet.
 *
 * @param {string} shopId - ID of the demo shop.
 * @param {string} userId - ID of the demo owner.
 * @param {string} accountId - ID of the demo social account.
 */
async function seedDemoPosts(shopId, userId, accountId) {
  const existingPosts = await prisma.post.count({ where: { shopId } });
  if (existingPosts > 0) {
    console.log(`Skipping post creation: ${existingPosts} post(s) already exist for demo shop.`);
    return;
  }

  const now = Date.now();
  await prisma.post.create({
    data: {
      content:
        'Planning the new seasonal menu — final tasting session is next week. Stay tuned for the big reveal.',
      status: PostStatus.DRAFT,
      shopId,
      createdById: userId,
    },
  });
  await prisma.post.create({
    data: {
      content:
        'Soft launch of our new pastry line this Friday. Early birds get 10% off with code EARLY10.',
      status: PostStatus.SCHEDULED,
      scheduledAt: new Date(now + DAY_MS),
      shopId,
      createdById: userId,
      accounts: { connect: [{ id: accountId }] },
    },
  });
  await prisma.post.create({
    data: {
      content:
        "Thank you to everyone who came to last weekend's tasting event — photos from the day are now live.",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(now - 2 * DAY_MS),
      shopId,
      createdById: userId,
      accounts: { connect: [{ id: accountId }] },
    },
  });
}

main()
  .catch((error) => {
    console.error('Failed to seed demo data:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());