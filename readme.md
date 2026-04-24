# App F1 - PitWall F1
## Architecture technique serveur + plateforme data + MVP applicatif

---

### 1) Vision produit
L’objectif n’est pas seulement de construire une app de consultation F1, mais une **plateforme de données F1** robuste et évolutive. Le système est conçu pour :

* **Centraliser** un très grand volume de données issues de l'écosystème F1.
* **Stocker** l’historique complet des saisons en base de données.
* **Capturer** les flux de données en temps réel (*live*) durant les week-ends de Grand Prix.
* **Isoler** techniquement le flux live du stockage historique pour garantir la performance et la fiabilité.
* **Rejouer, analyser et visualiser** les événements a posteriori (post-course).
* **Servir de socle** pour de futures analyses avancées, dashboards décisionnels, comparaisons de performances et modèles prédictifs.

> **Note stratégique :** L’application est pensée comme un système de **collecte, normalisation, stockage et exposition** de données (Backend-first), avant d'être une interface web utilisateur.  
Après la collection des données, le but est de les analyser et de les formater et de les exposer sur notre site. Ce dernier est un complément utilitaire pour les passionnés de Formule 1. Regarder les grands prix avec des analystics en plus, voici l'objectif du projet.


---

### 2) Philosophie d’architecture
#### 2.1 Choix architecturaux

On ne part pas d’une architecture “frontend-centric” type démo / app fan légère.
On part sur une architecture backend-first / data-first avec :  
* une base de données centrale riche  
* une couche d’ingestion des données historiques  
* une couche d’ingestion live séparée  
* une couche de staging live avant consolidation  
* une API interne pour exposer les données au front  
* une UI qui consomme uniquement les données internes  

2.2 Contraintes principales
* l’application tournera pour le moment sur mon serveur  
* pas de dépendance à Vercel (nous verrons l'hébergement à la fin, pour l'instant on fait tout en local)  
* la priorité est la qualité et la profondeur de la donnée  
* le live doit être traité comme un flux événementiel temporaire, puis consolidé en historique après la fin du Grand Prix


---

### 3) Architecture cible

```text
                ┌───────────────────────────┐
                │ Sources externes F1       │
                │ Jolpica / OpenF1 / FIA    │
                └─────────────┬─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Ingestion layer    │
                    │ sync + live        │
                    └─────────┬─────────┘
                              │
             ┌────────────────┴────────────────┐
             │                                 │
   ┌─────────▼─────────┐             ┌─────────▼─────────┐
   │ Live staging store │             │ Historical store  │
   │ flux GP en cours   │             │ base consolidée   │
   └─────────┬─────────┘             └─────────┬─────────┘
             │                                 │
             └──────────────┬──────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │ Internal API       │
                  │ query / aggregation│
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │ Frontend app       │
                  │ dashboard / live   │
                  └───────────────────┘
```


---

### 4) Principe fondamental de stockage

Deux modes de stockage bien distincts :  

#### 4.1 Base historique consolidée
C’est la base principale, durable, requêtable pour l’analyse. Elle contient :

* saisons
* championnats
* courses
* circuits
* pilotes
* équipes
* voitures / engagements saisonniers
* résultats
* qualifications
* sprints
* laps
* météo
* pit stops
* race control
* télémétrie agrégée ou complète selon stratégie
* standings par course et par saison

Cette base sert à :

* l’application principale
* les dashboards
* les requêtes analytiques
* les exports
* les futurs modèles de data science/ ML

#### 4.2 Zone live / staging séparée

Pendant un GP en cours, les données arrivent en continu.
Elles ne doivent pas être immédiatement injectées dans la base historique principale sans contrôle.
On met donc en place une **zone live dédiée** qui sert à :
* recevoir le flux temps réel
* conserver l’état courant de la session
* stocker des snapshots fréquents
* alimenter les écrans live
* permettre le rejeu post-course
* préparer la consolidation finale dans la base historique

Cette zone peut être en pratique :
* **Redis** pour l’état courant très rapide
* **tables SQL de staging** pour les snapshots et événements
* ou les deux en même temps

#### 4.3 Conclusion sur le stockage
Nous aurions donc : 
* **PostgreSQL** comme base principale
* **Redis** pour le cache et l’état live immédiat
* **tables de staging PostgreSQL** pour persister le flux live brut ou semi-brut


---

### 5) Flux de données recommandé

#### 5.1 Avant la saison / hors week-end
Jobs de synchronisation pour charger :
* saisons
* circuits
* équipes
* pilotes
* calendrier
* standings
* historique des courses déjà terminées
* météo historique si disponible
* laps / qualifs / résultats détaillés

#### 5.2 Pendant un week-end de Grand Prix
Quand une session est à venir ou en cours :
1. on ouvre une **session live** : sur une nouvelle page dans l'appli `/live` (voir point **15**), pour avoir cette partie à part. Cela va permettre d'avoir les données en direct sur la course suivie.
2. on initialise les structures de staging
3. on poll les APIs live à fréquence régulière
4. on stocke :
   * dernier état courant en Redis
   * événements / snapshots en tables de staging
5. le frontend lit les données depuis l’API interne
6. quand la session est terminée, on “ferme” la session live (on coupe le direct, la page affiche 'diffusion en direct terminée', et on valide que toutes les données du live ont été envoyées vers la bdd)

