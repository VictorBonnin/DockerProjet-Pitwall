# Rapport de Projet — PitWall

**Projet** : PitWall — Plateforme de données Formula 1  
**Auteur** : Victor BONNIN - Lucas BAURY
**Formation** : Ingénieur DevOps — EFREI  
**Dépôt GitHub** : [VictorBonnin/DockerProjet-Pitwall](https://github.com/VictorBonnin/DockerProjet-Pitwall)

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture logicielle](#2-architecture-logicielle)
3. [Technologies utilisées](#3-technologies-utilisées)
4. [Fonctionnalités](#4-fonctionnalités)
5. [Infrastructure Docker](#5-infrastructure-docker)
6. [Tests et couverture de code](#6-tests-et-couverture-de-code)
7. [Qualité logicielle — SonarCloud](#7-qualité-logicielle--sonarcloud)
8. [Pipeline CI/CD](#8-pipeline-cicd)
9. [Conclusion](#9-conclusion)

---

## 1. Présentation du projet

PitWall est une application web complète dédiée à la Formule 1. Elle centralise et visualise les données historiques et en temps réel de la saison F1 en s'appuyant sur deux APIs externes :

- **Jolpica/Ergast** (`https://api.jolpi.ca/ergast/f1`) : données historiques (calendriers, résultats, classements)
- **OpenF1** (`https://openf1.org`) : télémétrie et sessions en temps réel

Le projet a été développé en respectant les pratiques DevOps : dépôt Git, pipeline CI automatisé, architecture en couches, tests exhaustifs et analyse de la qualité du code.

---

## 2. Architecture logicielle

### 2.1 Schéma général

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOURCES EXTERNES                         │
│                                                                 │
│   ┌──────────────────────┐    ┌──────────────────────────────┐  │
│   │  Jolpica / Ergast    │    │         OpenF1 API           │  │
│   │  (données histo.)    │    │      (temps réel, live)      │  │
│   └──────────┬───────────┘    └──────────────┬───────────────┘  │
└──────────────┼──────────────────────────────┼──────────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE DATA (lib/db/ + lib/providers/)        │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  lib/providers/ │  │   lib/db/       │  │   lib/db/       │ │
│  │   jolpica.ts    │  │   prisma.ts     │  │   redis.ts      │ │
│  │   openf1.ts     │  │ (PostgreSQL ORM)│  │  (Cache Redis)  │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  COUCHE SERVICES (lib/services/)                 │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ dashboard    │  │ live-page    │  │ history-sync         │  │
│  │ .service.ts  │  │ .service.ts  │  │ .service.ts          │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤  │
│  │ home-page    │  │ live-session │  │ session-details-sync │  │
│  │ .service.ts  │  │ -control.ts  │  │ .service.ts          │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤  │
│  │ circuit-page │  │ driver-page  │  │ race-weekend-page    │  │
│  │ .service.ts  │  │ .service.ts  │  │ .service.ts          │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤  │
│  │ team-page    │  │ standings    │  │ ... (18 services)    │  │
│  │ .service.ts  │  │ .service.ts  │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              COUCHE CONTROLLER / WEB (app/)                     │
│                                                                 │
│  ┌───────────────────────────┐  ┌──────────────────────────┐   │
│  │       API Routes          │  │       Pages Next.js       │   │
│  │   app/api/                │  │   app/                    │   │
│  │   ├── health/route.ts     │  │   ├── page.tsx (Home)     │   │
│  │   ├── live/               │  │   ├── live/page.tsx       │   │
│  │   │   ├── data/           │  │   ├── races/[year]/[r]/   │   │
│  │   │   └── sessions/       │  │   ├── drivers/[code]/     │   │
│  │   ├── races/              │  │   ├── teams/[slug]/        │   │
│  │   └── standings/          │  │   └── circuits/[slug]/    │   │
│  └───────────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture en couches

Le projet respecte une architecture 3 couches stricte :

#### Couche Data
Responsable de toutes les interactions avec les données :
- **`lib/providers/jolpica.ts`** : client HTTP vers l'API Jolpica, fonctions de récupération des données historiques F1
- **`lib/providers/openf1.ts`** : client HTTP vers l'API OpenF1, 14 endpoints temps réel (positions, télémétrie, météo...)
- **`lib/db/prisma.ts`** : singleton Prisma ORM pour PostgreSQL
- **`lib/db/redis.ts`** : singleton Redis pour le cache des données live

#### Couche Services
Contient toute la logique métier (18 services) :
- Transformation des données brutes en modèles de présentation
- Synchronisation des données historiques depuis les APIs
- Gestion des sessions live (ouverture, ingestion, fermeture)
- Calculs et agrégations (classements, statistiques, temps au tour)

#### Couche Controller (Web)
Exposition des données via Next.js :
- **Routes API** (`app/api/`) : 22+ endpoints REST JSON
- **Pages** : rendu côté serveur des données pour chaque section

### 2.3 Schéma de la base de données

```
Season ──────── RaceWeekend ──────── Session
   │                │                    │
   │           Circuit              LiveSession
   │                                     │
DriverStanding               ┌───────────┼───────────┐
ConstructorStanding      LiveCarPos  LiveTelemetry  LiveStint
                                
RaceResult ────── Driver ────── Constructor
QualifyingResult
SprintResult
Lap
PitStop
WeatherSample
```

---

## 3. Technologies utilisées

| Catégorie | Technologie | Version |
|---|---|---|
| Framework web | Next.js | 15.3 |
| UI | React | 19.1 |
| Langage | TypeScript | 5.8 |
| ORM | Prisma | 6.6 |
| Base de données | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Client Redis | ioredis | 5.6 |
| Validation | Zod | 3.24 |
| CSS | Tailwind CSS | 4.1 |
| Framework de tests | Vitest | 4.1 |
| Couverture | @vitest/coverage-v8 | 4.1 |
| Qualité | SonarCloud | — |
| Conteneurs | Docker + Compose | — |
| CI | GitHub Actions | — |

---

## 4. Fonctionnalités

### 4.1 Données historiques

- **Calendrier** : saison en cours et saisons passées avec tous les Grands Prix
- **Résultats de course** : classement final, points, statuts, temps total
- **Qualifications** : résultats par segment (Q1/Q2/Q3) avec écarts au pole
- **Sprint** : résultats des courses sprint
- **Grille de départ** : visualisation des positions avec temps par secteur
- **Classements** : pilotes et constructeurs mis à jour après chaque manche
- **Fiches pilotes** : historique de résultats saison par saison
- **Fiches équipes** : classement, pilotes et couleurs d'équipe
- **Fiches circuits** : historique des vainqueurs, longueur, tracé SVG

### 4.2 Session live

- **Tableau de bord en temps réel** : mise à jour automatique toutes les 3 secondes
- **Classement instantané** : positions avec écarts entre pilotes et au leader
- **Télémétrie** : vitesse, rapport, DRS, accélération, frein (par voiture)
- **Carte de piste** : positions des voitures en temps réel
- **Gestion des pneumatiques** : composé et numéro de relais
- **Météo** : température air/piste, pluie, vent
- **Direction de course** : messages (drapeaux, safety car, VSC...)

### 4.3 Navigation globale

- Page d'accueil avec prochain GP et compte à rebours
- Indicateur de session live visible depuis toutes les pages
- Résumé des classements pilotes/constructeurs en temps réel

---

## 5. Infrastructure Docker

### 5.1 Services Docker Compose

Le projet utilise **deux services back** conteneurisés via Docker Compose (`docker/docker-compose.yml`) :

```yaml
services:
  postgres:        # Service 1 : Base de données relationnelle
    image: postgres:16
    ports: ["5432:5432"]
    
  redis:           # Service 2 : Cache in-memory pour données live
    image: redis:7
    ports: ["6379:6379"]
```

### 5.2 Dockerfile multi-stage

Le Dockerfile (`docker/Dockerfile`) utilise un build multi-stage optimisé :

```
Stage 1 : deps     → Installation des dépendances npm
Stage 2 : builder  → Génération Prisma + Build Next.js
Stage 3 : runner   → Image minimale de production (node:22-alpine)
```

---

## 6. Tests et couverture de code

### 6.1 Framework de tests

Les tests utilisent **Vitest** avec :
- `describe/it/expect` pour la structure
- `vi.stubGlobal("fetch", ...)` pour les mocks web HTTP
- `vi.mock("node:fs")` pour les mocks système
- `@vitest/coverage-v8` pour la couverture

### 6.2 Résultats des tests

| Métrique | Valeur |
|---|---|
| Fichiers de tests | 23 |
| Tests au total | **114** |
| Tests réussis | **114 / 114** |
| Tests échoués | 0 |


### 6.3 Organisation des tests par couche

#### Couche Data — Tests des providers HTTP (mocks web)

| Fichier | Tests | Ce qui est testé |
|---|---|---|
| `tests/providers/jolpica.test.ts` | 8 | Toutes les fonctions Jolpica avec fetch mocké |
| `tests/providers/openf1.test.ts` | 17 | Toutes les fonctions OpenF1, headers, erreurs 429 |

**Exemple de mock web (OpenF1) :**
```typescript
// Mock du fetch global
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve([{ session_key: 9971, ... }]),
}))

// Vérification de l'URL construite
const [url] = fetchMock.mock.calls[0]
expect(url).toContain("sessions?year=2025")
```

#### Couche Services — Tests unitaires

| Fichier | Tests | Ce qui est testé |
|---|---|---|
| `tests/dashboard.service.test.ts` | 3 | Modèle dashboard, calcul completion weekends |
| `tests/live-session-control.service.test.ts` | 17 | Ouverture/fermeture session live, parsing args |
| `tests/race-weekend-page.service.test.ts` | 8 | Grille de départ, labels de temps, page GP |
| `tests/home-page.service.test.ts` | 4 | Modèle page d'accueil, prochain GP |
| `tests/history-sync.service.test.ts` | 2 | Plan d'import historique depuis Jolpica |
| `tests/live-page.service.test.ts` | 2 | Modèle dashboard live, état idle |
| `tests/session-details-sync.service.test.ts` | 4 | Import laps/pit/météo OpenF1 |
| `tests/session-results-sync.service.test.ts` | 3 | Import résultats course/qualifs/sprint |
| *(+ 10 autres fichiers)* | ... | Circuits, drivers, teams, standings... |

#### Couche Utilitaires

| Fichier | Tests | Ce qui est testé |
|---|---|---|
| `tests/circuit-slug.test.ts` | 6 | Conversion nom → slug (accents, tirets) |
| `tests/team-colors.test.ts` | 8 | Couleurs équipes, conversion hex→rgba |
| `tests/circuit-reference.test.ts` | 7 | Références circuits avec mock `node:fs` |
| `tests/env.test.ts` | 3 | Validation des variables d'environnement |
| `tests/health-route.test.ts` | 3 | Health check avec dépendances mockées |
| `tests/race-grid-layout.test.ts` | 4 | Calcul positions sur grille de départ |

### 6.4 Couverture de code

La couverture est générée via **V8** et transmise à SonarCloud au format **lcov**.

| Métrique (SonarCloud) | Valeur |
|---|---|
| **Coverage Nouveau Code** | **97.87%** ✅ |
| Seuil requis | ≥ 80% |
| Lignes à couvrir (nouveau code) | 21 |
| Duplications (nouveau code) | 0.0% |

---

## 7. Qualité logicielle — SonarCloud

### 7.1 Quality Gate

Le projet utilise le **Quality Gate "Sonar way"** (standard SonarCloud) appliqué sur le nouveau code :

| Condition | Seuil | Résultat |
|---|---|---|
| Quality Gate | — | ✅ **Passed** |
| Coverage nouveau code | ≥ 80% | ✅ **97.87%** |
| Nouvelles issues | 0 | ✅ **0** |
| Duplications nouveau code | ≤ 3% | ✅ **0.0%** |
| Security Hotspots | 0 | ✅ **0** |

### 7.2 Métriques Overall Code

| Catégorie | Note | Détail |
|---|---|---|
| **Security** | A | 0 vulnérabilités |
| **Reliability** | A | 0 bugs |
| **Maintainability** | A | Code smells traités |
| Coverage global | 55.9% | — |
| Lignes de code | ~7 600 | — |

### 7.3 Code smells corrigés

Au cours du projet, les code smells suivants ont été identifiés et corrigés :

| Issue | Fichier(s) | Fix appliqué |
|---|---|---|
| Ternaires imbriqués | `route.ts`, `race-weekend-page.service.ts` | Extrait en `if/else` ou fonction dédiée |
| `window.` au lieu de `globalThis.` | `home-luxury.tsx` | Remplacé par `globalThis.` |
| `global.` au lieu de `globalThis.` | `prisma.ts`, `redis.ts` | Remplacé par `globalThis.` |
| Types alias redondants | `jolpica.ts` | Suppression, usage du type original |
| Template literals imbriqués | 6 services | Remplacé par `[...].filter(Boolean).join()` |
| Complexité cognitive élevée | `live-session-control.service.ts` | Extraction d'un helper `requireArgValue()` |
| `!important` sur `letter-spacing` | `globals.css` | Suppression du `!important` |
| Props non readonly | `home-luxury.tsx`, `LiveDashboard.tsx` | Ajout de `Readonly<T>` |
| Condition négative inattendue | `LiveDashboard.tsx` | Inversion de la condition |
| `??=` non utilisé | `env.ts` | Remplacement de `if (!x) x = ...` |

---

## 8. Pipeline CI/CD

### 8.1 Workflow GitHub Actions

Le fichier `.github/workflows/ci.yml` définit un pipeline en **2 jobs séquentiels** :

```
Push / Pull Request
        │
        ▼
┌───────────────────────────────┐
│  Job 1 : Lint, Test & Sonar   │  (~1m 25s)
│                               │
│  1. Checkout code             │
│  2. Setup Node.js 22          │
│  3. npm ci                    │
│  4. npx prisma generate       │
│  5. npm run lint (ESLint)     │
│  6. npm run test:coverage     │
│  7. SonarCloud Scan           │
└──────────────┬────────────────┘
               │ (si succès)
               ▼
┌───────────────────────────────┐
│  Job 2 : Build Docker image   │  (~1m 37s)
│                               │
│  1. Checkout code             │
│  2. Docker Buildx setup       │
│  3. docker build (with cache) │
└───────────────────────────────┘
```

### 8.2 Déclencheurs

| Événement | Branche | Action |
|---|---|---|
| `push` | Toutes les branches | Pipeline complet |
| `pull_request` | `master` | Pipeline complet |

---

## 9. Conclusion

### 9.1 Conformité aux exigences DevOps

| Exigence | Statut |
|---|---|
| Dépôt Git | ✅ `VictorBonnin/DockerProjet-Pitwall` |
| Pipeline CI | ✅ GitHub Actions (lint + tests + Sonar + Docker) |
| Architecture en couches (Data / Services / Controller) | ✅ 3 couches distinctes |
| Au moins 2 services back avec Docker | ✅ PostgreSQL + Redis |
| Tests unitaires avec framework | ✅ Vitest — 114 tests |
| Mocks web | ✅ `vi.stubGlobal("fetch", ...)` |
| Bonne couverture de code | ✅ 97.87% (Quality Gate Passed) |
| Qualité logicielle élevée | ✅ SonarCloud : 0 bugs, 0 vulnérabilités, grade A |

### 9.2 Points clés du projet

- **Séparation stricte des responsabilités** : chaque couche est indépendante et testable isolément
- **Injection de dépendances** : les services utilisent des interfaces mockables (pas de couplage direct à Prisma/Redis dans les tests)
- **Tests exhaustifs** : couverture des cas nominaux ET des cas d'erreur (429, timeout, données manquantes)
- **Infrastructure reproductible** : `docker compose up` suffit pour lancer l'environnement complet
- **Qualité continue** : SonarCloud analyse chaque commit automatiquement