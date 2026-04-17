# Race Weekend Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** construire la page `/races/[year]/[round]` comme fiche détaillée d'un Grand Prix en lisant les données locales consolidées.

**Architecture:** un service serveur dédié prépare un modèle de page depuis Prisma, avec toutes les synthèses nécessaires pour le rendu. Le composant de page reste un Server Component lisible qui met en scène ce modèle dans la continuité visuelle de la home.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind CSS v4, Prisma, tests Node via `tsx`

---

## File Structure

- Create: `lib/services/race-weekend-page.service.ts`
- Create: `tests/race-weekend-page.service.test.ts`
- Modify: `tests/run.ts`
- Create: `app/races/[year]/[round]/page.tsx`

## Task 1: Build the race weekend page model

**Files:**
- Create: `tests/race-weekend-page.service.test.ts`
- Modify: `tests/run.ts`
- Create: `lib/services/race-weekend-page.service.ts`

- [ ] **Step 1: Write the failing test**

Cover:
- weather aggregation min/max values
- session ordering and labels
- result panels for race / qualifying / sprint
- weekend completeness summary

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the service file or exported helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:
- `buildRaceWeekendWeatherSummary`
- `buildRaceWeekendPageModel`
- `getRaceWeekendPage(year, round)`

The service should fetch:
- weekend + circuit + sessions
- race/quali/sprint results
- lap / pit stop / weather counts

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

## Task 2: Render the GP detail page

**Files:**
- Create: `app/races/[year]/[round]/page.tsx`

- [ ] **Step 1: Create the page route**

Render:
- hero GP
- KPI synthesis rail
- sessions list
- result panels
- weather summary
- data completeness summary

- [ ] **Step 2: Handle empty or partial data**

Use safe fallbacks for:
- no sprint
- no weather
- no result block

- [ ] **Step 3: Run build verification**

Run: `npm run build`
Expected: PASS

## Task 3: Final verification

**Files:**
- No code changes unless verification finds an issue

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Smoke test the page**

Run a local start and fetch `/races/2025/1`.

- [ ] **Step 4: Report evidence**

Summarize files changed, verification commands and next logical page.

## Review Note

Le workflow normal de cette skill recommande une revue de plan par sous-agent, mais je ne la lance pas ici car la conversation n'autorise pas la délégation implicite. Le plan est exécuté inline dans cette session.