#### 5.3 Après la session / après le GP

On lance une étape de consolidation :
* nettoyage des doublons
* réconciliation des identifiants
* validation de cohérence
* enrichissement éventuel par données historiques / officielles
* insertion dans les tables historiques finales
* archivage ou conservation du brut live pour audit / replay


---

### 6) Architecture applicative
#### 6.1 Backend principal
##### A. API applicative
Exposition des données au frontend :
* standings
* courses
* pilotes
* équipes
* comparaisons
* live overview
* track map
* race control
* informations sur les voitures

##### B. Services d’ingestion
Processus backend séparés :
* sync historique
* sync standings
* sync calendrier
* sync session live
* consolidation post-session

##### C. Workers / jobs
Pour éviter que tout tourne dans le process web principal.

#### 6.2 Stack recommandée
##### Frontend
* **Next.js**
* **TypeScript**
* **Tailwind CSS**
* **React Query** pour le live
* **Recharts** pour les graphes

##### Backend / API
* **Next.js** pour le frontend
* **Route Handlers Next.js** pour l’API
* **workers Node.js séparés** pour l’ingestion

##### Données
* **PostgreSQL** pour l’historique et le staging SQL
* **Redis** pour l’état live et le cache chaud
* **Prisma** ou **Drizzle** pour l’ORM principal

##### Jobs
* **BullMQ** ou cron + workers Node.js

##### Infra self-hosted
* Docker


---

### 7) Déploiement visé

App pour un serveur classique. 

#### Setup conseillé au départ

