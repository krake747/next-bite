import { authComponent } from "./auth"

export { FALLBACK_DISPLAY_NAME } from "../src/core/constants"
export { requireMember as requireMembership } from "./model/groups/memberships"

export const FALLBACK_GROUP_NAME = "Unknown group"

export type AuthUserRecord = {
    name?: string | null | undefined
    email?: string | null | undefined
}

export async function readAuthUser(
    ctx: Parameters<typeof authComponent.getAuthUser>[0],
): Promise<AuthUserRecord | undefined> {
    try {
        return await authComponent.getAuthUser(ctx)
    } catch {
        return undefined
    }
}
