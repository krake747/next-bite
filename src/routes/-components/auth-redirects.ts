import { redirect } from "@tanstack/react-router"

import { type RouterAuth } from "@api/auth.identity"
import { isSafeRedirectPath } from "@core/groups"

function leave(target: ReturnType<typeof redirect>): never {
    // oxlint-disable-next-line typescript/only-throw-error -- TanStack Router redirects via thrown redirect objects by design
    throw target
}

export function signedInDestination(requested: string | undefined): string {
    return isSafeRedirectPath(requested) ? requested : "/home"
}

export function redirectSignedIn(auth: RouterAuth | null, to: string): void {
    if (auth?.isAuthenticated === true) {
        leave(redirect({ to, replace: true }))
    }
}

export function redirectSignedOut(auth: RouterAuth | null, returnPath: string): void {
    if (auth?.isAuthenticated === false) {
        leave(redirect({ to: "/login", search: { redirect: returnPath } }))
    }
}
