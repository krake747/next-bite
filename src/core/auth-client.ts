import { emailOTPClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins"
import { env } from "@core/env"

export const authClient = createAuthClient({
    baseURL: env.VITE_CONVEX_SITE_URL,
    fetchOptions: {
        credentials: "include",
    },
    plugins: [crossDomainClient(), convexClient(), emailOTPClient()],
})
