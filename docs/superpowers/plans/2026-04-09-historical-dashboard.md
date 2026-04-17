# Historical Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** transformer la home page en premier dashboard historique PitWall alimenté par la base locale.

**Architecture:** une couche serveur dédiée prépare un modèle de dashboard compact depuis Prisma afin d'éviter d'entasser la logique de sélection et d'agrégation dans `app/page.tsx`. La page reste un Server Component simple qui met en scène ces données avec une direction visuelle "strategy room" responsive et lisible.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind CSS v4, Prisma, tests Node via `tsx`

---

## File Structure

- Create: `lib/services/dashboard.service.ts`
- Create: `tests/dashboard.service.test.ts`
- Modify: `tests/run.ts`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

## Task 1: Build the dashboard data model

**Files:**
- Create: `tests/dashboard.service.test.ts`
- Modify: `tests/run.ts`
- Create: `lib/services/dashboard.service.ts`

- [ ] **Step 1: Write the failing test**

Cover the data-shaping rules that the page depends on:
- season KPI counts are derived from standings, weekends and detailed session counts
- the highlighted weekend is the latest completed weekend, falling back to the first available weekend
- completion badges reflect race/quali/sprint/laps/pit stops/weather availability
- the focus weekend summary extracts podium, pole sitter and sprint winner correctly

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `dashboard.service.ts` or exported helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement focused helpers inside `lib/services/dashboard.service.ts`:
- `pickFeaturedWeekend`
- `buildWeekendCompletion`
- `buildHistoricalDashboardModel`

Expose one top-level async function:
- `getHistoricalDashboard(year: number)`

Use Prisma includes to fetch:
- season
- race weekends + circuit + sessions
- top driver standings
- top constructor standings
- race/quali/sprint results for the featured weekend
- detailed counts from `Lap`, `PitStop`, `WeatherSample`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the new dashboard suite and no regression in existing suites.

## Task 2: Render the historical dashboard home

**Files:**
- Modify: `app/page.tsx`
- Modify: `lib/services/dashboard.service.ts`

- [ ] **Step 1: Replace the bootstrap landing page**

Make `app/page.tsx` an async Server Component that loads `getHistoricalDashboard(2025)` and renders:
- editorial hero with season and ingestion KPI cards
- driver standings panel
- constructor standings panel
- season calendar rail/grid
- featured weekend summary with podium / pole / sprint / detailed counts

- [ ] **Step 2: Keep the render resilient**

Add graceful empty states when some data is missing:
- no featured sprint
- no weather samples
- no standings rows

- [ ] **Step 3: Run app-level verification**

Run: `npm run build`
Expected: PASS with the page compiling as a server-rendered dashboard.

## Task 3: Apply the visual direction

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

- [ ] **Step 1: Strengthen the visual system**

Introduce:
- a more distinctive metadata description
- a warm mechanical palette with clearer surface layers
- stronger typography pairing without relying on the plain default stack
- subtle background treatments for the "strategy board" feel

- [ ] **Step 2: Improve responsive behavior**

Ensure:
- the standings and focus cards collapse cleanly on mobile
- the season calendar remains scannable on narrow widths
- large headline and KPI sections do not break layout

- [ ] **Step 3: Re-run build verification**

Run: `npm run build`
Expected: PASS after the styling pass.

## Task 4: Final verification

**Files:**
- No code changes required unless verification reveals an issue

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Smoke test the rendered home page**

Run a local start command and fetch `/` to confirm the new dashboard renders HTML successfully.

- [ ] **Step 4: Report results with evidence**

Summarize:
- files changed
- verification commands executed
- any remaining limits or next logical steps

## Review Note

Le workflow normal de cette skill recommande une revue de plan par sous-agent, mais je ne la lance pas ici car la conversation n'autorise pas la délégation implicite. Le plan est donc exécuté inline dans cette session.
