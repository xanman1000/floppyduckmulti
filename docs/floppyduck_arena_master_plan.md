# FloppyDuck Arena Production Blueprint

> **Purpose:** Provide complete, implementation-ready specifications for building FloppyDuck Arena—a cross-platform mobile multiplayer evolution of Flappy Bird featuring real-time head-to-head play, deep progression, and rich customization. This document is intended to be sufficient for an AI-driven team to execute from prototype to global launch without additional clarification.

---

## 1. Product Pillars & Success Metrics

### 1.1 Pillars
1. **Precision Arcade Feel** – Frame-perfect input latency, deterministic physics, responsive animations.
2. **Competitive Intensity** – Fair matchmaking, transparent ranking, meaningful rewards for mastery.
3. **Personal Expression** – Deep cosmetic system with themed environments, characters, and effects.
4. **Evergreen Engagement** – Seasonal content, events, and clubs that encourage social retention.

### 1.2 KPIs
- D1/D7/D30 retention: 45% / 20% / 10%.
- Average session length: 8 minutes, 2.5 sessions/day.
- Match completion rate: >95%.
- Multiplayer queue wait time p95: <20 seconds.
- Crash-free sessions: >99.5%.
- Monetization: ARPDAU $0.35, conversion 5%.

---

## 2. Feature Inventory & Release Sequencing

### 2.1 Release Phases
| Phase | Duration | Goals | Feature Set |
| --- | --- | --- | --- |
| **Pre-production** | 6 weeks | Validate core loop, art direction, tech stack | Single-player prototype, basic physics, placeholder art, network spike (WebSocket echo) |
| **Vertical Slice** | 10 weeks | Deliver playable proof of multiplayer + progression | Single-player polish, realtime 1v1 with bots, initial matchmaking, basic cosmetics, store stub |
| **Alpha** | 12 weeks | Feature-complete systems, start live telemetry | Ranked/casual queues, ELO rating, battle pass v1, inventory service, analytics pipeline, crash reporting |
| **Beta / Soft Launch** | 8 weeks | Monetization + LiveOps readiness, scalability tests | Clubs, events, push notifications, A/B testing, LiveOps console, IAP integration |
| **Global Launch** | ongoing | Content cadence, optimizations | Seasonal rotations, new themes, tournaments, marketing integrations |

### 2.2 Feature Breakdown (Workstreams)
1. **Game Client** – Core gameplay, UI/UX, networking.
2. **Real-Time Services** – Matchmaking, authoritative game server.
3. **Meta Services** – Accounts, progression, inventory, store.
4. **LiveOps & Analytics** – Telemetry, A/B testing, admin tools.
5. **Infrastructure & Tooling** – CI/CD, observability, load testing.
6. **Content Production** – Art, audio, level design, localization.

---

## 3. Gameplay Design Specification

### 3.1 Core Loop
1. Player enters lobby (home screen) → selects mode (Single-player, Ranked, Casual, Private) → queue.
2. Match found → countdown (3s) → synchronous start with shared RNG seed.
3. Players tap to flap, avoiding obstacles. Survivor with highest distance wins.
4. Post-match: rewards (XP, Feathers, Golden Eggs), update ratings, present rematch / next match.
5. Progression: accumulate XP for account level; complete battle pass tiers; unlock cosmetics.

### 3.2 Modes
- **Legacy Single-Player:** Endless run, local/offline capability, daily challenges with curated seeds, daily multiplier rewards.
- **Ranked Head-to-Head:** MMR-based tiers (Bronze, Silver, Gold, Platinum, Diamond, Master). Best-of-1 matches, sudden death at 90s (pipes narrow, speed increases).
- **Casual Head-to-Head:** No rating impact, relaxed matchmaking, optional power-ups.
- **Private Match / Friend Duel:** Invite code, spectating enabled, rematch loop.
- **Weekend Tournaments:** Limited-time bracket with entry fee (Feathers) and leaderboard rewards.

