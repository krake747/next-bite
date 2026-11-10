import { getRequestHeaders } from "@tanstack/react-start/server"

import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start"
import { env } from "@core/env"

import { resolveRequestAuth, type RouterAuth } from "./auth.identity"
import { api } from "./endpoints"

const startAuth = convexBetterAuthReactStart({
    convexUrl: env.VITE_CONVEX_URL,
    convexSiteUrl: env.VITE_CONVEX_SITE_URL,
})

export const { handler } = startAuth

export async function resolveServerAuth(): Promise<RouterAuth | null> {
    return resolveRequestAuth(getRequestHeaders(), async () => startAuth.fetchAuthQuery(api.users.getSessionUser))
}
