# Convex migrations

Schema changes that stored data will not match need a migration. Migrations are internal mutations
next to the data they touch; the list in `.github/scripts/backend-migrate.sh` runs after every
backend deploy (see `environments.md`), so every listed migration must be idempotent.

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

## Image claims

Upload ownership is the first claim (ADR-0015). Restaurant images stored before claim records
existed get one from `storage:backfillImageClaims`, which claims each embedded image for the
restaurant that holds it. Avatars need no backfill because profiles are indexed by avatar storage
ID. The daily cleanup deletes any blob older than a day that holds no claim, so the backfill must
run before the first cleanup on a deployment with legacy images.

## Troubleshooting

- `ctx.db.query is undefined`: use `internalMutation`, not `action`.
- Schema validation fails on push: declare every stored key, new and legacy, during the interim.
- Backfill reports nothing left but validation still fails: stored documents carry legacy keys the
  skip check ignores. Rewrite with `ctx.db.replace`.
- Function not found: deploy first, then run.
