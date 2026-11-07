export type { Doc } from "@convex/_generated/dataModel"
export type { Id } from "@convex/_generated/dataModel"
import { type Id, type TableNames } from "@convex/_generated/dataModel"

// Single boundary conversion: router params, comment ids, and optimistic
// placeholders are plain strings at runtime; Convex brands them. No runtime
// check can prove the brand, so the one cast lives here instead of at every
// call site.
export function toId<TableName extends TableNames>(value: string): Id<TableName> {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the single sanctioned string-to-Id brand
    return value as unknown as Id<TableName>
}
