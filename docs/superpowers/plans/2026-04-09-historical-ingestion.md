# Historical Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ajouter une ingestion historique réellement utile pour le calendrier, les standings et les référentiels pilotes, équipes et circuits.

**Architecture:** l'étape 2 enrichit le modèle Prisma, ajoute une couche provider Jolpica, centralise l'ingestion dans un service dédié et expose les données via l'API interne. L'ingestion est pensée pour être relançable et priorise la lecture locale en base avant fallback provider.

**Tech Stack:** Next.js, TypeScript, Prisma, PostgreSQL, Zod, tsx

---

## File Structure

- Modify: `package.json`
- Modify: `prisma/schema.prisma`
- Create: `lib/providers/jolpica.ts`
- Create: `lib/services/history-sync.service.ts`
- Create: `lib/services/races.service.ts`
- Create: `lib/services/standings.service.ts`
- Create: `app/api/races/route.ts`
- Create: `app/api/standings/drivers/route.ts`
- Create: `app/api/standings/constructors/route.ts`
- Modify: `workers/sync-static.ts`
- Create: `workers/sync-history.ts`
- Create: `tests/history-sync.service.test.ts`
- Modify: `tests/run.ts`

### Task 1: Extend the data model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Write failing tests for mapped standings and schedule ingestion expectations**
- [ ] **Step 2: Verify tests fail because ingestion services do not exist yet**
- [ ] **Step 3: Add Prisma models and provider fields**
- [ ] **Step 4: Run Prisma generate**
- [ ] **Step 5: Run tests again to keep the failure focused on missing implementation**

### Task 2: Add Jolpica provider and mapping service

**Files:**
- Create: `lib/providers/jolpica.ts`
- Create: `lib/services/history-sync.service.ts`
- Create: `tests/history-sync.service.test.ts`

- [ ] **Step 1: Add provider-level fetch helpers**
- [ ] **Step 2: Add mapping helpers for circuits, race weekends, drivers, constructors and standings**
- [ ] **Step 3: Implement year-based ingestion orchestration**
- [ ] **Step 4: Run tests to verify mapping logic passes**

### Task 3: Expose local data through services and routes

**Files:**
- Create: `lib/services/races.service.ts`
- Create: `lib/services/standings.service.ts`
- Create: `app/api/races/route.ts`
- Create: `app/api/standings/drivers/route.ts`
- Create: `app/api/standings/constructors/route.ts`

- [ ] **Step 1: Implement read services with database-first behavior**
- [ ] **Step 2: Add query validation with Zod in the routes**
- [ ] **Step 3: Add provider fallback when the local database is empty**
- [ ] **Step 4: Run tests and build to confirm the new API layer compiles**

### Task 4: Wire the historical worker

**Files:**
- Modify: `package.json`
- Modify: `workers/sync-static.ts`
- Create: `workers/sync-history.ts`

- [ ] **Step 1: Add a dedicated historical sync worker entrypoint**
- [ ] **Step 2: Parse year argument with a safe default**
- [ ] **Step 3: Call the history sync service and log progress**
- [ ] **Step 4: Update package scripts to expose the worker command**

### Task 5: Verify the milestone end-to-end

**Files:**
- Modify: `tests/run.ts`

- [ ] **Step 1: Run tests to verify mapper and service behavior**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Sync Prisma schema to PostgreSQL**

Run: `npx prisma db push`
Expected: schema update succeeds

- [ ] **Step 3: Run the historical worker for a target year**

Run: `npm run worker:sync-history -- --year 2025`
Expected: worker reports imported schedule and standings

- [ ] **Step 4: Query the API routes**

Run local requests against:
- `/api/races?year=2025`
- `/api/standings/drivers?year=2025`
- `/api/standings/constructors?year=2025`

Expected: JSON responses contain local data from the database
