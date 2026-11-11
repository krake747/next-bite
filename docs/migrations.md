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

Upload ownership is the first claim (ADR-0015). A place photo is claimed by its `photos` row and an
avatar by its profile row; both are indexed by storage ID. The daily cleanup deletes any blob older
than a day that holds no claim. The `stripProfilesCreatedAt` backfill ran clean on dev
(`total: 1, migrated: 0`) and was removed with the re-tighten; `backend-migrate.sh` lists no
migrations until the next schema change needs one.

## Troubleshooting

- `ctx.db.query is undefined`: use `internalMutation`, not `action`.
- Schema validation fails on push: declare every stored key, new and legacy, during the interim.
- Backfill reports nothing left but validation still fails: stored documents carry legacy keys the
  skip check ignores. Rewrite with `ctx.db.replace`.
- Function not found: deploy first, then run.
