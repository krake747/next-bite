# Convex File Storage for application images

Restaurant photos, avatars, group images, and meal photos use Convex File Storage. Flow: client
requests an upload URL, uploads directly, stores the storage ID plus metadata (owner, type, size,
dimensions, associations) in Convex docs, and resolves display URLs at render time. Validation of
type and size and deletion with cleanup are part of Phase 4.

**Considered Options**

- **R2 now**: Rejected. No current need for access-controlled delivery, transforms, or independent
  storage scaling. Revisit when one of those becomes concrete.
- **Raw URLs as authorization**: Rejected. Convex file URLs are bearer-accessible; application
  permission checks stay in backend functions.

**Consequences**

- Ownership and associations live in Convex docs, not in URL possession.
- Upload, validation, and cleanup paths need integration tests before production.
