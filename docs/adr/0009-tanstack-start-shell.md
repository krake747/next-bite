# TanStack Start shell with SSR off

The app ran as a client-only SPA booted from `src/index.tsx`. We adopted TanStack Start
(`@tanstack/react-start` 1.169.4, paired with router 1.170.46) to get a server entry point on the
Worker, keeping behavior identical for now: no server functions, no server preloading, and Convex
subscriptions hydrate client-side exactly as before.

**Considered Options**

- **Stay on plain TanStack Router**: Rejected because every Worker request then serves static files
  only; there is no seam for server rendering, server functions, or per-request work.
- **Full SSR immediately**: Rejected because three render paths needed surgery first (document
  entry, theme init during render, a module-singleton query client shared across requests). The
  shell lands the framework without changing what users see.

**Consequences**

- `src/index.tsx` and `index.html` are gone; Start owns the client entry and renders the document
  from the root route (`<html>` shell with `HeadContent` and `Scripts`).
- `src/router.tsx` builds the router per request with a per-request `QueryClient` in router context;
  sharing one client across requests would leak cached data between users.
- `ThemeProvider` renders a default theme on the server and corrects from `localStorage` and
  `matchMedia` on mount (a cookie-based fix removes the flash later).
- `cloudflare.config.ts` points its entrypoint at `src/server.ts`, a minimal Start handler. Enabling
  SSR per route, adding server functions, and preloading Convex queries are follow-ups, each with
  its own ADR.
