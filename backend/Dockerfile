FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY . .

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
RUN mkdir -p uploads && chown -R appuser:nodejs /app
USER appuser
EXPOSE 3001
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"
CMD ["node", "src/index.js"]