### 3.3 Physics & Controls
- Timestep: 60 FPS rendering, 120 Hz internal physics steps (sub-stepping to ensure determinism).
- Gravity constant, flap impulse, drag coefficients defined in configuration table (see Appendix A).
- Collision detection via bounding boxes approximated as circles for ducks, rectangles for pipes; server authoritative.
- Input buffering: 2 frame grace window to mitigate network jitter; server reconciles with last acknowledged input.

### 3.4 Obstacles & Level Generation
- Obstacle sets defined by weighted templates (gap size, vertical offset, hazard type).
- Shared RNG seed per match ensures identical layout across clients.
- Difficulty ramps every 15 seconds (pipe speed increase, gap reduction) until sudden death parameters.
- Special obstacles for events (moving pipes, wind gusts) flagged via LiveOps config.

### 3.5 Power-Ups (Multiplayer)
- Loadout slots: 2 selectable before match; unlock via progression.
- Examples: **Shield** (one-hit immunity, 5s duration, 30s cooldown), **Slow-Mo** (global time dilation 20% for 3s, once per match), **Ghost** (intangible for 2s, disables scoring during effect).
- Balance: Ranked queue permits Shield + Slow-Mo only; others casual; all effects validated server-side.

### 3.6 Progression & Economy
- **XP**: Earned per match (base + performance + streak). Leveling unlocks currency and cosmetics.
- **Feathers (Soft Currency):** Rewarded for matches, quests; spent on loot boxes, rerolls, club donations.
- **Golden Eggs (Hard Currency):** IAP. Buy premium battle pass, direct cosmetic bundles.
- **Battle Pass:** 50 tiers per season, free/premium tracks, weekly missions, milestone cosmetics.
- **Collection Log:** Permanent progression; unlock badges for completing theme sets.

### 3.7 Customization & Themes
- Components: Duck skins (body, wings), trails, pipe skins, backgrounds, music tracks, victory emotes.
- Theme Builder UI: choose base theme + mix individual components; preview in 3D diorama.
- Cosmetics categorized by rarity (Common, Rare, Epic, Legendary); drop tables defined in LiveOps config.

### 3.8 Social Systems
- **Friends:** Add via unique code, platform integration, or contact sync opt-in.
- **Clubs:** Capacity 50, shared chat (text + stickers), weekly co-op objectives (distance flown, matches won), club rank leaderboard.
- **Spectating:** Real-time observer stream from authoritative server, 1-second delay, limit 10 spectators per match.

### 3.9 Accessibility & Compliance
- Colorblind-friendly palettes, adjustable tap zones, haptic toggle, audio cues for obstacles.
- COPPA-friendly defaults: minimal data for under-13 flagged accounts, chat filtered via moderation service, parental consent workflow.

---

## 4. Technical Architecture

### 4.1 High-Level Diagram (Textual)
```
[Mobile Client (Unity/Godot)]
  |-- REST/GraphQL --> [API Gateway]
  |-- WebSocket ---> [Real-Time Match Service]

[API Gateway]
  |---> [Authentication Service]
  |---> [Progression Service]
  |---> [Inventory/Cosmetics Service]
  |---> [Battle Pass Service]
  |---> [Club Service]
  |---> [Store & Payments]
  |---> [Notification Service]
  |---> [Analytics Ingest]

[Real-Time Match Service]
  |---> [Authoritative Game Server Pool]
  |---> [Matchmaking Service]
  |---> [Relay / Spectator Stream]

[Shared Infrastructure]
  |---> PostgreSQL (meta data)
  |---> Redis (caches, queues)
  |---> Kafka (event stream)
  |---> S3-compatible storage (assets, replays)
  |---> CDN (static assets)
  |---> Firebase/APNs/FCM (notifications)
  |---> BigQuery/Amplitude (analytics)
```

