# Historical Ingestion Design

**Date:** 2026-04-09

**Goal:** mettre en place la première ingestion historique réellement utile de PitWall avec calendrier, standings et premiers référentiels métiers.

## Contexte

Le jalon 1 a créé un socle exécutable avec Next.js, Prisma, PostgreSQL, Redis, Docker, une route de santé, une route live minimale et des workers de base.

L'étape 2 doit commencer à alimenter la base avec de vraies données historiques afin que l'application ne soit plus seulement un squelette technique.

## Objectif de l'étape 2

L'étape 2 doit permettre :

- d'importer le calendrier d'une saison depuis Jolpica
- d'importer les standings pilotes d'une saison
- d'importer les standings constructeurs d'une saison
- de créer ou mettre à jour les référentiels minimums nécessaires :
  - saisons
  - circuits
  - week-ends de course
  - sessions
  - pilotes
  - constructeurs
- d'exposer ces données via des routes API internes lisibles

## Hors périmètre

Cette étape n'inclut pas encore :

- les résultats détaillés de course
- les résultats de qualification
- les laps, secteurs, pit stops et stints
- la météo historique
- l'ingestion OpenF1 live
- la consolidation live vers historique

## Approche retenue

L'approche retenue est une ingestion historique normalisée ciblée.

Les données ne seront pas stockées comme payloads bruts. Elles seront transformées vers les entités métiers déjà prévues par le projet afin de garder une base réutilisable et cohérente avec le README.

## Source de données

Pour cette étape, la source principale sera Jolpica.

Les appels nécessaires sont :

- calendrier de saison
- standings pilotes
- standings constructeurs

Cette étape doit déjà préparer une couche provider claire pour permettre d'étendre ensuite l'ingestion historique à d'autres ressources.

## Évolution du modèle Prisma

Le schéma Prisma doit être enrichi pour stocker la première tranche utile de données historiques :

- enrichissement de `Circuit`
- enrichissement de `Constructor`
- enrichissement de `Driver`
- enrichissement de `RaceWeekend`
- enrichissement de `Session`
- ajout de `DriverStanding`
- ajout de `ConstructorStanding`

Des champs provider doivent être prévus lorsque cela aide au rapprochement futur :

- provider IDs Jolpica pour pilotes, constructeurs et circuits
- informations de slug et de nom complet si disponibles

## Ingestion métier

Le pipeline d'ingestion doit fonctionner par année.

Pour une année donnée :

1. charger le calendrier
2. créer ou mettre à jour la saison
3. créer ou mettre à jour les circuits
4. créer ou mettre à jour les week-ends de course
5. créer ou mettre à jour les sessions du calendrier si elles sont présentes dans le payload
6. charger les standings pilotes
7. créer ou mettre à jour les pilotes et leurs standings
8. charger les standings constructeurs
9. créer ou mettre à jour les constructeurs et leurs standings

L'ingestion doit être idempotente autant que possible afin de pouvoir être relancée sans dégrader la base.

## API interne

L'étape 2 doit exposer des routes API utiles pour consulter les données locales :

- `GET /api/races?year=...`
- `GET /api/standings/drivers?year=...`
- `GET /api/standings/constructors?year=...`

Le comportement attendu :

- lecture en base locale en priorité
- fallback provider si la base est vide pour l'année demandée
- validation stricte des paramètres

## Worker

L'étape 2 doit fournir un worker historique réellement utile.

Le worker doit :

- accepter une année en argument
- utiliser l'année courante par défaut si aucun argument n'est fourni
- exécuter l'ingestion calendrier + standings
- journaliser clairement les étapes exécutées

## Structure de fichiers attendue

L'étape doit au minimum créer ou modifier :

- `prisma/schema.prisma`
- `lib/providers/jolpica.ts`
- `lib/services/history-sync.service.ts`
- `lib/services/races.service.ts`
- `lib/services/standings.service.ts`
- `app/api/races/route.ts`
- `app/api/standings/drivers/route.ts`
- `app/api/standings/constructors/route.ts`
- `workers/sync-history.ts`
- `package.json`

## Vérification de succès

L'étape 2 sera considérée comme terminée si :

- Prisma accepte le schéma enrichi
- la base peut être synchronisée
- le worker historique ingère avec succès une saison donnée
- les tables de référentiels et standings sont remplies
- les routes API de consultation renvoient des données issues de la base locale
- les tests ajoutés pour les mappers et services passent

## Risques identifiés

- la structure réelle des payloads Jolpica peut différer selon les endpoints
- certaines sessions ne sont pas toujours présentes ou homogènes dans le calendrier
- les identifiants provider ne couvrent pas tout ce qui sera utile plus tard

Pour limiter ces risques :

- les mappers seront tolérants et centrés sur les champs nécessaires
- l'ingestion restera prudente sur les champs optionnels
- les upserts reposeront sur des clés stables simples

## Suite logique après cette étape

Une fois cette étape validée, la prochaine avancée naturelle sera :

- enrichir l'historique avec résultats détaillés
- ajouter l'ingestion de sessions détaillées et éventuellement de laps
- préparer la jonction avec l'architecture live
