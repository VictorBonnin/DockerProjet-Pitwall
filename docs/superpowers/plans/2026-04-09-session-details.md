# Session Details Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ajouter l'ingestion des laps, pit stops et weather samples via OpenF1 pour les sessions historiques compatibles.

**Architecture:** l'étape 4 enrichit le schéma Prisma avec les tables de détail, ajoute un provider OpenF1 et un mécanisme de rapprochement entre sessions internes et sessions OpenF1, puis expose les données détaillées via des routes API dédiées. L'ingestion reste pilotée par le worker historique, avec un périmètre ciblé sur les sessions de course.

**Tech Stack:** Next.js, TypeScript, Prisma, PostgreSQL, OpenF1, Zod, tsx

---

## File Structure

- Modify: `prisma/schema.prisma`
- Create: `lib/providers/openf1.ts`
- Create: `lib/services/session-details-sync.service.ts`
- Create: `lib/services/session-details-query.service.ts`
- Modify: `lib/services/history-sync.service.ts`
- Create: `app/api/races/[year]/[round]/laps/route.ts`
- Create: `app/api/races/[year]/[round]/pit-stops/route.ts`
- Create: `app/api/races/[year]/[round]/weather/route.ts`
- Create: `tests/session-details-sync.service.test.ts`
- Modify: `tests/run.ts`

### Task 1: Extend the data model for detailed session data

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Write failing tests for OpenF1 detail mapping**
- [ ] **Step 2: Verify tests fail because detail sync service does not exist yet**
- [ ] **Step 3: Add Prisma models and relations for laps, pit stops, and weather**
- [ ] **Step 4: Run Prisma generate**

### Task 2: Implement OpenF1 matching and ingestion

**Files:**
- Create: `lib/providers/openf1.ts`
- Create: `lib/services/session-details-sync.service.ts`
- Modify: `lib/services/history-sync.service.ts`
- Create: `tests/session-details-sync.service.test.ts`

- [ ] **Step 1: Add provider calls for sessions, laps, pit, and weather**
- [ ] **Step 2: Add mapping helpers for session matching and detail payloads**
- [ ] **Step 3: Persist `providerSessionKey` onto matching internal sessions**
- [ ] **Step 4: Ingest detail data for race sessions**
- [ ] **Step 5: Run tests to confirm the mapping logic**

### Task 3: Expose detail query routes

**Files:**
- Create: `lib/services/session-details-query.service.ts`
- Create: `app/api/races/[year]/[round]/laps/route.ts`
- Create: `app/api/races/[year]/[round]/pit-stops/route.ts`
- Create: `app/api/races/[year]/[round]/weather/route.ts`

- [ ] **Step 1: Implement database-first query services**
- [ ] **Step 2: Add graceful fallback behavior for missing local detail data**
- [ ] **Step 3: Add strict parameter validation in routes**
- [ ] **Step 4: Build the app to validate route typing and compilation**

### Task 4: Verify the milestone end-to-end

**Files:**
- Modify: `lib/services/history-sync.service.ts`

- [ ] **Step 1: Sync the Prisma schema**

Run: `npx prisma db push --accept-data-loss`
Expected: schema update succeeds

- [ ] **Step 2: Run historical sync for an OpenF1-compatible year**

Run: `npm run worker:sync-history -- --year 2025`
Expected: sessions are matched and detail data is imported

- [ ] **Step 3: Query the detail API routes**

Run local requests against:
- `/api/races/2025/1/laps`
- `/api/races/2025/1/pit-stops`
- `/api/races/2025/1/weather`

Expected: JSON responses contain database-backed detail data when available
