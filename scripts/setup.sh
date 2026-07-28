#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Social Media Manager - Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ── Check prerequisites ────────────────────────────────────────────────

# Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed.${NC}"
  echo "Please install Node.js >= 20 from https://nodejs.org/"
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo -e "${RED}Error: Node.js >= 20 is required (found v$(node -v)).${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm is not installed.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm -v)"

# Docker (optional, for containerized dev)
DOCKER_AVAILABLE=false
if command -v docker &> /dev/null; then
  DOCKER_AVAILABLE=true
  echo -e "${GREEN}✓${NC} Docker $(docker -v 2>/dev/null || echo 'found')"
else
  echo -e "${YELLOW}⚠${NC} Docker not found — will use local database instead."
fi

echo ""

# ── Create .env if missing ─────────────────────────────────────────────

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$PROJECT_ROOT/.env" ]; then
  if [ -f "$PROJECT_ROOT/.env.example" ]; then
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo -e "${GREEN}✓${NC} Created .env from .env.example"
  else
    echo -e "${YELLOW}⚠${NC} .env.example not found — skipping .env creation"
  fi
else
  echo -e "${YELLOW}⚠${NC} .env already exists — skipping"
fi

echo ""

# ── Install dependencies ────────────────────────────────────────────────

echo -e "${GREEN}Installing backend dependencies...${NC}"
cd "$PROJECT_ROOT/backend"
npm install
echo ""

echo -e "${GREEN}Installing frontend dependencies...${NC}"
cd "$PROJECT_ROOT/frontend"
npm install
echo ""

# ── Generate Prisma client ──────────────────────────────────────────────

echo -e "${GREEN}Generating Prisma client...${NC}"
cd "$PROJECT_ROOT/backend"
npx prisma generate
echo ""

# ── Summary ──────────────────────────────────────────────────────────────

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "To start developing:"
echo ""
echo -e "  Option A — Local development (requires PostgreSQL running):"
echo -e "    ${YELLOW}cd backend && npm run dev${NC}    # starts backend on :3001"
echo -e "    ${YELLOW}cd frontend && npm run dev${NC}   # starts frontend on :5173"
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
  echo -e "  Option B — Docker development (PostgreSQL only):"
  echo -e "    ${YELLOW}docker compose -f docker-compose.dev.yml up -d${NC}"
  echo ""
  echo -e "  Option C — Full stack with Docker:"
  echo -e "    ${YELLOW}docker compose up -d${NC}"
  echo ""
  echo -e "    Frontend : http://localhost"
  echo -e "    Backend  : http://localhost:3001/api/v1"
  echo ""
fi

echo -e "  Run Prisma migrations:"
echo -e "    ${YELLOW}cd backend && npx prisma migrate dev${NC}"
echo ""
echo -e "  Seed the database:"
echo -e "    ${YELLOW}cd backend && npx prisma db seed${NC}"
