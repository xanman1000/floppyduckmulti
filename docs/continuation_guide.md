# FloppyDuck Arena Continuation Guide

This guide orients new contributors to the current state of FloppyDuck Arena and
outlines the workstreams required to take the project from its existing web
prototype to a production-grade, publicly releasable mobile game.

## 1. Project Snapshot

- **Current deliverables**: TypeScript backend with Socket.IO matchmaking,
  SQLite persistence, JWT authentication, and a React/Vite client featuring
  routed views for auth, lobby, solo, multiplayer, profile, and store flows.
- **Recent progress**: Frontend refactor into routed application shell with
  persistent session store, multiplayer HUD updates, and cosmetic loadout
  editing; server-side account system with hashed credentials and JWT-based
  REST/socket protection; migration from in-memory storage to SQLite with schema
  bootstrapping.
- **Active repositories**: `server/` (Express + Socket.IO), `client/`
  (React + Zustand), and supporting documentation in `docs/`.

## 2. Environment Setup

1. **Backend**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Configure `JWT_SECRET` and optionally `DB_PATH` before running shared builds.
2. **Client**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Use `.env.local` to point `VITE_API_BASE` and `VITE_SOCKET_URL` to remote
   services when testing against staging environments.

## 3. Execution Framework

1. **Adopt sprint slices**: Follow the existing pre-launch plan and track
   progress in `docs/release_execution_tasks.md` and `docs/release_progress.md`.
2. **Gate by readiness tiers**: Classify tasks as P0 (launch critical), P1
   (launch stretch), P2 (post-launch) per the completion plan to manage scope.
3. **Document decisions**: Record architecture, gameplay, and economy decisions
   in a shared knowledge base (Confluence/Notion) for continuity.

## 4. Core Workstreams & Next Steps

### 4.1 Backend Platform

- **Database & services**
  - Move from SQLite to managed PostgreSQL/CockroachDB with migrations (Prisma or
    TypeORM).
  - Extract matchmaking into stateless workers backed by Redis for queue state.
  - Stand up progression services with audit logs and fraud detection.
- **Infrastructure**
  - Add structured logging, tracing, and alerting (Grafana/Datadog/Sentry).
  - Containerize services and define CI/CD pipelines (GitHub Actions + Docker +
    Terraform/Kubernetes).
  - Implement secrets management, configuration, and backup policies.
- **LiveOps tooling**
  - Build admin portal for season config, offers, matchmaking tuning, and
    moderation workflows.

### 4.2 Client Platform

- **Platform transition**
  - Decide on Expo/React Native (recommended) or alternative engine for mobile
    deployment; extract shared game logic packages for reuse.
  - Implement responsive design system with component library and adaptive
    layouts.
- **Gameplay polish**
  - Add pre/post match flows, ranked/casual toggles, rematch prompts, and
    spectator hooks.
  - Build progression surfaces (battle pass, quests, inventory) and social
    features (friends, clubs, leaderboards, chat).
- **Fidelity & compliance**
  - Integrate production art/audio, animation, haptics, localization, and
    accessibility options.
  - Instrument analytics, crash reporting, feature flags, privacy/parental gates
    and offline/error handling.
  - Automate mobile builds (Fastlane/TestFlight/Play Console) with regression
    testing and accessibility audits.

### 4.3 Content & LiveOps

- Produce art style guide, sprite atlases, UI kits, VFX, and audio suite.
- Develop theming system enabling preview/equip flows tied to backend offers.
- Draft season roadmaps, daily/weekly quest content, and monetization plans.
- Prepare marketing copy, store listings, trailers, and localization packages.

### 4.4 Data & Analytics

- Define analytics taxonomy and implement client/server logging with schema
  validation.
- Integrate experimentation platform (remote config, A/B testing dashboards).
- Establish data retention, privacy compliance, and governance policies.

### 4.5 Quality, Security, & Operations

- Author automated tests (unit, integration, E2E) across services and client.
- Introduce security reviews, threat modeling, penetration tests, and dependency
  scanning.
- Build on-call rotation, incident response runbooks, and disaster recovery
  drills.

## 5. 90-Day Execution Roadmap

| Phase | Weeks | Focus | Key Outcomes |
| --- | --- | --- | --- |
| **Stabilize** | 1-4 | Database migration, auth hardening, observability baseline, mobile platform decision | Managed DB online, structured logging, Expo/React Native shell running solo/multiplayer loops |
| **Expand** | 5-8 | Matchmaking/service scaling, progression & social surfaces, asset pipeline kickoff | Redis-backed queues, battle pass UI, art/audio production schedule |
| **Polish** | 9-12 | Content integration, analytics, QA automation, launch readiness | Production assets in client, analytics events flowing, CI/CD gating builds |

## 6. Team & Collaboration

- Staff pods: Backend platform, client/mobile, content/LiveOps, data/infra, QA.
- Hold weekly cross-pod syncs to align releases and dependencies.
- Maintain shared roadmap dashboards and burndown charts to track launch KPIs.

## 7. Immediate Actions Checklist

1. Stand up shared documentation/work tracking hub and migrate existing plans.
2. Create technical spikes for managed DB migration and mobile platform
   selection.
3. Draft asset production briefs and recruit art/audio partners.
4. Define analytics schema and choose instrumentation stack.
5. Establish CI skeleton (lint, unit tests) for both `client/` and `server/`.

Following this guide keeps contributors aligned on the remaining scope, execution
cadence, and standards required to ship FloppyDuck Arena as a high-quality,
multiplayer mobile experience.
