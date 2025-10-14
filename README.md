# FloppyDuck Arena

Production-ready foundation for the FloppyDuck Arena mobile experience. Includes:

- **TypeScript real-time backend** (`server/`) with Express + Socket.IO matchmaking, game sessions, and progression persisted to SQLite
- **React-based mobile-ready client** (`client/`) with routed views, persistent auth/session state, and Canvas-powered gameplay 
  loops for solo and multiplayer play

## Getting Started

### Backend

```bash
cd server
npm install
npm run dev
```

The server listens on `http://localhost:4000` by default and stores data in `data/floppyduck.db`. Override the location with `DB_PATH=/custom/path.db` when launching the server. Set a strong `JWT_SECRET` environment variable to sign authentication tokens before running in any shared environment.

### Client

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` and log in using the guest flow.

Set `VITE_API_BASE` and `VITE_SOCKET_URL` in a `.env.local` to point to a remote server if desired.

## Scripts

- `npm run build` — compile TypeScript
- `npm run dev` — run development server (backend) or hot reload (client)

## Project Structure

```
server/               # API + real-time socket server
  src/
    routes/           # REST API routes
    services/         # Matchmaking, progression, game sessions
    utils/            # Shared helpers (seeded RNG)
client/               # React web/mobile client
  src/
    api/              # REST helpers
    app/              # Routed screens, layouts, auth guard
    components/       # Canvas renderer and shared UI widgets
    game/             # Game loop hooks & physics
    hooks/            # Client-side networking hooks (sockets)
    state/            # Zustand store w/ persistence & theming
    styles.css        # Design system tokens + responsive layout
```

## Notes

- Multiplayer matches run on a deterministic server-side simulation.
- Solo scores sync to the backend for progression.
- Theme selection is persisted to the account profile via the API.
- Accounts now require Bearer tokens issued by the `/api/auth/*` endpoints. Guest profiles can be upgraded in-place to email/password accounts without losing progression.