### 4.2 Client Stack
- **Engine:** Unity 2022 LTS (C#).
- **Architecture:** MVVM with UniRx for reactive UI, ScriptableObjects for configuration, Addressables for asset bundles.
- **Networking:** Native WebSocket (BestHTTP) for match service; REST (UnityWebRequest) for meta.
- **State Management:** Central `GameState` singleton with read-only interfaces; use Zenject for dependency injection.
- **UI:** UIToolkit for layout, support dynamic localization; design tokens stored in JSON.
- **Platform Services:** Google Play Games / Game Center integration, native IAP via Unity IAP, push notifications via Firebase SDK.

### 4.3 Server Stack
- **Language:** Go 1.21 for low-latency services.
- **Frameworks:** Fiber for HTTP API, Gorilla WebSocket for real-time; gRPC internal comms.
- **Data:** PostgreSQL 15 with Prisma or SQLC; Redis 7 for caching; Kafka for event bus; ClickHouse for telemetry (optional, else BigQuery).
- **Containerization:** Docker images per service; orchestrated via Kubernetes (GKE).
- **Configuration:** Consul for service discovery; Vault for secrets; feature flags via LaunchDarkly or open-source equivalent (Unleash).

### 4.4 Service Responsibilities
1. **Gateway / BFF**
   - Terminates TLS, handles rate limiting (Envoy or NGINX ingress).
   - Issues JWTs after OAuth via Authentication Service.
2. **Authentication Service**
   - Supports OAuth (Apple, Google), device ID guest accounts, parental control flows.
   - Stores user identities (Postgres), hashed tokens.
3. **Matchmaking Service**
   - Maintains player queues per region, mode, skill bracket.
   - Uses Redis sorted sets for queue ordering; matches by minimizing `(skill_delta * weight) + (latency * weight) + (queue_time * weight)`.
   - On match creation, allocates game server instance, passes shared seed.
4. **Game Server**
   - Runs deterministic simulation; tick rate 30 TPS server, 60 client updates.
   - Receives input frames, runs physics, sends authoritative state diff every tick.
   - Handles cheat detection: improbable inputs, lag switching, inconsistent physics states.
   - Persists match results, replays (compressed inputs + seed) to S3.
5. **Progression Service**
   - Stores player XP, levels, quest progress.
   - Calculates rewards based on match outcomes, ensures atomic transactions.
6. **Inventory/Cosmetics Service**
   - Manages owned items, loadouts, equip states.
   - Supports item granting/revocation (admin API), transaction logs.
7. **Battle Pass Service**
   - Tracks season progression, weekly/daily missions.
   - Configurable via LiveOps console; supports premium track entitlement.
8. **Economy/Store Service**
   - Handles soft/hard currency balances, purchases, IAP receipts verification (Apple/Google server-side).
   - Rotating offers, loot box probabilities, pity timers.
9. **Club Service**
   - CRUD for clubs, membership management, chat integration (with moderation service such as AWS Comprehend or custom ML filter).
   - Weekly objective tracking, reward distribution.
10. **Notification Service**
    - Schedules and sends push notifications; integrates with Firebase Cloud Messaging/APNs.
11. **Analytics Service**
    - Receives events via HTTP or gRPC, buffers to Kafka, streams to BigQuery.
12. **LiveOps Console**
    - Web app (React + Next.js) for operations staff; manages feature flags, events, store content, push campaigns.

### 4.5 Infrastructure
- **Kubernetes:** Deploy services in namespaces per environment (dev, staging, prod). Horizontal Pod Autoscaler configured on CPU and custom latency metrics.
- **CI/CD:** GitHub Actions pipelines for client (build/test, deploy to Firebase App Distribution/TestFlight) and server (unit tests, container build, deploy via ArgoCD).
- **Monitoring:** Prometheus + Grafana dashboards; Loki for logs; Jaeger for tracing. Alerts via PagerDuty.
- **Security:** mTLS between services, IAM roles per microservice, automated dependency scanning (Snyk/GitHub Dependabot).

---

## 5. Data Models & Storage Schemas

### 5.1 User Table (PostgreSQL)
```
users (
  id UUID PK,
  platform_id TEXT UNIQUE,
  platform_type ENUM('apple','google','guest'),
  created_at TIMESTAMP,
  last_login TIMESTAMP,
  region TEXT,
  age_bracket ENUM('u13','13plus'),
  ban_status ENUM('active','suspended','banned'),
  consent_flags JSONB
)
```

### 5.2 Player Profile
```
player_profiles (
  user_id UUID FK users.id,
  display_name TEXT UNIQUE,
  level INT,
  xp BIGINT,
  mmr INT,
  tier ENUM('bronze','silver','gold','platinum','diamond','master'),
  avatar_id UUID FK cosmetics.id,
  title_id UUID FK cosmetics.id,
  last_equipped_theme UUID FK themes.id,
  statistics JSONB (total_matches, win_rate, best_distance,...)
)
```

### 5.3 Inventory & Loadout
```
cosmetics (
  id UUID PK,
  type ENUM('skin','trail','pipe','background','music','emote'),
  rarity ENUM('common','rare','epic','legendary'),
  theme_id UUID FK themes.id,
  asset_bundle_key TEXT,
  metadata JSONB
)

player_items (
  id UUID PK,
  user_id UUID FK,
  cosmetic_id UUID FK,
  acquired_via ENUM('battle_pass','purchase','event','grant'),
  acquired_at TIMESTAMP
)

loadouts (
  id UUID PK,
  user_id UUID FK,
  name TEXT,
  slots JSONB (skin,trail,pipe,background,music,emote,powerups[2])
)
```

### 5.4 Progression & Battle Pass
```
missions (
  id UUID PK,
  type ENUM('daily','weekly','seasonal'),
  objective JSONB,
  reward JSONB,
  season_id UUID
)

player_missions (
  player_id UUID FK,
  mission_id UUID FK,
  progress INT,
  completed BOOLEAN,
  refreshed_at TIMESTAMP
)

battle_pass_progress (
  player_id UUID FK,
  season_id UUID FK,
  tier INT,
  xp INT,
  premium_unlocked BOOLEAN
)
```

### 5.5 Match Records
```
matches (
  id UUID PK,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  mode ENUM('single','ranked','casual','private','tournament'),
  seed BIGINT,
  server_region TEXT,
  duration_seconds INT,
  sudden_death_triggered BOOLEAN
)

match_participants (
  match_id UUID FK,
  player_id UUID FK,
  result ENUM('win','loss','draw'),
  distance INT,
  score JSONB,
  mmr_change INT,
  rewards JSONB,
  input_log_uri TEXT
)
```

---

## 6. API Specifications

### 6.1 Authentication
- `POST /auth/guest` → returns guest token, user_id.
- `POST /auth/oauth` → exchanges platform token; returns JWT, refresh token.
- `POST /auth/refresh` → new access token.
- `POST /auth/upgrade` → convert guest to OAuth; handles conflict.

### 6.2 Player Profile
- `GET /player/{id}` → profile summary, cosmetics, stats.
- `PATCH /player/{id}` → update display name, region, loadout selection.
- `GET /player/{id}/progression` → level, XP, missions status.

### 6.3 Matchmaking & Game Sessions
- `POST /queue` payload `{mode, region, powerups}` → returns ticket_id.
- `GET /queue/{ticket_id}` → `searching | matched | failed`, includes server endpoint, auth token, seed.
- `POST /queue/cancel`.
- `POST /match/report` from server to meta service with results payload.

### 6.4 Inventory & Store
- `GET /store/offers` (supports segmentation via headers for A/B testing).
- `POST /store/purchase` with offer_id; returns updated inventory.
- `POST /store/iap/verify` for Apple/Google receipts.
- `GET /inventory` list of items, equipped loadout.
- `POST /inventory/equip`.

### 6.5 Battle Pass & Missions
- `GET /battlepass` current season data, tiers.
- `POST /battlepass/claim` with tier_id.
- `GET /missions` (daily, weekly, seasonal).
- `POST /missions/claim`.

### 6.6 Clubs & Social
- `POST /clubs` create, `GET /clubs/{id}`, `POST /clubs/{id}/join`, `POST /clubs/{id}/leave`.
- `GET /clubs/{id}/members`, `POST /clubs/{id}/message` (via chat service), `GET /clubs/{id}/objectives`.
- Friend APIs: `POST /friends/request`, `POST /friends/accept`, `DELETE /friends/{id}`.

### 6.7 Analytics Events (examples)
- `client_event` payload includes `event_name`, `timestamp`, `user_id`, `session_id`, `parameters JSON`.
- Mandatory events: `app_launch`, `match_started`, `match_finished`, `purchase_attempt`, `purchase_success`, `battlepass_tier_claimed`, `club_joined`.

---

## 7. Client Implementation Plan

### 7.1 Project Structure (Unity)
```
Assets/
  Scripts/
    Core/ (GameLoop, Input, Physics)
    Networking/ (WebSocketClient, MatchService)
    UI/ (ViewModels, Views)
    Systems/ (ProgressionManager, InventoryManager)
    Features/
      SinglePlayer/
      Multiplayer/
      Clubs/
  Art/
  Audio/
  Addressables/
  Resources/
  Tests/
Packages/
ProjectSettings/
```

### 7.2 Module Responsibilities
- **Core**: deterministic physics, entity components, time manager.
- **Networking**: handles handshake, message serialization (FlatBuffers or Protobuf), reconnection.
- **UI**: MVVM; ViewModels expose Observables; Views subscribe; uses data binding.
- **Systems**: wrappers over REST API, local caching (SQLite via Unity Database).
- **SinglePlayer Feature**: offline seed generator, scoreboard, daily challenge scheduler.
- **Multiplayer Feature**: lobby, queueing UI, match HUD, spectator view.
- **Clubs Feature**: membership UI, chat integration (Photon Chat or custom WebSocket).

### 7.3 Match Flow (Client)
1. Player selects mode → `MatchmakingViewModel` posts queue request.
2. Poll ticket or use server-sent events via WebSocket to receive match assignment.
3. Connect to game server using secure WebSocket; send authentication token.
4. Receive `match_start` message (seed, countdown time, opponent metadata).
5. Run deterministic simulation locally; send input frames (`tick, input_state`).
6. Receive server snapshots; apply reconciliation (rewind to last acknowledged tick, replay inputs).
7. On match end, show `ResultsView` (outcome, stats, rewards). On exit, fetch updated progression.

### 7.4 Offline & Error Handling
- Cache latest profile, inventory, and daily challenge data for offline use.
- Retry logic with exponential backoff for REST calls.
- Graceful handling of disconnect mid-match: attempt reconnection within 10s; otherwise forfeit.
- Crash recovery: upon relaunch, client checks pending rewards from server via `/match/pending`.

### 7.5 Localization & Accessibility
- Use CSV/Google Sheets integration via Unity Localization package.
- Support at least English, Spanish, French, German, Japanese at launch.
- Provide subtitles for audio cues, adjustable contrast, toggle for reduced motion.

### 7.6 Art & Audio Guidelines
- **Art Style:** Vibrant, cartoony, 2.5D parallax backgrounds, dynamic lighting.
- **Animation:** 8-directional wing cycles, idle animations, emotive victory poses.
- **VFX:** Particle systems for trails, collision sparks.
- **Audio:** Adaptive soundtrack layers (calm → intense). Use FMOD or Wwise for integration.

---

## 8. Backend Implementation Plan

### 8.1 Repository Layout
```
backend/
  cmd/
    gateway/
    auth/
    matchmaking/
    gameserver/
    progression/
    inventory/
    battlepass/
    economy/
    clubs/
    notifications/
    analytics/
  internal/
    config/
    db/
    http/
    mq/
    services/
    models/
  pkg/
    logger/
    telemetry/
    auth/
  deployments/
    k8s/
      dev/
      staging/
      prod/
  scripts/
    migrate.sh
  tests/
    integration/
```

### 8.2 Common Libraries
- `logger`: structured logging (Zap) with correlation IDs.
- `auth`: JWT parsing, permission checks.
- `telemetry`: Prometheus metrics, tracing instrumentation.
- `db`: connection pool management, migrations (Goose or Atlas).

### 8.3 Game Server Lifecycle
1. Matchmaking picks region-specific server pool (Kubernetes StatefulSet or Agones fleet).
2. Allocator sends `StartMatch` gRPC call to game server instance.
3. Game server loads match config (seed, players, loadouts) from Redis or direct payload.
4. Server sends `match_start` message to clients, enters tick loop.
5. On completion, server writes results to PostgreSQL via `MatchResult` gRPC to Progression service, uploads replay to S3.
6. Server returns to idle state or terminates if using ephemeral pods.

### 8.4 Scaling Strategy
- **Match Servers:** Use Agones on GKE to manage fleets; autoscale based on player demand.
- **Meta Services:** Horizontal Pod Autoscaler (2→10 replicas). Redis cluster with read replicas.
- **Databases:** Use Cloud SQL (Postgres) with read replicas for analytics queries; partition tables by season where necessary.

### 8.5 Testing Strategy
- Unit tests for all services (Go testing framework), coverage >80% for core logic.
- Integration tests using docker-compose; run in CI before merge.
- Load testing for matchmaking and game servers via k6; simulate 100k concurrent players.
- Chaos testing: inject latency, packet loss to ensure resilience.

### 8.6 Security & Compliance
- TLS 1.2+ enforced; Let’s Encrypt for certificates.
- WAF rules for API Gateway; rate limits per IP and per account.
- DDoS mitigation via Cloud Armor.
- GDPR compliance: data export/delete endpoints, consent logging.
- COPPA: segregate under-13 data, disable social features.

---

## 9. LiveOps & Content Pipeline

### 9.1 Content Authoring Workflow
- Designers use Google Sheets (synced via script) for obstacle configs, mission tables.
- Artists deliver assets into `Art/Source` repository; automated import pipeline creates Addressable bundles.
- Audio delivered as Wwise projects; builds triggered via CI to produce banks.

### 9.2 Seasonal Cadence
- Seasons last 8 weeks; pre-production of next season overlaps by 4 weeks.
- Each season includes: 1 new theme set (background + pipes + music), 3 duck skins, 2 trails, 1 emote, 1 limited event.
- Battle pass missions rotate weekly; difficulty balanced by analytics review.

### 9.3 Event System
- Configurable via LiveOps console: define start/end time, eligible regions, modifiers (e.g., double XP, special obstacles).
- Backend reads event config from Redis (cached) with fallback to Postgres.
- Client polls `GET /events` at login and every 30 minutes.

### 9.4 AB Testing
- Assign cohorts server-side; include `ab_buckets` in JWT.
- Variation parameters: obstacle density, reward multipliers, store pricing, UI layouts.
- Analytics events include `experiment_id` and `variant` fields.

### 9.5 Moderation & Community Safety
- Chat messages filtered via third-party moderation API before broadcast.
- Report system: `POST /report` with offender_id, reason; triggers review workflow in LiveOps console.
- Automated detection for toxic behavior; repeat offenders auto-muted or banned.

---

## 10. DevOps & CI/CD

### 10.1 Environments
- **Local:** Docker Compose stack (gateway, auth, progression, inventory, Redis, Postgres, Kafka).
- **Dev:** Shared cluster, auto-deploy on merge to `develop` branch.
- **Staging:** Mirror of prod scale; used for load tests, release candidates.
- **Prod:** Multi-region (NA, EU, APAC) with active-active for meta services, region-locked match servers.

### 10.2 Pipelines
- **Client Pipeline:**
  1. Lint (Roslyn analyzers, StyleCop).
  2. Unit tests (EditMode & PlayMode).
  3. Build Android (AAB) & iOS (IPA) artifacts.
  4. Upload to Firebase App Distribution/TestFlight.
  5. Tag builds with semantic version (Major.Minor.Patch-season).
- **Server Pipeline:**
  1. Lint (golangci-lint).
  2. Unit tests.
  3. Integration tests via docker-compose.
  4. Build Docker images, push to registry.
  5. Deploy to dev via ArgoCD; manual approval for staging/prod.

### 10.3 Observability
- Dashboards: latency per endpoint, matchmaking queue depth, server tick drift, crash rate per device.
- Alerts: queue wait >30s, matchmaking failure rate >2%, server CPU >85%, payment verification errors >1%.
- Post-incident process: RCA within 24 hours, action items tracked in Jira.

### 10.4 Release Management
- Feature flags gate major features; enable per cohort.
- Soft launch in 2 geos (Canada, Australia). Monitor metrics for 4 weeks; iterate.
- Rolling updates for servers; zero-downtime via canary deployments.

---

## 11. QA Strategy

### 11.1 Testing Types
- **Unit Tests:** Physics calculations, matchmaking logic, mission rewards.
- **Integration Tests:** API flows (login → match → reward), store purchase.
- **End-to-End (E2E):** Automated Appium tests for critical flows.
- **Playtests:** Daily internal multiplayer sessions, weekly community testers.
- **Performance:** Profile CPU/GPU usage on mid-tier Android (Snapdragon 730) and iPhone 8.
- **Compatibility:** Matrix of devices (iOS 14+, Android 8+), network conditions (50ms → 250ms, packet loss 2%).

### 11.2 Bug Lifecycle
- Bugs tracked in Jira; severity levels (Blocker, Critical, Major, Minor, Trivial).
- SLA: Blocker fix 24h, Critical 48h, Major 5 days.
- Regression suite executed before each release candidate.

### 11.3 Automation
- Use Unity Test Runner for PlayMode tests; integrate with CI.
- Server integration tests using Go’s testing + TestContainers for ephemeral dependencies.
- Load tests scheduled weekly; results archived.

---

## 12. Analytics & Telemetry Detail

### 12.1 Event Taxonomy
- **Lifecycle:** `app_launch`, `session_start`, `session_end`, `crash`, `resume`.
- **Gameplay:** `mode_selected`, `match_started`, `match_finished`, `powerup_used`, `obstacle_hit`.
- **Progression:** `xp_awarded`, `level_up`, `mission_completed`, `battlepass_tier_claimed`.
- **Economy:** `currency_balance_changed`, `offer_viewed`, `purchase_initiated`, `purchase_completed`.
- **Social:** `friend_added`, `club_joined`, `chat_sent`, `report_submitted`.

### 12.2 Data Pipeline
1. Client batches events (max 20, 60s interval) → send to Analytics Service.
2. Analytics service validates schema (JSON schema), attaches metadata (device, app version).
3. Events forwarded to Kafka topic per category.
4. Kafka consumers push to BigQuery (via Dataflow) and to real-time dashboards (via ClickHouse or Elasticsearch).
5. Aggregate jobs compute KPIs; scheduled via Airflow.

### 12.3 Privacy & Retention
- Data minimization: store hashed identifiers.
- Retention policy: raw events 12 months, aggregated metrics indefinite.
- Provide GDPR export/delete endpoints accessible via in-app settings.

---

## 13. Monetization & Economy Balancing

### 13.1 Pricing
- Battle Pass Premium: $9.99 per season.
- Golden Eggs packs: $0.99 (100) → $99.99 (12,000 + bonuses).
- Cosmetic bundles: $4.99 – $19.99.
- Feather conversion via gameplay; optional watch-ad (AdMob) for small amounts.

### 13.2 Reward Curves
- XP per match: base 100 + bonus for distance (0.5 XP per meter) + victory bonus 50.
- Level XP curve: `XP_required = 500 * level^1.2`.
- Battle pass XP: missions give 1000 (daily) / 3000 (weekly); tier requires 5000 XP.

### 13.3 Economy Safeguards
- Cap daily Feather earnings at 5000 to prevent farming.
- Anti-cheat hooks for abnormal currency gains.
- Server-authoritative grant/consume transactions with idempotent operation IDs.

---

## 14. Team & Process

### 14.1 Team Roles
- **Product Lead:** roadmap, prioritization.
- **Game Designer:** balance, mission design.
- **Client Engineers (6):** gameplay, UI, platform integrations.
- **Server Engineers (5):** matchmaking, services, infrastructure.
- **LiveOps Engineer (1):** console, tooling.
- **QA (4):** automation + manual.
- **Art Team (4):** character, environment, UI.
- **Audio (1),** **Data Analyst (1),** **Community Manager (1).**

### 14.2 Development Process
- Agile Scrum (2-week sprints), quarterly OKRs.
- Sprint rituals: planning, daily standups, backlog grooming, retro.
- Jira for tracking; Confluence for documentation.
- Code review required (2 approvals). Branch strategy: trunk-based with feature flags.

### 14.3 Risk Mitigation
- **Latency Issues:** implement regional servers, prediction, fallback to async races.
- **Cheating:** authoritative server, behavior analytics, hardware ban.
- **Content Pipeline:** maintain buffer of 2 seasons ahead.
- **Monetization Compliance:** align with platform policies, localized pricing.

---

## 15. Appendices

### Appendix A: Physics Constants (Initial)
```
gravity = -9.8f
flapImpulse = 4.5f
maxFallSpeed = -12f
horizontalSpeed = 3.0f
pipeSpacing = 5.0f
pipeGapBase = 2.2f
pipeGapMin = 1.4f
suddenDeathSpeed = 4.5f
suddenDeathGap = 1.0f
```

### Appendix B: Matchmaking Parameters
```
baseMMR = 1200
mmrTierThresholds = {
  bronze: 0-999,
  silver: 1000-1299,
  gold: 1300-1599,
  platinum: 1600-1899,
  diamond: 1900-2199,
  master: 2200+
}
queueWeights = {skill: 0.6, latency: 0.3, waitTime: 0.1}
regionRouting = {NA: us-central1, EU: eu-west1, APAC: asia-southeast1}
```

### Appendix C: Mission Examples
```
Daily-001: Fly 1000 meters total (reward: 500 XP, 200 Feathers)
Daily-002: Win 3 casual matches (reward: 800 XP)
Weekly-001: Reach sudden death 10 times (reward: 3000 XP, 1 Epic Trail)
Seasonal-Event-001: Collect 50 Golden Eggs from matches (reward: Legendary Skin)
```

### Appendix D: LiveOps Console Features
- Dashboard: Active players, queue times, revenue.
- Content Editor: Drag-and-drop schedule of events, offers.
- Player Lookup: Search by ID, view inventory, grant items.
- Messaging: Compose push notifications, segment by region/activity.
- Experiment Manager: create experiments, assign cohorts, monitor KPIs.

### Appendix E: Compliance Checklist
- COPPA self-assessment completed.
- GDPR DPO assigned, maintain records of processing.
- Platform achievements submitted (Game Center, Google Play).
- Localization QA per language.
- Security penetration tests pre-launch.

---

**End of Document**
