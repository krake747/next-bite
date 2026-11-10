import { createServerFn } from "@tanstack/react-start"

import { type RouterAuth } from "./auth.identity"

export type AuthSnapshot = {
    readonly current: () => RouterAuth | null
    readonly publish: (auth: RouterAuth) => boolean
}

function sameAuth(a: RouterAuth | null, b: RouterAuth): boolean {
    return a !== null && a.isAuthenticated === b.isAuthenticated && a.user?.id === b.user?.id
}

export function createAuthSnapshot(): AuthSnapshot {
    let known: RouterAuth | null = null
    return {
        current: () => known,
        publish: (auth) => {
            const changed = !sameAuth(known, auth)
            known = auth
            return changed
        },
    }
}

const fetchRequestAuth = createServerFn({ method: "GET" }).handler(async () => {
    const { resolveServerAuth } = await import("./auth.server")
    return resolveServerAuth()
})

export async function loadRouterAuth(snapshot: AuthSnapshot): Promise<RouterAuth | null> {
    const known = snapshot.current()
    if (known !== null || typeof window !== "undefined") {
        return known
    }
    return fetchRequestAuth()
}
