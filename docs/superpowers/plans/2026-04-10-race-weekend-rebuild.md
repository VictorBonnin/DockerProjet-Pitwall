# Race Weekend Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Grand Prix detail page around circuit identity and weekend results.

**Architecture:** A local circuit reference module provides display metadata and trace assets. The race weekend service reshapes Prisma data into a hero-first page model. The page renderer becomes a focused presentation layer for hero, grid, podium, and classification lists.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, local static assets

---

### Task 1: Add circuit reference support

**Files:**
- Create: `lib/circuit-reference.ts`

- [ ] Add a local circuit catalogue with display metadata
- [ ] Expose helpers to resolve circuit length and trace identity from circuit names

### Task 2: Update race weekend service model

**Files:**
- Modify: `lib/services/race-weekend-page.service.ts`
- Test: `tests/race-weekend-page.service.test.ts`

- [ ] Rewrite the service model around hero, circuit facts, qualifying grid, sprint results, and race results
- [ ] Compute best known lap for the circuit from local `Lap` data
- [ ] Split race and sprint results into `podium` and `classification`
- [ ] Convert qualifying data into grid pairs
- [ ] Update test expectations first, then implementation

### Task 3: Rebuild the race weekend page

**Files:**
- Modify: `app/races/[year]/[round]/page.tsx`

- [ ] Replace the old dashboard-style layout
- [ ] Add centered GP hero, circuit trace, and circuit facts row
- [ ] Add qualifying grid section
- [ ] Add sprint section when present
- [ ] Add race podium and remaining classification

### Task 4: Verify

**Files:**
- Modify only if verification reveals breakage

- [ ] Run `npm test`
- [ ] Run `npm run build`
- [ ] Restart local instance and verify `/races/2025/1`
