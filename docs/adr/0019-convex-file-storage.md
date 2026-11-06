# Convex File Storage for application images

Restaurant photos, avatars, group images, and meal photos use Convex File Storage. Flow: the client
uploads the raw blob to the authenticated `POST /upload` HTTP endpoint, the server stores it and
records server-observed metadata (owner, MIME type, byte size) in the `uploads` table, and callers
attach storage IDs by reference. Display URLs resolve at render time. Dimension hints (width,
height) are client-reported and untrusted; every trust decision (ownership, association, MIME type,
byte size) comes from the server record or profile, never from client claims.

**Considered Options**

- **R2 now**: Rejected. No current need for access-controlled delivery, transforms, or independent
  storage scaling. Revisit when one of those becomes concrete.
- **Raw URLs as authorization**: Rejected. Convex file URLs are bearer-accessible; application
  permission checks stay in backend functions.
- **Signed upload URLs**: Deferred. The authenticated HTTP-blob path is intentional for now: the
  endpoint enforces auth, content type, and size before storing, and the upload record is written by
  a server mutation reading the `_storage` system table. Revisit signed URLs if uploads move off the
  Convex HTTP path or need direct-to-storage bandwidth.

**CORS**

The upload endpoint is browser-facing cross-origin, so it reflects only trusted origins. Set the
`APP_ORIGINS` Convex env var to a comma-separated allowlist of app origins (web and mobile must both
be listed if they call the endpoint from a browser context). Loopback origins (`localhost`,
`127.0.0.1`, `::1`) are always trusted so local development works with zero config. Every other
browser origin gets no CORS headers and the browser blocks the response. Non-browser callers send no
`Origin` and are unaffected. Deploying without `APP_ORIGINS` set breaks browser uploads in
production: the failure is loud (no ACAO header) rather than silent.

**Consequences**

- Ownership and associations live in Convex docs, not in URL possession.
- Upload, validation, and cleanup paths need integration tests before production.
- Attribution metadata (owner, display name, MIME type, byte size) is denormalized onto image
  entries at attach time from the server record; client-sent identity fields are overwritten.
- Friend visit memories attach to the viewed restaurant through the same ownership checks as owner
  uploads, and are visible only where the restaurant itself is visible.
