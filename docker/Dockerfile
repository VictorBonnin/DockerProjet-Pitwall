FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage dédié aux migrations — léger, sans build Next.js
FROM node:22-alpine AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
RUN npx prisma generate
CMD ["npx", "prisma", "db", "push"]

FROM node:22-alpine AS seeder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY lib ./lib
COPY workers ./workers
COPY tsconfig.json ./
RUN npx prisma generate
CMD ["npx", "tsx", "workers/sync-history.ts"]

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Build-time placeholder values required by Zod env validation.
# These are NOT embedded in the runtime image (multi-stage build).
ENV DATABASE_URL="postgresql://build:build@build:5432/build"
ENV REDIS_URL="redis://build:6379"
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "server.js"]
