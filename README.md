# Social Media Manager for Small Shops

[![CI](https://github.com/yakim-nick/social-media-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/yakim-nick/social-media-manager/actions/workflows/ci.yml)

## About

```
  ┌─────────────────────────────────────────────────────────────┐
  │                 SOCIAL MEDIA MANAGER                        │
  │         ┌─────────────────────────────────────┐             │
  │         │  Goal: One dashboard to rule them   │             │
  │         │  all. No more hopping between       │             │
  │  ┌──────┤  Instagram, Facebook, Twitter,       ├──────┐      │
  │  │      │  LinkedIn, and TikTok.              │      │      │
  │  │      └─────────────────────────────────────┘      │      │
  │  │                                                    │      │
  │  │  ┌──────────────┐   ┌──────────────┐              │      │
  │  │  │   BAKE IT    │   │  SCHEDULE IT │              │      │
  │  │  │ Create once, │──▶│ Pick a date, │              │      │
  │  │  │ ship to all  │   │  we post it   │              │      │
  │  │  └──────────────┘   └──────┬───────┘              │      │
  │  │                            │                       │      │
  │  │  ┌──────────────┐   ┌──────▼───────┐              │      │
  │  │  │  TRACK IT    │◀──│  MANAGE IT   │              │      │
  │  │  │ See what     │   │  Link/unlink │              │      │
  │  │  │ works, pivot │   │  accounts    │              │      │
  │  │  └──────────────┘   └──────────────┘              │      │
  │  │                                                    │      │
  │  │  Scope: Small shops with 1-5 owners/employees      │      │
  │  │  who need social media to work, not to *manage*    │      │
  │  │  social media.                                     │      │
  │  └────────────────────────────────────────────────────┘      │
  │                                                              │
  │  "Post like a pro. Pay like a shop."                         │
  └─────────────────────────────────────────────────────────────┘
```

SMM for Small Shops is a lean, production-grade platform that lets local businesses manage their entire social presence from one place. Built for the shop owner who wants to spend 15 minutes a week on social media, not 15 hours.

---

## Technical Architecture

### Philosophy

Zero external HTTP frameworks. The backend uses Node.js's built-in `http.createServer` with a custom composable middleware chain and regex-based router. This eliminates the dependency surface of Express/Koa while providing identical ergonomics — middleware `(req, res, next)` signatures, path parameters, error middleware with arity-4 detection, and async-aware error propagation. The entire server framework is ~150 lines across 5 files.

### Backend (`backend/`)

**Language & Runtime**: Node.js 20+ with ES modules (`"type": "module"`). Native `--watch` for development hot-reload.

**HTTP Layer** — Custom, zero-dependency (files in `src/server/`):
- `router.js` — Routes registered via `.get()/.post()/.put()/.delete()/.patch()` with `:param` extraction to `req.params`. Regex-based matching of pathname against stored route patterns.
- `middleware.js` — `compose()` chains an array of `(req, res, next)` functions sequentially. Error middleware (arity === 4) is auto-detected and invoked when `next(err)` is called. All middleware executes in a single `try/catch` scope — synchronous throws become `next(error)`.
- `bodyParser.js` — Streams `req` chunks up to a 1MB ceiling. `JSON.parse` on complete payload. Non-JSON `Content-Type` or GET/HEAD/DELETE pass through untouched (delegates to multer for multipart).
- `response.js` — Attaches `res.json()`, `res.paginated()`, `res.error()`, `res.sendFile()` to every response object.

**Why not Express?** Express 4.x bundles 15+ middleware dependencies, has known prototype-pollution vectors in older versions, and its `req`/`res` monkey-patching can conflict with native Node streams in edge cases. A 150-line custom server is auditable in 10 minutes, has zero CVEs by construction, and teaches the team exactly how HTTP works.

**ORM & Database**:
- **Prisma 5** — Schema-first ORM. Generates a type-safe client from `prisma/schema.prisma`. Migrations via `prisma migrate dev`/`prisma migrate deploy`. Connection pooling via `@prisma/client` singleton in `src/utils/prisma.js`.
- **PostgreSQL 16** — 7 models: `User`, `Session`, `Shop`, `SocialAccount`, `Post`, `Media`, `Analytics`. Composite unique constraints on `(platform, accountId)` and `(accountId, date)`. Enum types (`Platform`, `PostStatus`, `ShopRole`) mapped to Prisma enums. Indexes on foreign keys and frequently filtered columns (`email`, `shopId`, `status`, `scheduledAt`).
- **Why Prisma?** Auto-generated migrations prevent schema drift. The Prisma Client's `select`/`include` API prevents over-fetching (no `.select('*')` by accident). Compared to raw SQL or Knex, Prisma eliminates manual JOIN management for relations like `User -> Session` or `Post -> SocialAccount`.

**Authentication**:
- **JWT (jsonwebtoken)** + **Server Sessions** — Each login creates a `Session` record storing the JWT. Every protected route verifies the JWT signature, then checks the session exists and hasn't expired. Logout deletes the session record — immediate revocation without a blocklist. Token expiry: 7 days (configurable via `JWT_EXPIRES_IN`).
- **Password Storage**: bcryptjs with salt rounds. No plaintext logging. Change password invalidates all existing sessions.
- **Why JWT + sessions?** Stateless JWT alone can't be revoked. Sessions alone require a DB lookup on every request (negating JWT's main benefit). The hybrid gives fast token verification + instant revocation.

**Validation**: Zod schemas in `src/middleware/validate.js`. Returns structured `{ error: { code, details: [{ path, message }] } }` on 400.

**Rate Limiting**: In-memory sliding window (`src/middleware/rateLimiter.js`). Tracks request counts per IP with a `Map<string, { count, resetAt }>`. Periodic cleanup via `setInterval` every 60s. Default: 100 requests/minute per IP.

**Error Handling**: Custom `AppError` class hierarchy (`NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`) with `statusCode` and `code` properties. Global error middleware catches all throwables.

**File Uploads**: `multer` configured with disk storage, MIME filtering (images: JPEG/PNG/GIF/WebP, video: MP4/WebM), size limit (10MB default). Metadata persisted in `Media` table; file stored under `uploads/`.

**Testing**: Jest with `--experimental-vm-modules` (ESM support). 9 test suites, 172 tests. Controllers are tested with mocked Prisma via `jest.unstable_mockModule`. Services tested with real bcrypt and jsonwebtoken — only the database is mocked.

### Frontend (`frontend/`)

**Framework**: Svelte 4 with Vite 5.

**Why Svelte?** Svelte compiles to vanilla JS at build time — no virtual DOM, no hydration cost. For a dashboard-heavy SPA with frequent store updates, Svelte's `$:` reactive statements and `writable` stores offer fine-grained reactivity without a diffing overhead. Bundle size after Vite build: ~113KB JS + 26KB CSS gzipped.

**State Management**: Native Svelte stores (`writable`, `derived`):
- `auth.js` — User state, `login`/`logout`/`register`/`checkAuth` actions. Token persisted in `localStorage`.
- `posts.js` — Post CRUD with pagination cursor. Optimistic updates on schedule/publish.
- `accounts.js` — Social account lifecycle.
- `analytics.js` — Date-range query state.
- `ui.js` — Sidebar toggle, toast notification queue (auto-dismiss 5s).

**Why no Redux/Zustand?** Svelte's built-in store contract (`subscribe`/`set`/`update`) covers all required patterns — cross-component state, derived values, and async actions. Adding Redux would increase bundle size by ~30KB and add boilerplate with zero reactivity benefit.

**Routing**: Custom hash-based SPA router in `App.svelte`. Guards protected routes against unauthenticated state; redirects to `/login`.

**Styling**: Tailwind CSS 3.4 with a custom brand palette (indigo primary). Design system utilities (`.btn`, `.input`, `.card`) in `global.css`. Mobile-first responsive: sidebar collapses to hamburger overlay below 768px.

**HTTP Client**: Zero-dependency `fetch` wrapper in `src/utils/api.js` — auto-attaches Bearer token, parses JSON, normalizes errors, triggers logout on 401.

**Pages (7)**: Login, Register, Dashboard (stats + recent posts), Posts (filterable list + pagination), PostEditor (content + media upload + account selection + date picker), Analytics (CSS bar charts — no chart library), Settings (profile + password + connected accounts).

**Components (10)**: Layout, Sidebar, StatusBadge, PostCard, Modal, Notification, Pagination, LoadingSpinner, EmptyState, FileUpload (drag & drop with preview).

**Testing**: Vitest + jsdom + @testing-library/svelte. 5 test suites, 26 tests.

### Deployment

- **Docker**: Multi-stage builds. Backend runs as non-root `appuser`. Frontend served by Nginx Alpine with SPA fallback and `/api/` reverse proxy to backend. Healthcheck on backend (`/api/v1/health`).
- **Docker Compose**: PostgreSQL 16 + Backend + Frontend with `depends_on: condition: service_healthy`.
- **Vercel**: `vercel.json` configures Svelte framework, SPA rewrites, `/api/` proxy.
- **CI**: GitHub Actions workflow (lint → test → build Docker images with GHA cache). Place at `.github/workflows/ci.yml` to activate.

## Quick Start

```bash
# 1. Copy env and edit
cp .env.example .env

# 2. Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# 3. Install & migrate
cd backend && npm install && npx prisma migrate dev && cd ..

# 4. Start backend (port 3001)
cd backend && npm run dev &

# 5. Start frontend (port 5173)
cd frontend && npm install && npm run dev
```

## Docker (full stack)

```bash
docker compose up --build
```

## Tests

```bash
cd backend && npm test    # 172 tests
cd frontend && npm test   # 26 tests
```

## API Endpoints

All under `/api/v1`:
- `POST /auth/register|login|logout` — auth
- `GET /auth/me` — current user
- `CRUD /shops` — shop management
- `CRUD /accounts` — social accounts
- `CRUD /posts` — posts + schedule/publish
- `POST /media/upload` — file upload
- `GET /analytics` — engagement metrics

## CI/CD

CI workflow at `ci-workflow.yml` — move to `.github/workflows/ci.yml` to activate (requires `workflow` scope on your GitHub token).

## Deploy

- **Backend**: Docker to AWS ECS/EC2 or any Docker host
- **Frontend**: `cd frontend && npm run build && vercel --prod`
