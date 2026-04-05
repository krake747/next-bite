import { createAuthClient } from "better-auth/solid"
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins"

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL

if (!CONVEX_SITE_URL) {
    throw new Error("VITE_CONVEX_SITE_URL environment variable is not set")
}

export const authClient = createAuthClient({
    baseURL: CONVEX_SITE_URL,
    fetchOptions: {
        credentials: "include",
    },
    plugins: [crossDomainClient(), convexClient()],
})
