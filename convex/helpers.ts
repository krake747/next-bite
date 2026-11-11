import { authComponent } from "./auth"

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
