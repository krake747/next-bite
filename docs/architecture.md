# Architecture

How the app fits together today. Layers and import rules live in `.fallowrc.json`, summarized in
`AGENTS.md`; stack and versions in `package.json`; data in the `convex/model/*/schema.ts` fragments
that `convex/schema.ts` composes; env names in `src/core/env.ts`.

## Owners

| Concern     | Choice                                              | Owner                                                       |
| ----------- | --------------------------------------------------- | ----------------------------------------------------------- |
| Client data | TanStack Query plus TanStack DB collections         | ADR-0001, ADR-0002, `src/api/db/`                           |
| Backend     | Convex                                              | `convex/`                                                   |
| Auth        | Better Auth with the Convex integration             | `convex/auth.ts`, `src/api/auth.sdk.ts`, ADR-0005, ADR-0027 |
| Files       | Convex File Storage                                 | ADR-0015                                                    |
| Email       | Mailgun EU over HTTPS                               | ADR-0016                                                    |
| Hosting     | Cloudflare Worker running the TanStack Start server | `cloudflare.config.ts`, `src/server.ts`, ADR-0026           |
| Components  | Base UI plus CVA                                    | ADR-0018, `src/ui/`                                         |
| AI          | TanStack AI as an optional extension (not built)    | ADR-0017                                                    |

## Rendering

- Routes render on the server. The server resolves the session only to run route guards; private
  data loads on the client through Convex subscriptions, so server HTML never carries a private
  record. A private detail page server-renders its loading shell.
- Server and first client render must agree on auth state. Never gate `AuthProvider` children behind
  client-only placeholders: it breaks hydration on every page.
- Server functions only for server boundaries such as the session, email, external APIs, and AI.
  HTTP routes only for auth, AI streaming, and webhooks. Uploads go to Convex upload URLs.
- `e2e/smoke.spec.ts` checks that the built Worker paints the landing page.

## Data flow

A Convex query defines the authorized scope. A TanStack DB collection subscribes to it where local
composition pays off; otherwise read the query directly. Writes go through Convex mutations, and
optimistic handlers never replace backend authorization. Convex is the source of truth; TanStack DB
is a reactive view, not a second database.

## Auth

- Better Auth owns identity and sessions; Convex owns profiles and authorization.
- Password plus emailed one-time code where mail is configured (ADR-0027). The invitation flow keeps
  invite context across auth and accepts idempotently.
- Derive the user from authenticated context in every backend function; never trust client user IDs.
  Only a ready session authorizes (ADR-0025).
- `convex/identity.ts` and `convex/social.ts` are the public API for profiles and friendships. A
  friendship is one row per direction, and accepting writes both rows in one mutation.
- `convex/groups.ts` and `convex/invites.ts` are the public API for groups and invites. Revoking an
  invite deletes its row, and invite expiry is checked at read time.

## Storage, email, AI

- Storage: metadata lives in Convex documents. Bearer URLs are not authorization.
- Email: sent from server code only.
- AI: behind server routes with typed tools, backend authorization, and approval for consequential
  actions. The app works without it.
