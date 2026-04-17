# Home Grid Pulse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** refaire la home `/` en version sombre paddock-tech, limitée au prochain GP, au live courant et aux standings.

**Architecture:** un service serveur dédié prépare un modèle minimal de home depuis Prisma et le service live existant. La page `app/page.tsx` devient une composition visuelle focalisée qui ne dépend plus du dashboard historique enrichi.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind CSS v4, Prisma, tests Node via `tsx`

---

## File Structure

- Create: `lib/services/home-page.service.ts`
- Create: `tests/home-page.service.test.ts`
- Modify: `tests/run.ts`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

## Task 1: Build the home page model

**Files:**
- Create: `tests/home-page.service.test.ts`
- Modify: `tests/run.ts`
- Create: `lib/services/home-page.service.ts`

- [ ] **Step 1: Write the failing test**

Cover:
- next GP selection
- fallback when every weekend is completed
- live session block shaping
- standings shaping

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `home-page.service.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:
- `pickNextRaceWeekend`
- `buildHomePageModel`
- `getHomePageData(year)`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

## Task 2: Render the new home

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the current dashboard home**

Render only:
- prochain GP
- live session
- standings pilotes
- standings constructeurs

- [ ] **Step 2: Keep strong empty states**

Handle:
- no open live session
- no upcoming GP
- empty standings

- [ ] **Step 3: Run build verification**

Run: `npm run build`
Expected: PASS

## Task 3: Apply the Grid Pulse visual system

**Files:**
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

- [ ] **Step 1: Shift the visual system to dark paddock-tech**

Introduce:
- black background
- subtle grid texture
- cyan / orange luminous accents
- darker cards and more technical surfaces

- [ ] **Step 2: Recheck responsive layout**

Ensure hero + live + standings remain readable on mobile.

- [ ] **Step 3: Re-run build**

Run: `npm run build`
Expected: PASS

## Task 4: Final verification

**Files:**
- No code changes unless verification reveals an issue

- [ ] **Step 1: Run full tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Smoke test `/`**

Start the production server and fetch `/`.

- [ ] **Step 4: Report evidence**

Summarize files changed, commands executed and next recommended page.

## Review Note

Le workflow normal de cette skill recommande une revue de plan par sous-agent, mais je ne la lance pas ici car la conversation n'autorise pas la délégation implicite. Le plan est exécuté inline dans cette session.
