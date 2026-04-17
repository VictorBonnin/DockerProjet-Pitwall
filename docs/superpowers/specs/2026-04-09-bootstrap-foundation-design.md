# Bootstrap Foundation Design

**Date:** 2026-04-09

**Goal:** mettre en place le premier jalon exécutable de PitWall en partant de zéro, avec un socle local cohérent avec le README.

## Contexte

Le dépôt ne contient actuellement qu'un document de cadrage : [readme.md](C:/Users/bonni/Documents/Projets/Pitwall/readme.md).
Le projet cible est une plateforme data F1 backend-first, avec séparation claire entre historique consolidé, live/staging, API interne, workers et interface web.

Le premier jalon ne doit pas encore implémenter la logique métier complète F1. En revanche, il doit fournir un squelette réellement démarrable pour supporter les prochaines étapes.

## Objectif du jalon 1

Le jalon 1 doit produire un projet local exécutable qui permet :

- de lancer une application Next.js en TypeScript
- de connecter PostgreSQL via Prisma
- de connecter Redis
- de lancer les services d'infrastructure via Docker Compose
- d'exposer une première API interne de santé et une première route live minimale
- de poser les bases de structure pour les providers, services et workers décrits dans le README

## Hors périmètre

Ce jalon n'inclut pas :

- l'ingestion réelle des données Jolpica ou OpenF1
- la consolidation live vers historique
- les dashboards riches ou la visualisation live avancée
- le modèle Prisma complet décrit dans le README
- les pipelines métiers complets de synchronisation

## Approche retenue

L'approche retenue est un bootstrap orienté architecture cible.

Plutôt que de créer une simple app de démonstration, le jalon doit installer dès maintenant les bonnes fondations de structure :

- `app/` pour l'interface et les routes API
- `lib/db/` pour les clients de connexion
- `lib/env.ts` pour la validation d'environnement
- `lib/providers/` pour les futurs connecteurs de données
- `lib/services/` pour la logique applicative
- `workers/` pour les processus d'ingestion et de consolidation
- `prisma/` pour le schéma et les migrations
- `docker/` pour l'infrastructure locale

Cette approche limite le risque de refonte rapide au jalon suivant.

## Architecture du jalon 1

### Application

Une application Next.js App Router en TypeScript sera créée comme point d'entrée principal.

Elle inclura :

- une page d'accueil simple rappelant le rôle du projet
- une route API `GET /api/health`
- une route API `GET /api/live/sessions/current`

### Base de données

Prisma sera utilisé avec PostgreSQL.

Le schéma Prisma du jalon 1 sera volontairement réduit, mais aligné sur les concepts du README :

- `Season`
- `Circuit`
- `RaceWeekend`
- `Session`
- `Driver`
- `Constructor`
- `LiveSession`

L'objectif n'est pas d'atteindre la couverture métier totale, mais de valider le fonctionnement de la chaîne ORM -> migration -> connexion.

### Cache / live state

Redis sera branché dès ce jalon pour préparer la séparation voulue entre stockage durable et état live court terme.

Au jalon 1, Redis sera principalement utilisé comme dépendance technique vérifiable, pas encore comme moteur métier complet.

### Services et workers

Le squelette de services et de workers sera posé pour respecter le découpage du README :

- service live minimal
- worker de synchronisation statique
- worker live
- worker de consolidation

Ces composants pourront être encore partiellement stubs, tant qu'ils démarrent proprement et que leur responsabilité est claire.

## Structure de fichiers cible

Le jalon doit créer une structure proche de :

```text
app/
  api/
    health/route.ts
    live/sessions/current/route.ts
  layout.tsx
  page.tsx
lib/
  db/
    prisma.ts
    redis.ts
  env.ts
  services/
    live-query.service.ts
prisma/
  schema.prisma
workers/
  sync-static.ts
  sync-live.ts
  consolidate-session.ts
docker/
  Dockerfile
  docker-compose.yml
.env.example
package.json
tsconfig.json
```

## Dépendances attendues

Le bootstrap doit inclure au minimum :

- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `@prisma/client`
- `prisma`
- `ioredis`
- `zod`

Des dépendances complémentaires de linting ou qualité peuvent être ajoutées si elles restent légères et cohérentes avec un bootstrap propre.

## Variables d'environnement

Le projet doit déclarer explicitement les variables nécessaires :

- `DATABASE_URL`
- `REDIS_URL`
- `NODE_ENV`
- éventuellement les URL de providers futures en variables documentées mais non encore exploitées

Un fichier `.env.example` doit permettre de démarrer sans ambiguïté.

## Vérification de succès

Le jalon 1 sera considéré comme fonctionnel si les points suivants sont validés :

- les dépendances s'installent
- `docker compose` peut démarrer PostgreSQL et Redis
- Prisma peut générer son client
- Prisma peut synchroniser ou migrer le schéma initial
- l'application Next.js démarre localement
- `GET /api/health` renvoie un statut de santé utile
- `GET /api/live/sessions/current` répond proprement même sans données
- les workers s'exécutent sans crash structurel

## Risques identifiés

- l'environnement local peut ne pas disposer de Docker ou Node.js
- Prisma multi-schémas PostgreSQL peut être plus coûteux à poser dès le jalon 1
- certaines commandes peuvent nécessiter une adaptation selon les versions disponibles

Pour limiter ces risques, le jalon 1 restera pragmatique :

- un schéma Prisma simple d'abord
- des routes API minimales
- des workers stubés mais exécutables
- une vérification progressive des composants techniques

## Suite prévue après ce jalon

Une fois ce bootstrap validé, la prochaine étape logique sera l'ingestion historique minimale :

- calendrier de saison
- standings
- premiers référentiels pilotes / équipes / circuits

Cela permettra de remplir la base avec de vraies données et de passer du squelette technique à une première plateforme utile.
