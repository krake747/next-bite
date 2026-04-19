# Convex Migrations

This project uses Convex for the backend. Schema changes require migrations.

## Changing Schema with Data Migration

When changing a field type, existing data won't match the new schema. Process:

1. **Update schema to accept both formats** (temporary):

```typescript
// convex/schema.ts
images: v.optional(
  v.array(
    v.union(v.string(), v.object({ url: v.string(), storageId: v.string() })),
  ),
),
```

2. **Deploy** `pnpm convex dev`

3. **Create migration** in `convex/migrate.ts`:

```typescript
import { internalMutation } from "./_generated/server"

export const convertImagesToObjects = internalMutation(async (ctx) => {
  const restaurants = await ctx.db.query("restaurants").collect()

  for (const restaurant of restaurants) {
    const images = restaurant.images as string[] | undefined
    if (!images || typeof images[0] !== "string") continue

    const newImages = images.map((url) => ({
      url,
      storageId: url.match(/\/storage\/([a-f0-9-]+)$/)?.[1] ?? url,
    }))

    await ctx.db.patch(restaurant._id, { images: newImages })
  }

  return { converted: restaurants.length }
})
```

4. **Run migration**:

```bash
pnpm convex run migrate:convertImagesToObjects
```

5. **Deploy new schema** (only new format)

## Available Migrations

```bash
# Convert string images to objects with storageId
pnpm convex run migrate:convertImagesToObjects

# Find orphaned storage files
pnpm convex run migrate:cleanupOrphanedStorage
```

## Troubleshooting

- `ctx.db.query is undefined`: Use `internalMutation` (not `action`)
- Schema validation fails: Add `v.union(oldFormat, newFormat)` temporarily
- Function not found: Deploy first, then run
