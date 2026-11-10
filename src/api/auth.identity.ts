import { getSessionCookie } from "better-auth/cookies"

export type SessionUser = {
    readonly id: string
    readonly email: string
    readonly name?: string | null | undefined
    readonly image?: string | null | undefined
}

export type RouterAuth = {
    readonly isAuthenticated: boolean
    readonly user: SessionUser | null
}

export const signedOutAuth: RouterAuth = { isAuthenticated: false, user: null }

export async function resolveRequestAuth(
    headers: Headers,
    fetchUser: () => Promise<SessionUser | null>,
): Promise<RouterAuth | null> {
    if (getSessionCookie(headers) === null) {
        return signedOutAuth
    }
    try {
        const user = await fetchUser()
        return user === null ? signedOutAuth : { isAuthenticated: true, user }
    } catch {
        return null
    }
}
