# Race Weekend Rebuild Design

## Goal
Refondre `/races/[year]/[round]` pour en faire une vraie fiche de Grand Prix centrée sur le circuit et les résultats du week-end.

## User-Facing Outcome
- Hero centré avec :
  - nom du Grand Prix
  - nom du circuit
  - date du week-end
- Tracé du circuit juste en dessous
- Ligne de données circuit :
  - longueur
  - meilleur tour F1 connu dans les données locales
  - pilote auteur de ce meilleur tour
- En dessous :
  - grille de départ des qualifications
  - sprint si disponible
  - résultats de course
- Les résultats course/sprint utilisent un podium visuel, puis un classement compact pour la suite.

## Data Model
- Garder `RaceWeekend`, `Session`, `RaceResult`, `QualifyingResult`, `SprintResult`, `Lap`
- Ajouter un catalogue local de référence circuit pour :
  - longueur formatée
  - tracé local
  - éventuels accents visuels
- Calculer le meilleur tour connu via `Lap` sur le même circuit dans les données locales.

## Rendering Strategy
- Construire un `race-weekend-page` model plus éditorial
- Supprimer les anciens blocs KPI / météo / complétude de la page principale
- Remplacer par :
  - hero circuit
  - section qualifs en grille
  - section sprint conditionnelle
  - section course avec podium

## Circuit Traces
- Utiliser des assets locaux
- Si un tracé exact n’est pas encore disponible, utiliser un fallback graphique local cohérent pour garder la page stable

## Testing
- Mettre à jour le test du service `race-weekend-page`
- Vérifier :
  - format du hero
  - meilleur tour connu
  - structuration `podium + reste`
  - structuration de la grille de départ
