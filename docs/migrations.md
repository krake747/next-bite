# Convex migrations

Schema changes that stored data will not match need a migration. Migration functions live in
`convex/migrate.ts`; the list in `.github/scripts/backend-migrate.sh` runs after every backend
deploy (see `environments.md`), so every listed migration must be idempotent.

## Relax, backfill, tighten

1. **Relax the schema to accept both shapes.** Reads validate as well as writes, so the schema must
   accept what is stored now, not just what you will write. `v.object` rejects unknown fields, so
   every legacy key still stored must be declared optional too.
2. **Deploy** the relaxed schema: `pnpm convex:dev` locally, CI on the way to production.
3. **Run a reporting backfill.** An `internalMutation` reads every affected document, rewrites the
   ones that need it with `ctx.db.replace` (`patch` never removes legacy keys), and returns counts
   such as `{ total, migrated }`. Run it until nothing is outstanding.
4. **Re-tighten** the schema (drop legacy fields, restore required ones) and deploy again. `lint`
   and `lint:ts` may stay red in the relaxed interim commits.

## Upload ownership quarantine

Uploads from before owner records existed have blobs in storage with no `uploads` row. They are
quarantined, never trusted:

- Attaching a storage ID requires a server record owned by the caller, so legacy blobs cannot be
  grafted onto restaurants.
- Deletion paths reject missing or foreign records. Removing a restaurant deletes only blobs with a
  matching owner record.
- Orphan cleanup accepts only unassociated owner records; attached blobs go through the
  restaurant-bound path.
- Never backfill ownership by guessing from restaurant images, and never delete production storage
  without explicit approval. To reclaim a legacy blob, verify the uploader out of band, record
  ownership, then use the normal path.

## Troubleshooting

- `ctx.db.query is undefined`: use `internalMutation`, not `action`.
- Schema validation fails on push: declare every stored key, new and legacy, during the interim.
- Backfill reports nothing left but validation still fails: stored documents carry legacy keys the
  skip check ignores. Rewrite with `ctx.db.replace`.
- Function not found: deploy first, then run.
