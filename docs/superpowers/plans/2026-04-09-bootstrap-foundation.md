# Bootstrap Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** construire le premier jalon exécutable de PitWall avec Next.js, Prisma, PostgreSQL, Redis et Docker, en suivant l'architecture du README.

**Architecture:** le jalon crée un squelette backend-first aligné sur la cible du projet. L'application web, les routes API, la couche `lib`, les workers, Prisma et l'infrastructure Docker sont mis en place dès maintenant pour éviter une refonte précoce.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Redis, Docker Compose, Zod, ioredis

---

## File Structure

- Create: `package.json`
- Create: `package-lock.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `postcss.config.js`
- Create: `eslint.config.mjs`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `app/api/health/route.ts`
- Create: `app/api/live/sessions/current/route.ts`
- Create: `lib/env.ts`
- Create: `lib/db/prisma.ts`
- Create: `lib/db/redis.ts`
- Create: `lib/services/live-query.service.ts`
- Create: `prisma/schema.prisma`
- Create: `workers/sync-static.ts`
- Create: `workers/sync-live.ts`
- Create: `workers/consolidate-session.ts`
- Create: `docker/Dockerfile`
- Create: `docker/docker-compose.yml`
- Create: `docs/superpowers/specs/2026-04-09-bootstrap-foundation-design.md`
- Create: `docs/superpowers/plans/2026-04-09-bootstrap-foundation.md`

### Task 1: Scaffold the application and toolchain

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `postcss.config.js`
- Create: `eslint.config.mjs`
- Create: `.gitignore`

- [ ] **Step 1: Define package scripts and dependencies**

Create a `package.json` with scripts for `dev`, `build`, `start`, Prisma commands and worker execution.

- [ ] **Step 2: Add TypeScript and Next.js configuration**

Create `tsconfig.json`, `next.config.ts`, `next-env.d.ts` and `postcss.config.js`.

- [ ] **Step 3: Add repository hygiene files**

Create `.gitignore` and ESLint config to support a clean bootstrap.

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: packages install successfully and `package-lock.json` is created.

### Task 2: Create the base UI and API shell

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `app/api/health/route.ts`
- Create: `app/api/live/sessions/current/route.ts`

- [ ] **Step 1: Create the root layout and global stylesheet**

Add a minimal but clean application shell.

- [ ] **Step 2: Create the landing page**

Add a simple homepage that explains the role of PitWall and points to useful endpoints.

- [ ] **Step 3: Add the health endpoint**

Expose a route returning application, database and redis health data.

- [ ] **Step 4: Add the live session endpoint**

Expose a route that returns the current live session or `null` without failing when the database is empty.

### Task 3: Configure environment and data access

**Files:**
- Create: `.env.example`
- Create: `lib/env.ts`
- Create: `lib/db/prisma.ts`
- Create: `lib/db/redis.ts`
- Create: `lib/services/live-query.service.ts`

- [ ] **Step 1: Define required environment variables**

Document `DATABASE_URL` and `REDIS_URL` in `.env.example`.

- [ ] **Step 2: Validate runtime environment**

Create `lib/env.ts` with strict validation via `zod`.

- [ ] **Step 3: Implement Prisma client bootstrap**

Create a singleton Prisma client for Next.js and workers.

- [ ] **Step 4: Implement Redis client bootstrap**

Create a singleton Redis client with lazy connection.

- [ ] **Step 5: Implement the first live query service**

Create a service that reads the current `LiveSession` from the database.

### Task 4: Define the initial Prisma schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Define datasource and generator**

Configure Prisma for PostgreSQL.

- [ ] **Step 2: Add minimal domain models**

Add models for seasons, circuits, race weekends, sessions, drivers, constructors and live sessions.

- [ ] **Step 3: Run Prisma generate**

Run: `npx prisma generate`
Expected: Prisma client is generated without schema errors.

### Task 5: Add infrastructure and workers

**Files:**
- Create: `workers/sync-static.ts`
- Create: `workers/sync-live.ts`
- Create: `workers/consolidate-session.ts`
- Create: `docker/Dockerfile`
- Create: `docker/docker-compose.yml`

- [ ] **Step 1: Create stub workers**

Each worker should boot, connect to Prisma if needed, log its role clearly, then exit cleanly.

- [ ] **Step 2: Add Docker assets**

Create a `Dockerfile` for the app and a `docker-compose.yml` for PostgreSQL and Redis.

- [ ] **Step 3: Prepare local infrastructure startup**

Document the expected local commands through scripts or clear config defaults.

### Task 6: Verify the milestone

**Files:**
- Modify: `package.json`
- Modify: `app/api/health/route.ts`

- [ ] **Step 1: Start infrastructure**

Run: `docker compose -f docker/docker-compose.yml up -d`
Expected: PostgreSQL and Redis containers start.

- [ ] **Step 2: Synchronize Prisma schema**

Run: `npx prisma db push`
Expected: database schema is created successfully.

- [ ] **Step 3: Start the Next.js app**

Run: `npm run dev`
Expected: local web server starts successfully.

- [ ] **Step 4: Verify API responses**

Call `/api/health` and `/api/live/sessions/current`.
Expected: both routes return JSON successfully.

- [ ] **Step 5: Verify workers**

Run: `npm run worker:sync-static`, `npm run worker:sync-live`, `npm run worker:consolidate`
Expected: commands exit cleanly with informative logs.
