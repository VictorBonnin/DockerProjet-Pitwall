# Official Assets And Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** intégrer des assets officiels locaux pour pilotes et équipes, puis rendre la navigation réelle entre les pages principales du site.

**Architecture:** un pipeline d'assets officiel télécharge et stocke localement les images, tandis que Prisma conserve seulement les chemins. Les pages frontend lisent ensuite ces chemins via des services dédiés et exposent une navigation cohérente entre home, races, drivers et teams.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind CSS v4, Prisma, Node workers/scripts, PostgreSQL

---

## File Structure

- Modify: `prisma/schema.prisma`
- Create: `lib/assets/f1-official-assets.ts`
- Create: `scripts/backfill-official-assets.ts`
- Create: `lib/services/driver-page.service.ts`
- Create: `lib/services/team-page.service.ts`
- Create: `lib/services/races-index.service.ts`
- Modify: `lib/services/home-page.service.ts`
- Create: `tests/driver-page.service.test.ts`
- Create: `tests/team-page.service.test.ts`
- Create: `tests/races-index.service.test.ts`
- Modify: `tests/run.ts`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/races/page.tsx`
- Create: `app/drivers/[driverCode]/page.tsx`
- Create: `app/teams/[teamSlug]/page.tsx`

## Task 1: Extend data model for local official assets

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/assets/f1-official-assets.ts`
- Create: `scripts/backfill-official-assets.ts`

- [ ] **Step 1: Add schema fields**

Add:
- `Driver.imagePath`
- `Driver.profileSlug` if needed for official asset mapping
- `Constructor.logoPath`

- [ ] **Step 2: Build the official asset mapping**

Create a stable mapping layer for:
- driver code -> Formula1.com driver profile
- team slug -> Formula1.com team page

- [ ] **Step 3: Implement asset backfill script**

The script should:
- fetch official pages
- extract the asset URL
- download locally
- update DB paths

- [ ] **Step 4: Apply Prisma changes**

Run: `npx prisma db push --accept-data-loss`
Expected: PASS

## Task 2: Add page services with TDD

**Files:**
- Create: `tests/driver-page.service.test.ts`
- Create: `tests/team-page.service.test.ts`
- Create: `tests/races-index.service.test.ts`
- Modify: `tests/run.ts`
- Create: `lib/services/driver-page.service.ts`
- Create: `lib/services/team-page.service.ts`
- Create: `lib/services/races-index.service.ts`
- Modify: `lib/services/home-page.service.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- home standings now expose asset paths and target URLs
- driver page model
- team page model
- races index model

- [ ] **Step 2: Run tests to verify red**

Run: `npm test`
Expected: FAIL for missing new services or fields.

- [ ] **Step 3: Implement minimal services**

Build typed server models for all new pages and links.

- [ ] **Step 4: Re-run tests**

Run: `npm test`
Expected: PASS

## Task 3: Build navigation and new pages

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/races/page.tsx`
- Create: `app/drivers/[driverCode]/page.tsx`
- Create: `app/teams/[teamSlug]/page.tsx`

- [ ] **Step 1: Add global navigation**

Provide simple top-level links:
- Home
- Races
- Live placeholder or existing route target if relevant

- [ ] **Step 2: Enrich the home**

Add:
- driver photos
- team logos
- links to driver/team pages
- link from next GP to its race page

- [ ] **Step 3: Build `/races`**

Render season calendar with links to GP detail pages.

- [ ] **Step 4: Build `/drivers/[driverCode]`**

Render first real driver page using local assets and season data.

- [ ] **Step 5: Build `/teams/[teamSlug]`**

Render first real team page using local assets and season data.

- [ ] **Step 6: Run build verification**

Run: `npm run build`
Expected: PASS

## Task 4: Run official asset import and final verification

**Files:**
- No code changes unless verification finds issues

- [ ] **Step 1: Run the asset backfill script**

Download official assets and write local paths into the database.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Smoke test key pages**

Verify:
- `/`
- `/races`
- `/drivers/<code>`
- `/teams/<slug>`

- [ ] **Step 5: Report evidence**

Summarize files changed, verification commands and any remaining gaps.

## Review Note

Le workflow normal de cette skill recommande une revue de plan par sous-agent, mais je ne la lance pas ici car la conversation n'autorise pas la délégation implicite. Le plan est exécuté inline dans cette session.
