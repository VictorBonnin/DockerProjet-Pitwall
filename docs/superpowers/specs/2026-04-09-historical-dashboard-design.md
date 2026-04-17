# Historical Dashboard Design

**Date:** 2026-04-09

**Goal:** créer la première vraie interface frontend de PitWall, centrée sur l'historique déjà ingéré en base.

## Contexte

Les étapes backend et data ont déjà produit une base locale riche :

- calendrier
- standings
- résultats de course, qualification et sprint
- laps
- pit stops
- météo

Le frontend actuel n'est qu'une page statique de bootstrap. Il faut maintenant une interface qui rende ces données lisibles et utiles pour un passionné de F1.

## Objectif de cette étape

L'étape doit transformer la page d'accueil `/` en dashboard historique PitWall.

Cette première interface doit :

- présenter clairement la saison active
- montrer l'état de complétude de la donnée
- exposer standings et calendrier
- mettre en avant un week-end de course et quelques indicateurs détaillés
- donner le ton visuel du produit

## Positionnement produit

Ce n'est pas un site de news ni un simple tableau brut.

L'interface doit évoquer :

- une salle de stratégie
- un outil de suivi pour regarder un Grand Prix avec plus de contexte
- une plateforme data propre, dense mais lisible

## Approche retenue

L'approche retenue est un dashboard historique sur la home page.

La page `/` devient une interface produit, pas seulement un point d'entrée technique.

Le contenu sera organisé en sections :

- hero saison
- standings
- calendrier de la saison
- focus sur un week-end
- indicateurs détaillés de course

## Données consommées

La page doit consommer uniquement les données internes déjà normalisées.

Le chargement peut s'appuyer sur des services backend dédiés au dashboard, sans appeler les providers externes côté interface.

## Expérience utilisateur attendue

La page doit permettre de comprendre rapidement :

- quelle saison on regarde
- quels sont les leaders
- quel GP est le plus intéressant à consulter
- si la base contient bien les résultats et le détail de course

Elle doit aussi commencer à raconter la richesse de PitWall :

- volume de tours
- arrêts au stand
- météo de session
- résultats du week-end

## Direction visuelle

Le design doit éviter le rendu "admin générique".

Direction souhaitée :

- une identité chaude et mécanique
- une ambiance strategy board / carnet de course
- hiérarchie claire entre éditorial, chiffres et détails
- mise en page forte sur desktop, lisible sur mobile

La typographie ne doit pas reposer sur le stack par défaut seul. Une police plus marquée doit être introduite si possible.

## Structure de page proposée

### 1. Hero saison

Contient :

- nom PitWall
- phrase de positionnement
- saison affichée
- quelques KPI globaux

### 2. Standings

Deux panneaux :

- pilotes
- constructeurs

Affichage compact, immédiatement lisible.

### 3. Calendrier

Vue de la saison sous forme de grille ou rail de courses.

Chaque Grand Prix doit montrer :

- round
- nom
- circuit ou pays
- statut de complétude data

### 4. Focus week-end

Un GP mis en avant avec :

- podium course
- top qualification
- sprint si disponible
- chiffres de détail comme nombre de laps, pit stops, météo

## Hors périmètre

Cette étape n'inclut pas encore :

- la vraie page `/live`
- un routeur complexe par GP
- des visualisations chartées avancées
- la comparaison multi-pilote poussée

## Structure de fichiers attendue

L'étape doit au minimum créer ou modifier :

- `app/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `lib/services/dashboard.service.ts`
- `tests/dashboard.service.test.ts`

Des composants supplémentaires peuvent être créés si cela améliore la clarté.

## Vérification de succès

L'étape sera considérée comme terminée si :

- la page `/` affiche un vrai dashboard historique
- le build passe
- les services de préparation de données sont testés
- l'interface est responsive
- la page utilise bien les données locales déjà stockées

## Suite logique après cette étape

Une fois ce dashboard historique livré, les suites naturelles seront :

- page détail d'un GP
- page `/live`
- premières visualisations analytiques plus poussées
