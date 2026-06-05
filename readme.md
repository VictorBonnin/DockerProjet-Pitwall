# PitWall

Plateforme de données Formula 1 — résultats historiques, classements et session live en temps réel.

## À propos

PitWall est une application web qui centralise et visualise les données de la Formule 1 en s'appuyant sur deux sources externes :

- **[Jolpica / Ergast](https://api.jolpi.ca)** pour les données historiques (calendriers, résultats, classements)
- **[OpenF1](https://openf1.org)** pour la télémétrie et les données en temps réel pendant les sessions

### Fonctionnalités principales

**Données historiques**
- Calendrier de la saison en cours et des saisons passées
- Résultats complets de chaque Grand Prix : course, qualifications, sprint
- Grille de départ avec les temps par segment (Q1 / Q2 / Q3) et les écarts
- Classements pilotes et constructeurs mis à jour après chaque manche
- Historique par pilote (résultats saison par saison) et par équipe
- Fiche de chaque circuit : historique des vainqueurs, données techniques

**Session live**
- Tableau de bord en temps réel pendant une session F1 (course, qualifications, etc.)
- Classement instantané avec les écarts entre pilotes
- Données de télémétrie par voiture : vitesse, rapport, DRS, accélération, frein
- Positions sur la piste (carte en direct)
- Composé de pneus et numéro de relais
- Météo piste (température, pluie, vent)
- Messages de direction de course (drapeaux, safety car, etc.)

**Navigation**
- Page d'accueil avec le prochain Grand Prix, le compte à rebours et les classements résumés
- Pages dédiées par pilote, équipe et circuit
- Indicateur de session live accessible depuis toutes les pages

### Stack technique

| Couche | Technologie |
|---|---|
| Frontend / API | Next.js 15, React 19, Tailwind CSS 4 |
| Base de données | PostgreSQL 16 (via Prisma ORM) |
| Cache | Redis 7 |
| Validation | Zod |
| Tests | Vitest |
| Conteneurs | Docker, Docker Compose |
| CI / Qualité | GitHub Actions, SonarCloud |

---

## Prérequis

- [Docker & Docker Compose](https://docs.docker.com/get-docker/)

---

## Démarrage rapide

### 1. Cloner le projet

```bash
git clone https://github.com/VictorBonnin/DockerProjet-Pitwall.git
cd DockerProjet-Pitwall
```

### 2. Lancer le projet

```bash
docker compose -f docker/docker-compose.yml up --build
```

C'est tout. Docker Compose orchestre automatiquement :

1. **PostgreSQL** et **Redis** démarrent avec un healthcheck
2. **migrate** — applique le schéma Prisma sur la base de données
3. **seed** — importe les données F1 de la saison en cours depuis Jolpica
4. **app** — démarre l'application sur [http://localhost:3000](http://localhost:3000)

> Le seed tourne en parallèle de l'application. Les données apparaissent progressivement pendant l'import (quelques minutes). Les prochains `up` re-déclencheront le seed mais les upserts Prisma ne créeront pas de doublons.

### Arrêter et repartir de zéro

```bash
# Arrêter sans perdre les données
docker compose -f docker/docker-compose.yml down

# Arrêter et supprimer la base de données
docker compose -f docker/docker-compose.yml down -v
```

---

## Développement local

Pour travailler sur le code sans passer par Docker pour l'application :

**Prérequis supplémentaires :** [Node.js 22+](https://nodejs.org)

```bash
# 1. Démarrer uniquement PostgreSQL et Redis
docker compose -f docker/docker-compose.yml up postgres redis -d

# 2. Copier et configurer les variables d'environnement
cp .env.example .env

# 3. Installer les dépendances et initialiser la base
npm install
npm run prisma:generate
npm run prisma:push

# 4. Importer les données de la saison en cours
npm run worker:sync-history

# 5. Lancer le serveur de développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Commandes disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm start` | Démarrer en production |
| `npm test` | Lancer les tests |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Tests avec rapport de couverture |
| `npm run lint` | Analyse statique du code |
| `npm run prisma:generate` | Générer le client Prisma |
| `npm run prisma:push` | Synchroniser le schéma avec la base |
| `npm run worker:sync-history` | Importer les résultats historiques |
| `npm run worker:sync-static` | Importer les données de saison |
| `npm run worker:sync-live` | Ingestion des données live |
| `npm run worker:consolidate` | Consolider une session live |
| `npm run live:open` | Ouvrir une session live manuellement |

---

## Architecture

```
app/                  # Pages et routes API Next.js
lib/
├── providers/        # Clients HTTP (Jolpica, OpenF1)
├── services/         # Logique métier
├── db/               # Connexions PostgreSQL (Prisma) et Redis
└── env.ts            # Validation des variables d'environnement
tests/                # Tests unitaires (Vitest)
workers/              # Scripts d'ingestion de données
docker/               # Dockerfile et docker-compose.yml
```

**Sources de données externes :**
- [Jolpica/Ergast](https://api.jolpi.ca) — données historiques F1
- [OpenF1](https://openf1.org) — telémétrie et sessions en temps réel

---

## CI / Qualité

Le pipeline GitHub Actions s'exécute à chaque push :

1. **Lint** — ESLint
2. **Tests** — Vitest avec couverture de code (lcov)
3. **SonarCloud** — analyse de qualité et couverture
4. **Build Docker** — vérification de l'image

[![CI](https://github.com/VictorBonnin/DockerProjet-Pitwall/actions/workflows/ci.yml/badge.svg)](https://github.com/VictorBonnin/DockerProjet-Pitwall/actions/workflows/ci.yml)
