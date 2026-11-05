# TanStack AI as an optional extension

The core app must stay useful without AI. When Phase 6 starts, AI arrives through TanStack AI
(`@tanstack/ai`, 1.2.0 at audit time) behind TanStack Start: React UI to TanStack AI React to Start
routes to TanStack AI to provider adapters. AI UI lives in `src/features/ai`, provider config in
`src/core`, streaming routes in `src/routes/api`, persistence in `convex/`.

**Considered Options**

- **AI as core dependency**: Rejected. Discovery, sharing, groups, and planning work without any
  model.
- **Direct client-to-provider calls**: Rejected. Model keys stay server side; the browser never
  holds them.
- **Unrestricted tool access**: Rejected. Tools are typed, inputs validated, Convex enforces
  authorization, consequential actions require approval, and usage limits apply.

**Consequences**

- Install and pin `@tanstack/ai` at Phase 6 start; re-check provider adapter docs then.
- Persist conversations in Convex; test tool authorization alongside every new tool.
- AI failures degrade to the non-AI product, never to a broken app.
