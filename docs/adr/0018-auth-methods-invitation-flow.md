# Better Auth Google OAuth and email OTP with invitation-first flow

Current state is email and password through Better Auth plus the Convex integration
(`convex/auth.ts`, `src/core/auth-client.ts`). The target adds Google OAuth first, then email OTP,
with an invitation-first flow: invite context survives auth redirects, missing profile fields are
collected after auth, and acceptance is idempotent.

**Considered Options**

- **Password only**: Rejected because invites convert better with OAuth and OTP; passwords stay as
  fallback, not the primary path.
- **Client-resolved identity**: Rejected. A Better Auth session never implies Convex auth readiness,
  and backend functions derive the user from authenticated context, never from client-provided IDs.
- **Invite token in client state only**: Rejected because redirects drop it. Persist the pending
  invite across the auth round trip and validate it server side on accept.

**Consequences**

- One centrally configured Better Auth client; official Convex integration only.
- Trusted origins and redirects validated; test SSR, session refresh, sign-in, and sign-out.
- Invitation acceptance lives in a single Convex mutation so retries are safe.
