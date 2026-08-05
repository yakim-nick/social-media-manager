.PHONY: setup db-up db-down backend frontend test migrate docker-up docker-down

setup:
	cd backend && npm install
	cd backend && npx prisma generate
	cd frontend && npm install

db-up:
	docker compose -f docker-compose.dev.yml up -d

db-down:
	docker compose -f docker-compose.dev.yml down

backend:
	cd backend && npm run dev

frontend:
	cd frontend && npm run dev

test:
	cd backend && npm test
	cd frontend && npm test

migrate:
	cd backend && npm run prisma:migrate

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down
