# Race Weekend Page Design

**Date:** 2026-04-09

**Goal:** créer la page `/races/[year]/[round]` pour consulter un Grand Prix donné comme un dossier week-end lisible et utile.

## Contexte

Le backend dispose déjà des données nécessaires pour une page détaillée de GP :

- calendrier et sessions
- résultats de course, qualification et sprint
- laps
- pit stops
- météo

Le frontend a maintenant une home dashboard, mais il manque encore la page de détail week-end explicitement prévue dans le MVP.

## Objectif de cette étape

Créer une page serveur qui affiche, pour un `year` et un `round` :

- l'identité du Grand Prix
- les sessions connues du week-end
- les résultats course / quali / sprint
- un résumé météo
- un résumé de complétude et de volume de données

## Positionnement produit

Cette page n'est pas encore une vue live ni un outil d'analyse avancée.

Elle doit ressembler à une fiche technique de week-end :

- dense
- structurée
- agréable à parcourir
- cohérente avec le ton "strategy room" de la home

## Approche retenue

La page sera rendue côté serveur à partir d'un service dédié qui prépare un modèle de vue unique.

On évite :

- d'empiler les requêtes Prisma directement dans le composant
- d'appeler les endpoints API internes depuis la page
- d'introduire déjà des graphes ou interactions complexes

## Structure de page

### 1. Hero GP

Contient :

- nom du GP
- round
- circuit
- pays / localité
- statut du week-end
- repères de date

### 2. Bandeau de synthèse

Quelques KPI lisibles immédiatement :

- nombre de sessions
- résultats disponibles
- laps stockés
- pit stops
- météo

### 3. Sessions

Liste claire des sessions connues :

- type
- nom
- date/heure si connue
- statut de disponibilité

### 4. Résultats

Trois panneaux :

- course
- qualification
- sprint si présent

Chaque panneau doit privilégier la lisibilité rapide plutôt qu'une table exhaustive compliquée.

### 5. Conditions

Résumé météo du week-end :

- nombre d'échantillons
- température air min/max
- température piste min/max
- humidité ou pluie si disponibles

### 6. Résumé data

Bloc de complétude montrant si le week-end possède :

- résultats course
- résultats qualification
- résultats sprint
- détails laps
- pit stops
- météo

## Hors périmètre

Cette étape n'inclut pas encore :

- page `/races`
- page `/races/[year]/[round]/live`
- track map
- race control
- comparaisons interactives
- graphes de rythme

## Structure de fichiers attendue

Au minimum :

- `app/races/[year]/[round]/page.tsx`
- `lib/services/race-weekend-page.service.ts`
- `tests/race-weekend-page.service.test.ts`

## Vérification de succès

L'étape est terminée si :

- `/races/2025/1` rend une vraie page détaillée de GP
- la page lit bien la base locale
- le service de préparation de données est testé
- le build passe
- la page est lisible en desktop et mobile

## Suite logique

Après cette page, les suites naturelles sont :

- `/races`
- `/drivers/[driverCode]`
- `/teams/[teamSlug]`
- `/live`
