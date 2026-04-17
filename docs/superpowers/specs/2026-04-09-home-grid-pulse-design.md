# Home Grid Pulse Design

**Date:** 2026-04-09

**Goal:** refondre totalement la page `/` pour en faire une home sombre, paddock-tech et futuriste, limitée aux quatre informations MVP prioritaires.

## Contexte

La home actuelle est devenue un dashboard historique assez riche.

Le besoin a changé : la page d'accueil doit redevenir beaucoup plus focalisée et afficher uniquement :

- prochain GP
- session live en cours si existante
- standings pilotes
- standings constructeurs

Le ton visuel demandé est :

- fond noir
- moderne
- innovant
- ambiance paddock-tech / telemetry board

## Objectif de cette étape

Transformer `/` en page d'accueil produit très cadrée, avec une forte identité visuelle et sans contenu additionnel parasite.

Cette page ne doit plus montrer :

- focus week-end
- calendrier
- métriques historiques secondaires
- résumés de course

## Approche retenue

Créer une couche de données dédiée à la home, séparée du service de dashboard historique.

Cette couche doit préparer :

- le prochain Grand Prix à venir
- la session live courante si elle existe
- les standings pilotes
- les standings constructeurs

Le composant `app/page.tsx` devient alors une mise en scène visuelle de ce modèle de home, au lieu de réutiliser le gros dashboard existant.

## Contenu fonctionnel

### 1. Prochain GP

Bloc hero principal.

Contient :

- nom du GP
- circuit
- pays / localité
- round
- fenêtre de date
- éventuellement la prochaine session connue du week-end

Le prochain GP correspond au premier `RaceWeekend` non terminé de la saison locale, avec fallback propre si tout est déjà complété.

### 2. Session live

Bloc secondaire.

Si une session live est ouverte :

- type de session
- nom du GP
- statut live

Sinon :

- message de veille clair
- rappel que le live s'ouvrira à la prochaine session

### 3. Standings pilotes

Panneau compact, lisible et dense.

La lecture doit être immédiate :

- position
- code pilote
- nom
- équipe
- points

### 4. Standings constructeurs

Même logique :

- position
- équipe
- points

## Direction visuelle

La home doit adopter une direction `Grid Pulse` :

- fond noir profond
- grille discrète
- halos lumineux cyan et orange
- surfaces sombres avec effet technique / glass / cockpit
- hiérarchie très nette entre hero, live et standings

L'ensemble doit évoquer :

- une salle de contrôle
- un écran de briefing pré-week-end
- une interface technique contemporaine, pas un dashboard admin générique

## Structure de page proposée

### Zone 1

Hero du prochain GP sur la majeure partie de l'écran, accompagné du bloc live.

### Zone 2

Deux panneaux de standings :

- pilotes
- constructeurs

Ces deux panneaux doivent équilibrer la page et fermer la composition visuelle.

## Hors périmètre

Cette étape n'inclut pas :

- dernières courses
- calendrier
- focus week-end
- analytics
- changements sur `/races/[year]/[round]`

## Structure de fichiers attendue

Au minimum :

- `lib/services/home-page.service.ts`
- `tests/home-page.service.test.ts`
- `tests/run.ts`
- `app/page.tsx`
- `app/globals.css`

## Vérification de succès

L'étape est validée si :

- `/` n'affiche plus que les quatre blocs demandés
- la page a bien un rendu sombre paddock-tech
- la couche de données home est testée
- `npm test` passe
- `npm run build` passe
- le smoke test HTTP sur `/` renvoie bien la nouvelle home

## Suite logique

Après cette refonte, les suites naturelles sont :

- `/races`
- `/drivers/[driverCode]`
- `/live`
