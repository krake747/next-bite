# Nextbite technical foundation

Target architecture for the social food application. This file points at owners; it restates no
values owned elsewhere.

## Stack

Owners: `package.json` for versions, `convex/schema.ts` for data, `src/core/env.ts` for env names,
`cloudflare.config.ts` for deploy target, `vite.config.ts` for toolchain and test tiers.

| Layer         | Technology                                         | Owner                                                 |
| ------------- | -------------------------------------------------- | ----------------------------------------------------- |
| Language      | TypeScript                                         | `tsconfig.json`                                       |
| UI framework  | React 19                                           | `package.json`                                        |
| App framework | TanStack Start                                     | `src/server.ts`, `src/router.tsx`                     |
| Routing       | TanStack Router                                    | `src/routes/`, `src/routeTree.gen.ts`                 |
| Client data   | TanStack Query today, TanStack DB collections next | ADR-0003, ADR-0017                                    |
| Backend       | Convex                                             | `convex/`, `convex/schema.ts`                         |
| Auth          | Better Auth plus Convex integration                | `convex/auth.ts`, `src/core/auth-client.ts`, ADR-0018 |
| File storage  | Convex File Storage                                | ADR-0019                                              |
| Email         | Mailgun EU over HTTPS                              | ADR-0020                                              |
| Hosting       | Cloudflare Workers                                 | `cloudflare.config.ts`, ADR-0008                      |
| AI            | TanStack AI as extension only                      | ADR-0021                                              |
| Styling       | Tailwind CSS v4                                    | `src/index.css`                                       |
| Components    | Base UI plus CVA                                   | ADR-0002, `src/ui/`                                   |
| Icons         | Lucide                                             | `package.json`                                        |

## Repository layers

Owner: `.fallowrc.json` for zones, `AGENTS.md` for the layer summary.

- `src/core`: app infrastructure, shared services, validation. No product UI.
- `src/features`: product behavior, one directory per domain.
- `src/pattern`: reusable composed UI. No product business logic.
- `src/routes`: route definitions only. Thin; compose features.
- `src/ui`: generic design-system primitives. No Convex or auth.
- `convex/`: data, logic, authorization. Root-level modules per domain.

## Rendering

Owner: `src/routes/`, ADR-0010.

- Public routes (`/`, `/restaurants/$id`, `/invite/$token`): SSR with metadata.
- Authenticated social routes (`/feed`, `/groups/$id`, `/friends`, `/settings`): client side with
  Convex subscriptions.
- Server functions only for server boundaries: email send, external APIs, AI execution, Cloudflare
  bindings.
- HTTP routes only for auth, AI streaming, webhooks, provider callbacks.

## Data flow

Owner: `convex/`, ADR-0017.

1. Convex query defines the authorized scope.
2. TanStack DB collection subscribes through the Convex adapter where local composition pays off.
3. Direct Convex queries where a collection adds no value.
4. Writes go through Convex mutations. DB optimistic handlers never replace backend authorization.

Convex is the source of truth. TanStack DB is a reactive view, not a second database.

## Authentication

Owner: `convex/auth.ts`, `src/core/auth-client.ts`, ADR-0018.

- Better Auth owns identity and sessions. Convex owns profiles and authorization.
- Methods: Google OAuth, then email OTP. Invitation-first flow preserves invite context across auth
  and accepts idempotently.
- Never trust client-provided user IDs. Derive the user from authenticated context in every backend
  function.

## Storage, email, AI

- Storage: Convex File Storage with metadata in Convex docs. Bearer URLs are not authorization. See
  ADR-0019.
- Email: Mailgun EU over HTTPS from server code only. Provider interface in `src/core`. See
  ADR-0020.
- AI: TanStack AI behind Start routes, typed tools, Convex-enforced authorization, approval for
  consequential actions. Core app works without AI. See ADR-0021.

## Testing

Owner: `vite.config.ts` projects, `docs/agents/testing.md`.

| Level       | Runner                      | Purpose             |
| ----------- | --------------------------- | ------------------- |
| Unit        | Vitest                      | Pure logic          |
| Component   | Testing Library             | UI behavior         |
| Browser     | Vitest Browser Mode         | Browser behavior    |
| Integration | Vitest plus Convex test env | Backend permissions |
| E2E         | Playwright                  | Critical journeys   |

Critical journeys: sign-in (Google, OTP), invite accept, onboarding, add and share restaurant, join
group, react, plan meal, upload photo, unauthorized access denial.

## Dependency audit, November 2026

Present in `package.json`: React 19, TanStack Start 1.169.4, Router 1.170.46, React Query 5.105.3,
Convex 1.49.0, Better Auth 1.7.17, `@convex-dev/better-auth` 0.13.0, Tailwind 4.3.4, Base UI 1.9.0,
CVA beta 12, Lucide, Valibot.

Missing for the target, install when its phase starts (no install in this change):

| Package                                                                | Latest checked                   | Needed for                |
| ---------------------------------------------------------------------- | -------------------------------- | ------------------------- |
| `@tanstack/db`, `@tanstack/react-db`, `@tanstack/convex-db-collection` | 1.0.0-rc.1.3 (release candidate) | Phase 3 collections       |
| `@tanstack/ai`                                                         | 1.2.0                            | Phase 6 AI extension      |
| `playwright` plus `e2e/` config                                        | 1.65.0                           | Phase 7 critical journeys |

No Mailgun SDK needed: call the HTTPS API from server code per ADR-0020.

Note: TanStack DB is still a release candidate. Pin exact versions when Phase 3 starts and re-check
the adapter docs before adopting.

## Roadmap

Phase order: Foundation, Authentication, Data architecture, File storage, Core product, AI
extension, Production readiness. Details live in the ticket tracker, not here.
