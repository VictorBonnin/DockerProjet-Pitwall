# Session Details Ingestion Design

**Date:** 2026-04-09

**Goal:** ajouter l'ingestion historique détaillée des laps, pit stops et échantillons météo pour les saisons compatibles OpenF1.

## Contexte

Les étapes précédentes ont déjà permis de construire :

- le calendrier historique
- les standings
- les référentiels pilotes, équipes, circuits et sessions
- les résultats de course, qualification et sprint

L'étape 4 doit maintenant enrichir la base avec des données de session plus fines, utiles pour l'analyse de rythme, de stratégie et de conditions de piste.

## Objectif de l'étape 4

L'étape 4 doit permettre :

- d'associer les sessions historiques existantes à des `session_key` OpenF1 quand c'est possible
- d'importer les laps pour les sessions de course
- d'importer les pit stops pour les sessions de course
- d'importer les weather samples pour les meetings correspondants
- d'exposer ces données via des routes API dédiées

## Source de données

Le socle historique reste structuré autour de Jolpica pour calendrier, standings et résultats.

Pour les données détaillées :

- `OpenF1` est utilisé pour `sessions`, `laps`, `pit`, `weather`
- le périmètre réel est limité aux saisons `2023+`

Ce mélange de sources est accepté car la base interne reste la source de vérité finale après normalisation.

## Hors périmètre

Cette étape n'inclut pas encore :

- télémétrie fine
- positions voiture
- race control détaillé
- radio
- live

## Approche retenue

L'approche retenue est :

1. faire un matching stable entre sessions internes et sessions OpenF1
2. enrichir la table `Session` avec `providerSessionKey` si manquant
3. ingérer ensuite les données détaillées par session de course

Le matching doit rester prudent et privilégier :

- le type de session
- l'année
- la proximité calendaire
- le nom du meeting si nécessaire

## Évolution du modèle Prisma

Le schéma Prisma doit être enrichi avec :

- `Lap`
- `PitStop`
- `WeatherSample`

Les données doivent être liées à :

- `Session`
- `Driver` pour les laps et pit stops

Les champs doivent rester ciblés sur l'analyse utile immédiate :

- numéro de tour, temps tour, secteurs, flags pit in/out
- arrêt au stand, tour, durée, numéro d'arrêt si disponible
- température air/piste, humidité, pluie, pression, vent

## Ingestion métier

L'ingestion doit fonctionner par année, mais ne traiter que les sessions compatibles OpenF1.

Pipeline proposé :

1. récupérer les sessions OpenF1 de l'année
2. faire correspondre les sessions internes existantes
3. mettre à jour les `providerSessionKey`
4. cibler ensuite les sessions `RACE`
5. pour chaque session de course appairée :
   - importer laps
   - importer pit stops
   - importer weather samples
6. effectuer des upserts idempotents

## API interne

Routes attendues :

- `GET /api/races/[year]/[round]/laps`
- `GET /api/races/[year]/[round]/pit-stops`
- `GET /api/races/[year]/[round]/weather`

Comportement attendu :

- priorité à la base locale
- fallback provider seulement si les données ne sont pas encore présentes
- si la session n'est pas compatible OpenF1, réponse propre sans crash

## Vérification de succès

L'étape 4 sera considérée comme terminée si :

- Prisma accepte le schéma détaillé
- les mappers OpenF1 sont testés
- une année compatible comme 2025 peut être enrichie
- des endpoints détaillés répondent avec `source=database`

## Risques identifiés

- matching imparfait entre sessions Jolpica et OpenF1
- couverture historique OpenF1 limitée aux saisons récentes
- volume potentiellement important sur les laps

Pour limiter ces risques :

- l'ingestion sera ciblée sur les sessions `RACE`
- le matching restera explicite et conservateur
- les données seront normalisées vers le modèle interne avant exposition

## Suite logique après cette étape

Une fois cette couche de détail en place, la prochaine suite naturelle sera :

- premières pages frontend historiques
- analytics de rythme et stratégie
- préparation du pipeline live
