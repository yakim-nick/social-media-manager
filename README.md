# Social Media Manager for Small Shops

Full-stack social media management platform. Schedule posts, manage accounts, and track analytics.

## Stack

- **Backend**: Node.js native HTTP, Prisma ORM, PostgreSQL, JWT + sessions
- **Frontend**: Svelte 4, Vite, Tailwind CSS, reactive stores
- **Infra**: Docker Compose, GitHub Actions, Vercel

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
