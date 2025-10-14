# Frontend Status & Delivery Plan

## 1. Current State Snapshot
- **Platform & stack**: Single-page React 18 + Vite prototype rendered via Canvas, targeting web viewport (max-width 420px) rather than a packaged mobile client. The bundle relies on a minimal dependency set (React, React DOM, Socket.IO client, Zustand).
- **Authentication shell**: Provides guest registration, email/password registration, login, and guest upgrade flows directly within the landing view, writing session data into a transient Zustand store without persistence. 
- **Gameplay views**: Renders solo and multiplayer boards inline via a shared `GameRenderer` Canvas component, with simple status text, queue toggles, and theme selector buttons reusing unlocked cosmetic metadata. 
- **Styling & layout**: Uses a handcrafted glassmorphic style sheet optimized for portrait layout on web; no adaptive layout, navigation, or modular component system beyond a few utility classes. 
- **State management & networking**: Uses ad hoc hooks for solo and multiplayer loops, manual fetch wrappers for REST calls, and a bare Socket.IO connection initiated once a JWT is present. No offline cache, reconnection logic, or background handling exists.

## 2. Gap Analysis
### 2.1 Platform & Architecture
- No native shell (React Native/Flutter) or Capacitor wrapper to deliver installable mobile apps.
- Game loop, UI, and networking logic live in a monolithic `App.tsx`, preventing modular navigation, code reuse, or testing.
- Zustand store lacks persistence, hydration, and cross-tab synchronization, causing session loss on refresh.
- No routing, feature flags, or remote config to control surfaces required for LiveOps seasons.

### 2.2 Gameplay & Meta UX
- Solo and multiplayer experiences have minimal HUDs; lacking countdowns, respawn flows, or match summaries.
- Queue UX is linear with a single button; no ranked mode toggle, friend challenges, or status feedback.
- Theme selector is a simple list; no preview carousel, locked state indicators, or store integration.
- Absent social features: friends, clubs, leaderboards, and notifications.

### 2.3 Visual & Audio Fidelity
- Canvas renderer uses placeholder shapes and flat colors; no sprite atlas, animation, parallax, or particle effects.
- No responsive layout system, typography scale, or component library to support additional screens.
- Audio (music, SFX), haptics, and accessibility affordances (colorblind modes, high contrast) are missing.

### 2.4 Productization & Compliance
- No analytics instrumentation (events, funnels, error logging) or feature flag integration.
- No localization or i18n scaffolding for multi-language support.
- Privacy, parental gates, content ratings, and terms-of-service surfaces absent.
- Store purchase hooks, monetization views, and reward claim flows not represented client-side.

### 2.5 Quality & Operations
- Lacks automated testing (unit, component, E2E) and linting/formatting guardrails.
- Build pipeline targets Vite web preview only; no CI for bundle size, accessibility scans, or regression capture.
- No offline error screens, network retry logic, or graceful degradation for low bandwidth/latency spikes.

## 3. Delivery Plan
### Phase A — Foundation & Architecture (2–3 sprints)
1. **Client architecture split**: Decompose current `App.tsx` into routed views (`Auth`, `Lobby`, `Solo`, `Multiplayer`, `Profile`, `Store`) with React Router (or Expo Router) and shared layout primitives.
2. **Platform decision**: Choose delivery path—recommended Expo/React Native for shared JS game logic. Extract pure game simulation modules for reuse between web and native renderers. Establish Capacitor or Expo builds with Fastlane automation.
3. **State & session layer**: Introduce Redux Toolkit or Zustand slices with persistence (SecureStore/AsyncStorage) and hydration flows; add refresh token handling and reconnection/resume logic for sockets.
4. **Design system**: Implement a tokenized design system (colors, typography, spacing) with component library (buttons, cards, tabs, modals). Integrate responsive layout primitives to support phones and tablets.
5. **Networking baseline**: Wrap REST/Sockets with error classification, retries, and cancellation. Add global toasts for feedback and connectivity banners.

### Phase B — Core Experience & Meta (3–4 sprints)
1. **Solo & multiplayer polish**: Add pre-match countdowns, pause/resume, end-of-run summaries, rewards display, and opponent status overlays. Implement ranked vs. casual toggles, rematch prompts, and spectator-ready replay hooks.
2. **Progression surfaces**: Build profile overview, battle pass page, daily/weekly objectives, and inventory management views consuming backend endpoints.
3. **Social layer**: Implement friends list, invites, club hub, and leaderboards with presence indicators.
4. **Theme & store UX**: Create theme gallery with previews, rarity indicators, unlock requirements, and store purchase modals tied to backend offers.

### Phase C — Fidelity, Accessibility, & Content (3 sprints)
1. **Art & animation integration**: Replace placeholder Canvas with sprite-based renderer, parallax backgrounds, particle FX, and theming support. Partner with art/audio teams for asset pipeline and runtime loaders.
2. **Audio/haptics**: Add adaptive music loops, SFX cues, and platform-specific haptic feedback toggles.
3. **Accessibility & localization**: Provide customizable controls, colorblind palettes, adjustable text size, subtitles for audio cues, and full localization pipeline (string extraction, i18n libs, language selector).
4. **Device compliance**: Optimize performance (60 FPS target), memory management, battery usage, and notch-safe layouts. Validate on iOS/Android device matrix.

### Phase D — Operations & Quality (2–3 sprints)
1. **Instrumentation**: Integrate analytics (Amplitude/Firebase), crash reporting, and feature flags. Define event taxonomy for gameplay and economy flows.
2. **Testing & QA**: Add Jest/unit coverage for logic, React Testing Library for UI, Detox/Cypress for E2E. Configure visual regression snapshots and accessibility audits.
3. **Distribution pipeline**: Automate Expo/Capacitor builds, App Store/TestFlight, and Play Store tracks with Fastlane + GitHub Actions. Implement over-the-air updates where allowed.
4. **Compliance surfaces**: Implement privacy policy modals, age verification, parental consent, terms acceptance, and support center access.
5. **LiveOps tooling hooks**: Surface remote-configurable banners, event tiles, and message of the day fed by backend LiveOps console.

## 4. Dependencies & Enablers
- **Backend alignment**: Requires API coverage for progression, social, store, and analytics endpoints; coordinate schema and feature releases.
- **Design & asset pipeline**: Need finalized style guide, UI kit, and asset delivery process (Lottie, spritesheets, audio). Establish versioned CDN integration.
- **Team structure**: Dedicated frontend pod (React Native engineer, UI/UX designer, technical artist, QA) plus shared platform engineer for CI/DevOps.
- **Documentation**: Maintain living frontend architecture guide, component catalog, and coding standards to onboard contributors quickly.

## 5. Immediate Next Steps (Current Sprint)
1. Audit existing React code to isolate reusable logic (game physics, API clients) and define module boundaries for extraction into shared packages.
2. Spike Expo project setup, verifying Canvas/webgl rendering approach (e.g., `react-native-skia`) can host current game loop at target framerate.
3. Draft UI/UX wireframes for modular navigation and progression surfaces to unblock component library implementation.

## Status Update — 2024-06-03
- Completed the architecture split: the client now uses React Router with guarded routes, modular layouts, and persisted session state backed by the new Zustand store.
- Implemented Lobby, Solo, Multiplayer, Profile, and Store views with a design-token-driven style system, responsive layout, and socket lifecycle management.
- Added gameplay polish including seeded solo runs with automatic score sync, multiplayer queue UX, and cosmetic loadout management, unblocking subsequent LiveOps and monetization surfaces.
