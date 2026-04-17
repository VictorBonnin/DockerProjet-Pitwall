# Session Results Ingestion Design

**Date:** 2026-04-09

**Goal:** ajouter l'ingestion historique des résultats de course, qualification et sprint en s'appuyant sur les référentiels et le calendrier déjà présents en base.

## Contexte

L'étape 2 a déjà mis en place :

- le calendrier de saison
- les standings pilotes et constructeurs
- les référentiels minimums pilotes, équipes, circuits, sessions
- des routes API lisant prioritairement la base locale

L'étape 3 doit enrichir l'historique avec des données sportives directement exploitables par week-end et par session.

## Objectif de l'étape 3

L'étape 3 doit permettre :

- d'importer les résultats détaillés de course
- d'importer les résultats de qualification
- d'importer les résultats de sprint
- d'associer correctement ces résultats aux sessions, pilotes, constructeurs et week-ends déjà existants
- d'exposer les données via des routes API dédiées

## Hors périmètre

Cette étape n'inclut pas encore :

- laps, secteurs et fastest lap détaillés au tour
- pit stops et stints
- météo et race control historique
- ingestion live OpenF1
- consolidation live vers historique

## Approche retenue

L'approche retenue est une ingestion séparée par type de session avec factorisation légère.

L'objectif est de garder :

- un mapping simple à comprendre
- une bonne robustesse face aux sessions absentes
- une extension naturelle pour les futures données détaillées

## Évolution du modèle Prisma

Le schéma Prisma doit être enrichi avec :

- `RaceResult`
- `QualifyingResult`
- `SprintResult`

Ces entités doivent référencer :

- la session
- le race weekend si nécessaire
- le pilote
- le constructeur

Elles doivent aussi stocker les principaux champs utiles à court terme :

- positions
- points
- grille ou temps Q1/Q2/Q3 selon le type
- statut de classement
- nombre de tours ou temps total si disponible

## Ingestion métier

Le pipeline doit fonctionner par année.

Pour une année donnée :

1. récupérer les week-ends déjà présents dans la base
2. pour chaque round :
   - récupérer les résultats de course
   - récupérer les résultats de qualification
   - récupérer les résultats de sprint si disponibles
3. retrouver la session correspondante en base
4. mapper chaque ligne de résultat avec les pilotes et constructeurs existants
5. faire des upserts idempotents
6. ignorer proprement les sessions non disponibles

## API interne

Les routes attendues sont :

- `GET /api/races/[year]/[round]/results`
- `GET /api/races/[year]/[round]/qualifying`
- `GET /api/races/[year]/[round]/sprint`

Comportement attendu :

- lecture locale prioritaire
- fallback provider si les données ne sont pas encore présentes en base
- validation stricte des paramètres

## Worker

Le worker historique existant peut être enrichi pour inclure aussi les résultats de session, ou bien déléguer à un service dédié.

Le plus important est que l'ingestion complète par année soit pilotable par une commande simple.

## Structure de fichiers attendue

L'étape doit au minimum créer ou modifier :

- `prisma/schema.prisma`
- `lib/providers/jolpica.ts`
- `lib/services/session-results-sync.service.ts`
- `lib/services/race-results.service.ts`
- `app/api/races/[year]/[round]/results/route.ts`
- `app/api/races/[year]/[round]/qualifying/route.ts`
- `app/api/races/[year]/[round]/sprint/route.ts`
- `workers/sync-history.ts`
- `tests/session-results-sync.service.test.ts`

## Vérification de succès

L'étape 3 sera considérée comme terminée si :

- le schéma Prisma enrichi passe
- les tests de mapping passent
- l'ingestion d'une année remplit des résultats de course, qualification et sprint
- les routes API dédiées renvoient des données locales
- la build de l'application reste valide

## Risques identifiés

- certaines saisons ou certains rounds n'ont pas toujours de sprint
- certaines réponses provider peuvent manquer des champs attendus
- les résultats doivent rester cohérents avec les référentiels déjà importés

Pour limiter ces risques :

- l'ingestion doit être tolérante sur les champs optionnels
- les sessions absentes doivent être ignorées proprement
- les upserts doivent reposer sur des clés stables en base

## Suite logique après cette étape

Une fois les résultats de session en place, la prochaine suite naturelle sera :

- laps
- pit stops
- météo
- premières pages frontend de consultation historique détaillée
