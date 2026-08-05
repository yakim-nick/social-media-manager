#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { Platform, PostStatus, ShopRole, PrismaClient } from '@prisma/client';

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = 'DemoPassword123';
const DAY_MS = 24 * 60 * 60 * 1000;

const prisma = new PrismaClient();

function loadDotenv(filePath) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const key = line.slice(0, line.indexOf('=')).trim();
    const value = line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = value;
  }
}

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

  const existingPosts = await prisma.post.count({ where: { shopId: shop.id } });
  if (existingPosts > 0) {
    console.log(`Skipping post creation: ${existingPosts} post(s) already exist for demo shop.`);
  } else {
    const now = Date.now();
    await prisma.post.create({
      data: {
        content:
          'Planning the new seasonal menu — final tasting session is next week. Stay tuned for the big reveal.',
        status: PostStatus.DRAFT,
        shopId: shop.id,
        createdById: user.id,
      },
    });
    await prisma.post.create({
      data: {
        content:
          'Soft launch of our new pastry line this Friday. Early birds get 10% off with code EARLY10.',
        status: PostStatus.SCHEDULED,
        scheduledAt: new Date(now + DAY_MS),
        shopId: shop.id,
        createdById: user.id,
        accounts: { connect: [{ id: account.id }] },
      },
    });
    await prisma.post.create({
      data: {
        content:
          "Thank you to everyone who came to last weekend's tasting event — photos from the day are now live.",
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(now - 2 * DAY_MS),
        shopId: shop.id,
        createdById: user.id,
        accounts: { connect: [{ id: account.id }] },
      },
    });
  }

  const posts = await prisma.post.findMany({ where: { shopId: shop.id } });

  console.log('Demo data seeded:');
  console.log(`  Shop:    ${shop.name} (${shop.slug})`);
  console.log(`  User:    ${user.email} / ${DEMO_PASSWORD}`);
  console.log(`  Account: ${account.name} (${account.platform})`);
  console.log(`  Posts:   ${posts.length} (${posts.map((post) => post.status).join(', ')})`);
}

main()
  .catch((error) => {
    console.error('Failed to seed demo data:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