* 1 serveur Linux (personnel, déjà fonctionnel. Pour le moment, on travail en local pour faire fonctionner l'appli)
* Docker Compose
* reverse proxy Nginx ou Traefik
* conteneurs pour :
  * frontend / app web
  * API si séparée
  * PostgreSQL
  * Redis
  * worker ingestion
  * worker live

#### Exemple logique
```text
[ Nginx ]
   ├── [ Next.js app ]
   ├── [ API backend ]
   ├── [ Worker sync ]
   ├── [ Worker live ]
   ├── [ PostgreSQL ]
   └── [ Redis ]
```


---

### 8) Modèle de données global

Le point important n’est pas juste d’avoir les résultats d’une course, mais une base assez riche pour de futures analyses. Donc la base doit être modélisée autour de 5 familles.

#### 8.1 Référentiels
* **Season**
* **Championship**
* **Circuit**
* **Constructor**
* **Driver**
* **Car**
* **TyreCompound**
* **SessionType**
* **WeatherCondition**

### 8.2 Entités sportives
#### RaceWeekend
Un week-end de GP. Il faudra trouver un moyen de pouvoir lancer la récupération des données (un bouton sur le site pour démarrer le listenning des données/le clore)

#### Session
FP1 / FP2 / FP3 / Quali / Sprint / Race.

#### DriverSeasonEntry
Association pilote-équipe-voiture-numéro pour une saison.

#### ConstructorSeasonEntry
Vue équipe pour une saison.

### 8.3 Résultats et performance
* **DriverStanding**
* **ConstructorStanding**
* **RaceResult**
* **SprintResult**
* **QualifyingResult**
* **Lap**
* **SectorTime**
* **PitStop**
* **TyreStint**
* **FastestLap**

### 8.4 Conditions et événements
* **WeatherSample**
* **TrackStatusEvent**
* **RaceControlMessage**
* **Penalty**
* **Incident**
* **SafetyCarPeriod**
* **VirtualSafetyCarPeriod**
* **RedFlagPeriod**

### 8.5 Données live / telemetry / tracking

#### LiveSession
Session active de collecte.

#### LivePositionSample
Position instantanée des voitures.

#### LiveTimingSample
Ordre en piste, gaps, intervals, dernier tour.

#### TelemetrySample
Speed, throttle, brake, gear, rpm, drs.

#### CarLocationSample
Coordonnées piste.

#### RadioMessage

#### LiveEventRaw
Payload brut reçu du provider.


---

### 9) Proposition de séparation des schémas SQL

Pour bien isoler les usages, je recommande même une séparation logique par schémas ou préfixes.

#### Schéma `core`
Référentiels et entités stables.
* seasons
* championships
* circuits
* constructors
* drivers
* cars
* race_weekends
* sessions
* driver_season_entries

#### Schéma `historical`
Données consolidées et validées.
* race_results
* qualifying_results
* sprint_results
* laps
* sector_times
* pit_stops
* tyre_stints
* standings_driver
* standings_constructor
* weather_samples
* race_control_messages
* telemetry_samples

#### Schéma `live`
Données temporaires ou en cours de collecte.
* live_sessions
* live_position_samples
* live_timing_samples
* live_weather_samples
* live_race_control
* live_telemetry_samples
* live_raw_events

#### Schéma `analytics` (partie finale)
Tables dérivées / pré-calculées.
* driver_vs_teammate
* stint_summaries
* pace_models
* sector_benchmarks
* overtakes
* tyre_degradation_models
* spec cars


---

### 10) Stratégie de consolidation live → historique
C’est le point central de l'applicaiton.

#### 10.1 Pendant le live
On écrit dans :
* `live.live_sessions`
* `live.live_position_samples`
* `live.live_timing_samples`
* `live.live_weather_samples`
* `live.live_race_control`
* `live.live_raw_events`

Redis garde :
* ordre courant
* dernier snapshot par pilote
* état piste
* météo courante
* statut session
* data globale du live

#### 10.2 En fin de session
On exécute un pipeline :

##### étape 1 — freeze
* on stoppe l’ingestion live
* on marque la live_session comme `completed`

##### étape 2 — validation
* on vérifie les doublons
* on trie temporellement
* on complète les clés manquantes
* on normalise les pilotes / équipes / sessions

##### étape 3 — transformation
* on convertit les données live en formes historiques
* ex. snapshots -> laps / position summaries / telemetry summaries

##### étape 4 — insertion historique
* on alimente les tables `historical.*`
* on conserve le brut dans `live.*` ou on archive

##### étape 5 — publication
* les endpoints “historical” basculent automatiquement sur la donnée consolidée

##### étape 6 — mise à jour de la vue live
* la vue live indique alors le prochain grand prix, et le temps à attendre pour y arriver


---

### 11) Schéma de base de données recommandé

#### 11.1 Entités principales

##### `core.seasons`
* id
* year
* starts_at
* ends_at

##### `core.championships`
* id
* season_id
* category
* name

##### `core.circuits`
* id
* provider_jolpica_id
* provider_openf1_key
* name
* country
* locality
* lat
* lng
* length_km
* turns
* clockwise

##### `core.constructors`
* id
* provider_jolpica_id
* name
* slug
* nationality
* color_hex
* logo_url

##### `core.drivers`
* id
* provider_jolpica_id
* provider_openf1_driver_number
* code
* permanent_number
* first_name
* last_name
* full_name
* nationality
* date_of_birth
* profile_image_url

##### `core.cars`
* id
* constructor_id
* season_id
* model_name
* chassis_name
* power_unit
* tyre_supplier

##### `core.race_weekends`
* id
* season_id
* round
* slug
* name
* official_name
* country
* circuit_id
* start_date
* end_date
* timezone
* status

##### `core.sessions`
* id
* race_weekend_id
* provider_session_key
* type
* name
* starts_at
* ends_at
* status
* is_live_capable

##### `core.driver_season_entries`
* id
* season_id
* driver_id
* constructor_id
* car_id
* car_number
* teammate_driver_id nullable

#### 11.2 Tables historiques

##### `historical.driver_standings`
* id
* season_id
* race_weekend_id nullable
* driver_id
* position
* points
* wins

##### `historical.constructor_standings`
* id
* season_id
* race_weekend_id nullable
* constructor_id
* position
* points
* wins

##### `historical.race_results`
* id
* race_weekend_id
* session_id
* driver_id
* constructor_id
* grid
* finish_position
* classified_position_text
* points
* laps_completed
* total_time_ms
* status
* fastest_lap_rank nullable

##### `historical.qualifying_results`
* id
* session_id
* driver_id
* constructor_id
* position
* q1_ms nullable
* q2_ms nullable
* q3_ms nullable

##### `historical.sprint_results`
* id
* session_id
* driver_id
* constructor_id
* position
* points
* laps_completed
* total_time_ms nullable

##### `historical.laps`
* id
* session_id
* driver_id
* lap_number
* lap_time_ms nullable
* sector1_ms nullable
* sector2_ms nullable
* sector3_ms nullable
* is_pit_out
* is_pit_in
* tyre_compound nullable
* tyre_life nullable

##### `historical.pit_stops`
* id
* session_id
* driver_id
* lap_number
* stop_number nullable
* duration_ms nullable

##### `historical.tyre_stints`
* id
* session_id
* driver_id
* compound
* start_lap
* end_lap nullable
* laps_count nullable

##### `historical.weather_samples`
* id
* session_id
* sampled_at
* air_temp
* track_temp
* humidity
* rainfall
* pressure
* wind_speed
* wind_direction

##### `historical.race_control_messages`
* id
* session_id
* category
* flag
* scope
* driver_id nullable
* lap_number nullable
* message
* published_at

##### `historical.telemetry_samples`
* id
* session_id
* driver_id
* sampled_at
* speed
* throttle
* brake
* drs
* n_gear
* rpm
* x nullable
* y nullable
* z nullable

#### 11.3 Tables live / staging

##### `live.live_sessions`
* id
* session_id
* provider_session_key
* status
* opened_at
* closed_at nullable
* ingest_frequency_ms
* source_name

##### `live.live_timing_snapshots`
* id
* live_session_id
* sampled_at
* driver_id
* position
* interval_to_front_ms nullable
* gap_to_leader_ms nullable
* last_lap_ms nullable
* best_lap_ms nullable
* lap_number nullable
* tyre_compound nullable
* tyre_life nullable
* pit_state nullable

##### `live.live_position_samples`
* id
* live_session_id
* sampled_at
* driver_id
* x
* y
* z nullable

##### `live.live_weather_samples`
* id
* live_session_id
* sampled_at
* air_temp
* track_temp
* humidity
* rainfall
* wind_speed
* wind_direction

##### `live.live_race_control`
* id
* live_session_id
* published_at
* category
* flag
* driver_id nullable
* lap_number nullable
* message

##### `live.live_telemetry_samples`
* id
* live_session_id
* sampled_at
* driver_id
* speed
* throttle
* brake
* drs
* n_gear
* rpm
* x nullable
* y nullable
* z nullable

##### `live.live_raw_events`
* id
* live_session_id
* source_name
* event_type
* payload_json
* received_at
* provider_event_id nullable


---

### 12) Prisma / ORM
Utilisation de Prisma pour :
* **Prisma** pour les tables `core` et `historical`
* accès SQL direct ou repository dédié pour certaines tables `live` très volumineuses

Pourquoi ?
* Prisma est agréable pour le métier
* mais les gros volumes live / telemetry peuvent nécessiter des insertions plus optimisées

Donc :
* Prisma pour le cœur du produit
* requêtes SQL ciblées pour les gros flux live


---

### 13) Organisation du code recommandée
```text
f1-platform/
  apps/
    web/                 # frontend Next.js
    api/                 
  packages/
    db/                  # prisma, migrations, accès db
    core-domain/         # types métier, zod, contrats
    provider-openf1/
    provider-jolpica/
    provider-fia/
    ingestion/
    live-engine/
    analytics/
  workers/
    sync-static/
    sync-history/
    sync-live/
    consolidate-session/
  infra/
    docker/
    compose/
    nginx/
```

#### Variante plus simple au départ
```text
f1-app/
  app/
  components/
  lib/
    api/
    providers/
    services/
    live/
    ingestion/
    db/
  prisma/
  workers/
  scripts/
  docker/
```


---

### 14) Endpoints API à prévoir

#### 14.1 Endpoints historiques

##### `GET /api/seasons/:year`
##### `GET /api/races?year=2025`
##### `GET /api/races/:year/:round`
##### `GET /api/races/:year/:round/results`
##### `GET /api/races/:year/:round/qualifying`
##### `GET /api/races/:year/:round/laps`
##### `GET /api/races/:year/:round/weather`
##### `GET /api/standings/drivers?year=2025`
##### `GET /api/standings/constructors?year=2025`
##### `GET /api/drivers/:driverCode`
##### `GET /api/drivers/:driverCode/results?year=2025`
##### `GET /api/teams/:teamSlug`
##### `GET /api/circuits/:circuitSlug`

#### 14.2 Endpoints live

##### `GET /api/live/sessions/current`
Retourne la session live en cours.

##### `GET /api/live/:sessionKey/overview`
* statut session
* leader
* ordre
* météo
* état piste

##### `GET /api/live/:sessionKey/positions`
* positions piste normalisées

##### `GET /api/live/:sessionKey/timing`
* gaps / derniers tours / pneus

##### `GET /api/live/:sessionKey/race-control`
* incidents / flags / messages

##### `GET /api/live/:sessionKey/weather`
* dernières mesures météo

##### `GET /api/live/:sessionKey/telemetry?driver=VER`
* samples télémétrie pour un pilote

#### 14.3 Endpoints admin / ingestion

##### `POST /api/admin/sync/season/:year`
##### `POST /api/admin/sync/race/:year/:round`
##### `POST /api/admin/live/open/:sessionKey`
##### `POST /api/admin/live/close/:sessionKey`
##### `POST /api/admin/live/consolidate/:sessionKey`

Ces endpoints peuvent aussi être internes et non publics.


---

### 15) UI du MVP applicatif
Le MVP visuel doit rester simple mais utile. On peut l'adapter à la fin du développement de la gestion des bdds si besoin, rajouter ou modifier des pages.

#### 15.1 Pages MVP
##### `/`
* prochain GP
* session live en cours si existante
* standings pilotes
* standings constructeurs
* dernières courses

##### `/live` (si session pas en cours, message qui indique quand est la prochaine session, dans combien de temps, le GP)
* session live en cours si existante
* classement provisoire
* standings constructeurs provisoire
* visuels circuit
* télémetrie
* data globale sur la course
* évolutions des rythmes

> **NB.** Au niveau du visuel de cette page, je vois quelque chose comme une sorte de cercle avec des images de plus en plus récentes de F1/ des voitures/ des pilotes (cercle qui tourne sur lui même pour ajouter du dynamisme à la page), avec au centre du cercle un compteur du temps restant avant le prochain GP.

##### `/races`
* calendrier saison
* statut des week-ends

##### `/races/[year]/[round]`
* détail du GP
* sessions
* résultats
* météo
* résumé data

##### `/races/[year]/[round]/live`
* leaderboard live
* track map
* météo
* race control
* comparaison pilote sélectionné

##### `/drivers/[driverCode]`
* fiche pilote
* historique saison
* résultats course par course
* stats de comparaison

##### `/teams/[teamSlug]`
* équipe
* pilotes
* résultats saison

##### `/analytics` (plus tard)
* comparaisons
* tendances
* dashboards

##### `/status`
* état de l'application
* dashboard de fonctionnement


---

### 16) Services backend à créer

#### `seasonSyncService`
* sync référentiels
* sync calendrier

#### `standingsSyncService`
* sync standings pilotes / constructeurs

#### `raceSyncService`
* sync résultats détaillés d’un GP terminé
* sync qualifs, sprint, laps, météo

#### `liveSessionService`
* ouvrir une session live
* stocker snapshots
* exposer état courant

#### `livePollingService`
* interroger OpenF1 / autre provider
* hydrater Redis et tables `live.*`

#### `liveConsolidationService`
* valider et migrer les données live vers `historical.*`

#### `analyticsPreparationService`
* produire des tables dérivées

---

### 17) Politique de rétention des données live

#### Tout conserver comme convenu et décrit.  
Cela va permettre de bien gérer l'historique. Attention cependant à n'avoir aucune dupplication des données.  
On devrait éviter ça grâce à notre ingestion unique en live. 


---

### 18) Performance base de données
Comme on veut accumuler beaucoup de données, il faut penser tôt à la volumétrie.

#### Optimisations
* index sur `session_id`, `driver_id`, `sampled_at`
* partitionnement temporel pour tables volumineuses
* éventuellement TimescaleDB plus tard si la volumétrie explose (optionnel pour le début du développement, on switch ensuite si cas critique)
* éviter de tout charger côté frontend
* paginer les données très denses 
* créer des vues / tables dérivées pour les dashboards


---

### 19) Choix technique recommandé 
Le meilleur compromis est :

#### Application
* **Next.js** pour le frontend

#### Backend
* **API interne Next.js** backend séparé pour une propreté stricte

#### Stockage
* **PostgreSQL** pour l’historique et le staging durable
* **Redis** pour le temps réel

#### Ingestion
* **workers Node.js séparés**
* **BullMQ** ou cron selon complexité

#### Déploiement
* **Docker Compose sur mon serveur**
* **Nginx / Traefik** en reverse proxy


---

### 20) Décision d’architecture finale
Pour bien répondre au besoin, l'architecture la plus propice serait :

#### Couche 1 — Base principale
* PostgreSQL
* stockage riche, normalisé, multi-saisons
* tables `core` + `historical`

#### Couche 2 — Live engine
* Redis + tables `live`
* collecte et affichage en direct
* séparation forte du flux live

#### Couche 3 — Consolidation
* job de fin de session / fin de GP
* migration live -> historique

#### Couche 4 — API interne
* une seule API de lecture pour le frontend

#### Couche 5 — Frontend
* dashboard, live, data views, analytics


---

### 21) Priorités de réalisation

#### Étape 1
* schéma base `core` + `historical` + `live`
* setup PostgreSQL + Redis
* architecture projet self-hosted

#### Étape 2
* providers Jolpica / OpenF1
* jobs de sync historiques
* endpoints standings / races / results

#### Étape 3
* moteur live
* tables de staging live
* endpoints live
* page live

#### Étape 4
* consolidation automatique post-session
* dashboards analytiques

---

### 22) Schéma Prisma initial

Ce schéma part sur PostgreSQL avec plusieurs schémas logiques (`core`, `historical`, `live`). Prisma prend bien en charge le multi-schema PostgreSQL via le champ `schemas` dans `datasource`.

> Fichier : `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["core", "historical", "live"]
}

enum SessionType {
  PRACTICE_1
  PRACTICE_2
  PRACTICE_3
  SPRINT_QUALIFYING
  SPRINT
  QUALIFYING
  RACE
  TEST

  @@schema("core")
}

enum SessionStatus {
  SCHEDULED
  LIVE
  FINISHED
  CANCELLED

  @@schema("core")
}

enum WeekendStatus {
  UPCOMING
  LIVE
  FINISHED
  CANCELLED

  @@schema("core")
}

enum LiveSessionStatus {
  OPEN
  PAUSED
  COMPLETED
  FAILED

  @@schema("live")
}

enum FlagStatus {
  GREEN
  YELLOW
  DOUBLE_YELLOW
  RED
  VSC
  SAFETY_CAR
  CHEQUERED
  UNKNOWN

  @@schema("historical")
}

model Season {
  id        String               @id @default(cuid())
  year      Int                  @unique
  startsAt  DateTime?
  endsAt    DateTime?
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt

  raceWeekends       RaceWeekend[]
  cars               Car[]
  driverSeasonEntries DriverSeasonEntry[]
  driverStandings    DriverStanding[]
  constructorStandings ConstructorStanding[]

  @@schema("core")
}

model Championship {
  id        String   @id @default(cuid())
  seasonId  String
  category  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  season Season @relation(fields: [seasonId], references: [id], onDelete: Cascade)

  @@unique([seasonId, category])
  @@schema("core")
}

model Circuit {
  id                 String   @id @default(cuid())
  providerJolpicaId  String?  @unique
  providerOpenF1Key  Int?     @unique
  slug               String   @unique
  name               String
  country            String?
  locality           String?
  lat                Float?
  lng                Float?
  lengthKm           Float?
  turns              Int?
  clockwise          Boolean?
  imageUrl           String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  raceWeekends RaceWeekend[]

  @@schema("core")
}

model Constructor {
  id                String   @id @default(cuid())
  providerJolpicaId String?  @unique
  slug              String   @unique
  name              String
  nationality       String?
  colorHex          String?
  logoUrl           String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  cars                   Car[]
  driverSeasonEntries    DriverSeasonEntry[]
  raceResults            RaceResult[]
  sprintResults          SprintResult[]
  qualifyingResults      QualifyingResult[]
  constructorStandings   ConstructorStanding[]

  @@schema("core")
}

model Driver {
  id                         String   @id @default(cuid())
  providerJolpicaId          String?  @unique
  providerOpenF1DriverNumber Int?
  code                       String?  @unique
  permanentNumber            Int?
  firstName                  String
  lastName                   String
  fullName                   String
  nationality                String?
  dateOfBirth                DateTime?
  profileImageUrl            String?
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt

  driverSeasonEntries DriverSeasonEntry[]
  raceResults         RaceResult[]
  sprintResults       SprintResult[]
  qualifyingResults   QualifyingResult[]
  laps                Lap[]
  pitStops            PitStop[]
  tyreStints          TyreStint[]
  driverStandings     DriverStanding[]
  weatherAnnotations  WeatherSample[] @relation("WeatherSampleDriver")
  raceControlMessages RaceControlMessage[]
  telemetrySamples    TelemetrySample[]
  liveTimingSnapshots LiveTimingSnapshot[]
  livePositionSamples LivePositionSample[]
  liveRaceControls    LiveRaceControl[]
  liveTelemetrySamples LiveTelemetrySample[]

  @@index([providerOpenF1DriverNumber])
  @@schema("core")
}

model Car {
  id           String   @id @default(cuid())
  seasonId     String
  constructorId String
  modelName    String?
  chassisName  String?
  powerUnit    String?
  tyreSupplier String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  season      Season               @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  constructor Constructor          @relation(fields: [constructorId], references: [id], onDelete: Cascade)
  driverSeasonEntries DriverSeasonEntry[]

  @@index([seasonId])
  @@index([constructorId])
  @@unique([seasonId, constructorId, modelName])
  @@schema("core")
}

model RaceWeekend {
  id           String         @id @default(cuid())
  seasonId     String
  round        Int
  slug         String
  name         String
  officialName String?
  country      String?
  circuitId    String
  startDate    DateTime?
  endDate      DateTime?
  timezone     String?
  status       WeekendStatus  @default(UPCOMING)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  season               Season                 @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  circuit              Circuit                @relation(fields: [circuitId], references: [id], onDelete: Restrict)
  sessions             Session[]
  driverStandings      DriverStanding[]
  constructorStandings ConstructorStanding[]
  raceResults          RaceResult[]

  @@unique([seasonId, round])
  @@unique([seasonId, slug])
  @@index([circuitId])
  @@schema("core")
}

model Session {
  id                 String        @id @default(cuid())
  raceWeekendId      String
  providerSessionKey Int?          @unique
  type               SessionType
  name               String
  startsAt           DateTime?
  endsAt             DateTime?
  status             SessionStatus @default(SCHEDULED)
  isLiveCapable      Boolean       @default(false)
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  raceWeekend        RaceWeekend          @relation(fields: [raceWeekendId], references: [id], onDelete: Cascade)
  qualifyingResults  QualifyingResult[]
  sprintResults      SprintResult[]
  raceResults        RaceResult[]
  laps               Lap[]
  pitStops           PitStop[]
  tyreStints         TyreStint[]
  weatherSamples     WeatherSample[]
  raceControlMessages RaceControlMessage[]
  telemetrySamples   TelemetrySample[]
  liveSessions       LiveSession[]

  @@index([raceWeekendId])
  @@index([type])
  @@schema("core")
}

model DriverSeasonEntry {
  id               String   @id @default(cuid())
  seasonId         String
  driverId         String
  constructorId    String
  carId            String?
  carNumber        Int?
  teammateDriverId String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  season          Season       @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  driver          Driver       @relation(fields: [driverId], references: [id], onDelete: Cascade)
  constructor     Constructor  @relation(fields: [constructorId], references: [id], onDelete: Cascade)
  car             Car?         @relation(fields: [carId], references: [id], onDelete: SetNull)
  teammateDriver  Driver?      @relation("TeammateDriver", fields: [teammateDriverId], references: [id], onDelete: SetNull)

  @@unique([seasonId, driverId])
  @@index([constructorId])
  @@index([carId])
  @@index([teammateDriverId])
  @@schema("core")
}

model DriverStanding {
  id            String   @id @default(cuid())
  seasonId      String
  raceWeekendId String?
  driverId      String
  position      Int
  points        Float
  wins          Int?
  createdAt     DateTime @default(now())

  season      Season       @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  raceWeekend RaceWeekend? @relation(fields: [raceWeekendId], references: [id], onDelete: SetNull)
  driver      Driver       @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@unique([seasonId, raceWeekendId, driverId])
  @@index([seasonId, position])
  @@schema("historical")
}

model ConstructorStanding {
  id            String   @id @default(cuid())
  seasonId      String
  raceWeekendId String?
  constructorId String
  position      Int
  points        Float
  wins          Int?
  createdAt     DateTime @default(now())

  season      Season       @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  raceWeekend RaceWeekend? @relation(fields: [raceWeekendId], references: [id], onDelete: SetNull)
  constructor Constructor  @relation(fields: [constructorId], references: [id], onDelete: Cascade)

  @@unique([seasonId, raceWeekendId, constructorId])
  @@index([seasonId, position])
  @@schema("historical")
}

model RaceResult {
  id                     String   @id @default(cuid())
  raceWeekendId          String
  sessionId              String
  driverId               String
  constructorId          String
  grid                   Int?
  finishPosition         Int?
  classifiedPositionText String?
  points                 Float?
  lapsCompleted          Int?
  totalTimeMs            Int?
  status                 String?
  fastestLapRank         Int?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  raceWeekend RaceWeekend @relation(fields: [raceWeekendId], references: [id], onDelete: Cascade)
  session     Session     @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driver      Driver      @relation(fields: [driverId], references: [id], onDelete: Cascade)
  constructor Constructor @relation(fields: [constructorId], references: [id], onDelete: Cascade)

  @@unique([sessionId, driverId])
  @@index([raceWeekendId])
  @@index([constructorId])
  @@schema("historical")
}

model QualifyingResult {
  id            String   @id @default(cuid())
  sessionId      String
  driverId       String
  constructorId  String
  position       Int
  q1Ms           Int?
  q2Ms           Int?
  q3Ms           Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  session     Session     @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driver      Driver      @relation(fields: [driverId], references: [id], onDelete: Cascade)
  constructor Constructor @relation(fields: [constructorId], references: [id], onDelete: Cascade)

  @@unique([sessionId, driverId])
  @@index([sessionId, position])
  @@schema("historical")
}

model SprintResult {
  id            String   @id @default(cuid())
  sessionId      String
  driverId       String
  constructorId  String
  position       Int
  points         Float?
  lapsCompleted  Int?
  totalTimeMs    Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  session     Session     @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driver      Driver      @relation(fields: [driverId], references: [id], onDelete: Cascade)
  constructor Constructor @relation(fields: [constructorId], references: [id], onDelete: Cascade)

  @@unique([sessionId, driverId])
  @@index([sessionId, position])
  @@schema("historical")
}

model Lap {
  id            String   @id @default(cuid())
  sessionId      String
  driverId       String
  lapNumber      Int
  lapTimeMs      Int?
  sector1Ms      Int?
  sector2Ms      Int?
  sector3Ms      Int?
  isPitOut       Boolean  @default(false)
  isPitIn        Boolean  @default(false)
  tyreCompound   String?
  tyreLife       Int?
  createdAt      DateTime @default(now())

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driver  Driver  @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@unique([sessionId, driverId, lapNumber])
  @@index([sessionId, lapNumber])
  @@index([driverId, lapNumber])
  @@schema("historical")
}

model PitStop {
  id           String   @id @default(cuid())
  sessionId     String
  driverId      String
  lapNumber     Int
  stopNumber    Int?
  durationMs    Int?
  createdAt     DateTime @default(now())

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driver  Driver  @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([sessionId, driverId])
  @@schema("historical")
}

model TyreStint {
  id          String   @id @default(cuid())
  sessionId    String
  driverId     String
  compound     String
  startLap     Int
  endLap       Int?
  lapsCount    Int?
  createdAt    DateTime @default(now())

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driver  Driver  @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([sessionId, driverId])
  @@schema("historical")
}

model WeatherSample {
  id            String   @id @default(cuid())
  sessionId      String
  sampledAt      DateTime
  airTemp        Float?
  trackTemp      Float?
  humidity       Float?
  rainfall       Float?
  pressure       Float?
  windSpeed      Float?
  windDirection  Float?
  driverId       String?

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driver  Driver? @relation("WeatherSampleDriver", fields: [driverId], references: [id], onDelete: SetNull)

  @@index([sessionId, sampledAt])
  @@schema("historical")
}

model RaceControlMessage {
  id          String      @id @default(cuid())
  sessionId    String
  category     String
  flag         FlagStatus?
  scope        String?
  driverId     String?
  lapNumber    Int?
  message      String
  publishedAt  DateTime

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driver  Driver? @relation(fields: [driverId], references: [id], onDelete: SetNull)

  @@index([sessionId, publishedAt])
  @@schema("historical")
}

model TelemetrySample {
  id          String   @id @default(cuid())
  sessionId    String
  driverId     String
  sampledAt    DateTime
  speed        Int?
  throttle     Int?
  brake        Int?
  drs          Int?
  nGear        Int?
  rpm          Int?
  x            Float?
  y            Float?
  z            Float?

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driver  Driver  @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([sessionId, driverId, sampledAt])
  @@schema("historical")
}

model LiveSession {
  id                String            @id @default(cuid())
  sessionId          String
  providerSessionKey Int?
  status            LiveSessionStatus @default(OPEN)
  openedAt          DateTime          @default(now())
  closedAt          DateTime?
  ingestFrequencyMs Int?
  sourceName        String
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  session              Session                @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  timingSnapshots      LiveTimingSnapshot[]
  positionSamples      LivePositionSample[]
  weatherSamples       LiveWeatherSample[]
  raceControlMessages  LiveRaceControl[]
  telemetrySamples     LiveTelemetrySample[]
  rawEvents            LiveRawEvent[]

  @@index([sessionId, status])
  @@schema("live")
}

model LiveTimingSnapshot {
  id                  String   @id @default(cuid())
  liveSessionId       String
  sampledAt           DateTime
  driverId            String
  position            Int?
  intervalToFrontMs   Int?
  gapToLeaderMs       Int?
  lastLapMs           Int?
  bestLapMs           Int?
  lapNumber           Int?
  tyreCompound        String?
  tyreLife            Int?
  pitState            String?

  liveSession LiveSession @relation(fields: [liveSessionId], references: [id], onDelete: Cascade)
  driver      Driver      @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([liveSessionId, sampledAt])
  @@index([driverId, sampledAt])
  @@schema("live")
}

model LivePositionSample {
  id            String   @id @default(cuid())
  liveSessionId String
  sampledAt     DateTime
  driverId      String
  x             Float
  y             Float
  z             Float?

  liveSession LiveSession @relation(fields: [liveSessionId], references: [id], onDelete: Cascade)
  driver      Driver      @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([liveSessionId, sampledAt])
  @@index([driverId, sampledAt])
  @@schema("live")
}

model LiveWeatherSample {
  id            String   @id @default(cuid())
  liveSessionId String
  sampledAt     DateTime
  airTemp       Float?
  trackTemp     Float?
  humidity      Float?
  rainfall      Float?
  windSpeed     Float?
  windDirection Float?

  liveSession LiveSession @relation(fields: [liveSessionId], references: [id], onDelete: Cascade)

  @@index([liveSessionId, sampledAt])
  @@schema("live")
}

model LiveRaceControl {
  id            String   @id @default(cuid())
  liveSessionId String
  publishedAt   DateTime
  category      String
  flag          String?
  driverId      String?
  lapNumber     Int?
  message       String

  liveSession LiveSession @relation(fields: [liveSessionId], references: [id], onDelete: Cascade)
  driver      Driver?     @relation(fields: [driverId], references: [id], onDelete: SetNull)

  @@index([liveSessionId, publishedAt])
  @@schema("live")
}

model LiveTelemetrySample {
  id            String   @id @default(cuid())
  liveSessionId String
  sampledAt     DateTime
  driverId      String
  speed         Int?
  throttle      Int?
  brake         Int?
  drs           Int?
  nGear         Int?
  rpm           Int?
  x             Float?
  y             Float?
  z             Float?

  liveSession LiveSession @relation(fields: [liveSessionId], references: [id], onDelete: Cascade)
  driver      Driver      @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([liveSessionId, driverId, sampledAt])
  @@schema("live")
}

model LiveRawEvent {
  id              String   @id @default(cuid())
  liveSessionId   String
  sourceName      String
  eventType       String
  payloadJson     Json
  receivedAt      DateTime @default(now())
  providerEventId String?

  liveSession LiveSession @relation(fields: [liveSessionId], references: [id], onDelete: Cascade)

  @@index([liveSessionId, receivedAt])
  @@index([eventType])
  @@schema("live")
}
```

---

### 23) Structure du projet self-hosted

Next.js peut être self-hosté sur un serveur Node.js ou via Docker, et propose aussi un mode `output: 'standalone'` pour générer un runtime minimal de production.

#### Arborescence recommandée

```text
f1-platform/
  apps/
    web/
      app/
        api/
          standings/
            drivers/route.ts
            constructors/route.ts
          races/
            route.ts
            [year]/[round]/route.ts
            [year]/[round]/results/route.ts
          live/
            sessions/current/route.ts
            [sessionKey]/overview/route.ts
            [sessionKey]/positions/route.ts
            [sessionKey]/timing/route.ts
            [sessionKey]/race-control/route.ts
        races/
          [year]/[round]/page.tsx
          [year]/[round]/live/page.tsx
        standings/
          drivers/page.tsx
          constructors/page.tsx
        drivers/
          [driverCode]/page.tsx
        teams/
          [teamSlug]/page.tsx
        layout.tsx
        page.tsx
      components/
        standings/
        race/
        live/
        charts/
        layout/
      lib/
        db/
          prisma.ts
          redis.ts
        providers/
          jolpica.ts
          openf1.ts
          fia.ts
        services/
          standings.service.ts
          races.service.ts
          drivers.service.ts
          live-query.service.ts
        mappers/
        validators/
        utils/
      public/
      next.config.ts
      package.json
      tsconfig.json
      .env.example
  packages/
    db/
      prisma/
        schema.prisma
      package.json
      tsconfig.json
    domain/
      src/
        contracts/
        dto/
        enums/
        types/
        validators/
      package.json
    ingestion/
      src/
        jobs/
        providers/
        pipelines/
        repositories/
        transformers/
      package.json
  workers/
    sync-static/
      src/index.ts
      package.json
    sync-history/
      src/index.ts
      package.json
    sync-live/
      src/index.ts
      package.json
    consolidate-session/
      src/index.ts
      package.json
  infra/
    docker/
      web.Dockerfile
      worker.Dockerfile
    compose/
      docker-compose.yml
    nginx/
      default.conf
  scripts/
    bootstrap.ts
    seed.ts
  package.json
  pnpm-workspace.yaml
  turbo.json
  .env.example
  README.md
```

#### Version simplifiée pour démarrer plus vite

```text
f1-app/
  app/
    api/
    races/
    standings/
    drivers/
    teams/
    layout.tsx
    page.tsx
  components/
  lib/
    db/
    providers/
    services/
    mappers/
    validators/
  prisma/
    schema.prisma
  workers/
    sync-static.ts
    sync-history.ts
    sync-live.ts
    consolidate-session.ts
  docker/
    Dockerfile
    docker-compose.yml
    nginx.conf
  scripts/
    seed.ts
  package.json
  next.config.ts
  tsconfig.json
  .env.example
```

---