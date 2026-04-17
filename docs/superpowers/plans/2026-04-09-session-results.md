# Session Results Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ajouter l'ingestion et l'exposition historique des résultats de course, qualification et sprint.

**Architecture:** l'étape 3 enrichit le schéma Prisma avec trois tables de résultats, ajoute une couche d'ingestion par round à partir de Jolpica, puis expose les données via des services et routes API dédiés. L'orchestration reste centrée sur le worker historique existant pour garder une commande unique de synchronisation par année.

**Tech Stack:** Next.js, TypeScript, Prisma, PostgreSQL, Zod, tsx

---

## File Structure

- Modify: `prisma/schema.prisma`
- Modify: `lib/providers/jolpica.ts`
- Create: `lib/services/session-results-sync.service.ts`
- Create: `lib/services/session-results-query.service.ts`
- Create: `app/api/races/[year]/[round]/results/route.ts`
- Create: `app/api/races/[year]/[round]/qualifying/route.ts`
- Create: `app/api/races/[year]/[round]/sprint/route.ts`
- Modify: `lib/services/history-sync.service.ts`
- Modify: `workers/sync-history.ts`
- Create: `tests/session-results-sync.service.test.ts`
- Modify: `tests/run.ts`

### Task 1: Extend the data model for session results

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Write failing tests for race, qualifying and sprint result mapping**
- [ ] **Step 2: Verify tests fail for the missing implementation**
- [ ] **Step 3: Add the Prisma models and relations**
- [ ] **Step 4: Run Prisma generate**

### Task 2: Implement result mapping and ingestion

**Files:**
- Modify: `lib/providers/jolpica.ts`
- Create: `lib/services/session-results-sync.service.ts`
- Modify: `lib/services/history-sync.service.ts`
- Create: `tests/session-results-sync.service.test.ts`

- [ ] **Step 1: Add provider calls for race, qualifying and sprint**
- [ ] **Step 2: Add mapping helpers for the three result types**
- [ ] **Step 3: Implement per-round upsert logic**
- [ ] **Step 4: Hook the session result sync into the historical yearly sync**
- [ ] **Step 5: Run tests to confirm mapping behavior**

### Task 3: Expose query services and API routes

**Files:**
- Create: `lib/services/session-results-query.service.ts`
- Create: `app/api/races/[year]/[round]/results/route.ts`
- Create: `app/api/races/[year]/[round]/qualifying/route.ts`
- Create: `app/api/races/[year]/[round]/sprint/route.ts`

- [ ] **Step 1: Implement database-first read services**
- [ ] **Step 2: Add provider fallback for empty local data**
- [ ] **Step 3: Add strict route parameter validation**
- [ ] **Step 4: Build the app to confirm route typing and compilation**

### Task 4: Verify the milestone end-to-end

**Files:**
- Modify: `workers/sync-history.ts`

- [ ] **Step 1: Sync the Prisma schema**

Run: `npx prisma db push --accept-data-loss`
Expected: schema update succeeds

- [ ] **Step 2: Run historical sync for a populated year**

Run: `npm run worker:sync-history -- --year 2025`
Expected: schedule, standings and session results are imported

- [ ] **Step 3: Query the results API routes**

Run local requests against:
- `/api/races/2025/1/results`
- `/api/races/2025/1/qualifying`
- `/api/races/2025/1/sprint`

Expected: JSON responses contain database-backed results when available
