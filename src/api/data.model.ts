export type { Doc } from "@convex/_generated/dataModel"
export type { Id } from "@convex/_generated/dataModel"
import { type Id, type TableNames } from "@convex/_generated/dataModel"

// See ADR-0025: single conversion boundary.
export function toId<TableName extends TableNames>(value: string): Id<TableName> {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the single sanctioned string-to-Id brand
    return value as unknown as Id<TableName>
}
