# Convex Migrations

This project uses Convex for the backend. Schema changes require migrations.

## Pipeline

Backend deploys and migrations run through `.github/workflows/convex.yml` (manual dispatch). It
gates on `check:full`, deploys functions and schema with the environment's `CONVEX_DEPLOY_TOKEN`
deploy key, then runs the migration list in order. Environments map to GitHub Environments (`dev`,
`prod`) holding per-deployment tokens from the Convex dashboard. Prod should carry a
required-reviewer rule on its environment. Dry run defaults to true and only typechecks. Local
development still uses `pnpm convex:dev`; `pnpm convex:deploy` stays for manual pushes.

## Changing Schema with Data Migration

When changing a field type, existing data won't match the new schema. Process:

1. **Relax the schema to accept both shapes** (temporary). Two gotchas apply:
   - Reads validate as well as writes, so the relaxed schema must accept what is currently stored,
     not just what you are about to write.
   - `v.object` rejects unknown fields, so declaring the new fields optional is not enough: every
     legacy key still present in stored documents must also be declared optional for the interim.
2. **Deploy** `pnpm convex dev` (push now succeeds against the relaxed schema).
3. **Run a reporting backfill.** The migration should read every affected document, rewrite the ones
   that need it with `ctx.db.replace` (patch never removes legacy keys), and return
   `{ total, migrated, needsOwner }` so the run is verifiable. Re-run the command until `migrated`
   covers everything outstanding.
4. **Re-tighten the schema** (drop the legacy block, restore required fields) and deploy again.
   Gates stay red for `lint`/`lint:ts` while the schema is relaxed; that is expected and confined to
   the interim commits.

Concrete example of the temporary union step:

```typescript
// convex/schema.ts
images: v.optional(
  v.array(
    v.union(v.string(), v.object({ url: v.string(), storageId: v.string() })),
  ),
),
```

Example migration body (no casts; narrows at runtime instead):

```typescript
import { internalMutation } from "./_generated/server"

export const convertImagesToObjects = internalMutation(async (ctx) => {
  const restaurants = await ctx.db.query("restaurants").collect()
  let converted = 0

  for (const restaurant of restaurants) {
    if (!Array.isArray(restaurant.images) || typeof restaurant.images[0] !== "string") {
      continue
    }

    const newImages = restaurant.images
      .filter((url): url is string => typeof url === "string" && url !== "")
      .map((url) => ({
        url,
        storageId: url.match(/\/storage\/([a-f0-9-]+)$/)?.[1] ?? "",
      }))

    await ctx.db.patch(restaurant._id, { images: newImages })
    converted += 1
  }

  return { total: restaurants.length, converted }
})
```

Run it with:

```bash
pnpm convex run migrate:convertImagesToObjects
```

## Available Migrations

```bash
# Find orphaned storage files
pnpm convex run migrate:cleanupOrphanedStorage
```

The legacy string-image migration was removed with the tenant backend reshape; fresh data starts in
the new shape.

## Upload ownership quarantine

Uploads created before owner records existed have blobs in storage with no row in the `uploads`
table. They are quarantined, never trusted:

- Attaching a storage ID requires a server record owned by the caller. Unrecorded IDs reject on
  attach, so legacy blobs cannot be grafted onto restaurants.
- Deletion paths (`deleteImage`, `cleanupStorage`) reject missing or foreign records. Restaurant
  removal deletes only blobs with a matching owner record and leaves everything else untouched.
- Orphan cleanup accepts only unassociated owner records. Blobs attached to a restaurant must go
  through the restaurant-bound path.
- Do not backfill ownership by guessing from restaurant image entries, and do not delete production
  storage without explicit approval. If a legacy blob must be reclaimed, verify the uploader out of
  band, record ownership, then run the normal path.

## Troubleshooting

- `ctx.db.query is undefined`: Use `internalMutation` (not `action`)
- Schema validation fails on push: reads validate as well as writes, and `v.object` rejects unknown
  fields, so declare every stored key (new and legacy) during the interim
- Backfill reports zero migrations but validation still fails: stored docs carry legacy keys the
  skip check ignores. `patch` never removes keys; rewrite with `ctx.db.replace`
- Function not found: Deploy first, then run
