# Official Assets And Navigation Design

**Date:** 2026-04-09

**Goal:** intégrer de vrais assets officiels locaux pour les pilotes et les équipes, puis ajouter une navigation réelle entre les pages principales du site.

## Contexte

La home a maintenant une bonne direction visuelle sombre et futuriste, mais il manque encore deux briques importantes pour donner au site un rendu plus abouti :

- de vrais visuels pilotes et équipes
- une navigation réelle entre les pages

L'utilisateur souhaite explicitement :

- des photos officielles des pilotes
- des logos officiels des équipes
- aucun système jetable ou bricolé
- une base technique durable

## Objectif de cette étape

Mettre en place :

- un stockage local persistant des assets officiels
- des chemins d'assets stockés en base
- une ingestion/backfill des assets
- l'affichage de ces assets sur la home
- des liens navigables vers les pages réelles du site
- les premières pages publiques pour les pilotes, équipes et calendrier saison

## Approche retenue

Les assets sont téléchargés depuis des pages officielles Formula1.com puis stockés localement dans le projet.

La base de données ne stocke pas les binaires, seulement les chemins :

- `Driver.imagePath`
- `Constructor.logoPath`

Cette approche permet :

- une autonomie complète une fois les assets récupérés
- une base légère
- un front simple à servir
- un système réutilisable sur toutes les pages

## Données et stockage

### Driver

Ajout de :

- `imagePath`
- éventuellement `profileSlug` seulement si nécessaire au pipeline d'assets

### Constructor

Ajout de :

- `logoPath`

### Stockage disque

Arborescence proposée :

- `public/assets/drivers/`
- `public/assets/teams/`

Les chemins enregistrés en base pointent vers des URLs locales de type :

- `/assets/drivers/nor.webp`
- `/assets/teams/mclaren.webp`

## Pipeline d'assets

Un script ou worker dédié :

- connaît les correspondances driver/team -> page officielle Formula1.com
- récupère la page officielle
- extrait l'URL de l'asset officiel
- télécharge le fichier dans `public/assets/...`
- met à jour la base avec le chemin local

Le système doit rester idempotent et relançable.

## Navigation

La navigation doit devenir réelle et exploitable :

- home `/`
- calendrier `/races`
- détail GP `/races/[year]/[round]`
- fiche pilote `/drivers/[driverCode]`
- fiche équipe `/teams/[teamSlug]`

La home doit permettre de naviguer :

- clic sur le prochain GP -> page du GP
- clic sur un pilote -> page pilote
- clic sur une équipe -> page équipe

## Pages concernées

### `/`

Affiche désormais :

- prochain GP avec lien
- live si existant
- standings pilotes avec photos et liens
- standings constructeurs avec logos et liens

### `/races`

Page simple mais propre :

- calendrier saison
- statut des week-ends
- liens vers chaque GP

### `/drivers/[driverCode]`

Première fiche pilote :

- photo officielle
- équipe actuelle
- position championnat
- résumé saison
- résultats course par course

### `/teams/[teamSlug]`

Première fiche équipe :

- logo officiel
- pilotes
- position championnat
- résumé saison

## Direction visuelle

Le langage visuel reste aligné avec la home sombre paddock-tech :

- surfaces sombres
- accents cyan/orange
- visuels officiels bien intégrés
- navigation discrète mais présente

## Hors périmètre

Cette étape n'inclut pas encore :

- upload d'assets depuis un back-office
- page `/live` complète
- page `/races/[year]/[round]/live`
- analytics avancées

## Structure de fichiers attendue

Au minimum :

- `prisma/schema.prisma`
- `lib/assets/f1-official-assets.ts`
- `scripts` ou `workers` pour le backfill d'assets
- `lib/services/home-page.service.ts`
- `lib/services/driver-page.service.ts`
- `lib/services/team-page.service.ts`
- `lib/services/races-index.service.ts`
- `app/page.tsx`
- `app/races/page.tsx`
- `app/drivers/[driverCode]/page.tsx`
- `app/teams/[teamSlug]/page.tsx`
- `app/layout.tsx`

## Vérification de succès

Cette étape est terminée si :

- les assets officiels sont téléchargés localement
- les chemins sont persistés en base
- la home affiche photos pilotes et logos équipes
- la navigation fonctionne réellement
- `/races`, `/drivers/[driverCode]`, `/teams/[teamSlug]` existent
- `npm test` passe
- `npm run build` passe

## Suite logique

Après ce lot, les suites naturelles sont :

- amélioration visuelle continue
- `/live`
- enrichissement des pages pilote / équipe
