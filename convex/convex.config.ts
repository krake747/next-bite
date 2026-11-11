import { defineApp } from "convex/server"
import { v } from "convex/values"

import betterAuth from "@convex-dev/better-auth/convex.config"

const app = defineApp({
    env: {
        GOOGLE_MAPS_API_KEY: v.optional(v.string()),
        AUTH_EMAIL_OTP_ENABLED: v.optional(v.string()),
        MAILGUN_API_KEY: v.optional(v.string()),
        MAILGUN_DOMAIN: v.optional(v.string()),
        MAILGUN_DEV_FALLBACK: v.optional(v.string()),
        SITE_URL: v.optional(v.string()),
    },
})
app.use(betterAuth)

export default app
