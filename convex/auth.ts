import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"

import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex, crossDomain } from "@convex-dev/better-auth/plugins"

import { components } from "./_generated/api"
import { type DataModel } from "./_generated/dataModel"
import { query } from "./_generated/server"
import authConfig from "./auth.config"
import { sendOtpEmail } from "./email"
import { getValidatedConvexSiteUrl, hasMailgunConfig, isEmailOtpEnabled, isMailDevFallback } from "./env"

const convexSiteUrl = getValidatedConvexSiteUrl()

export const authComponent = createClient<DataModel>(components.betterAuth)

// Public on purpose: capability flags only, no secrets or user data.
export const getAuthMethods = query({
    args: {},
    handler: () => ({
        password: true,
        // OTP is offered only when a code can actually be delivered: flag on plus either a
        // working mail configuration or the explicit local dev fallback.
        emailOtp: isEmailOtpEnabled() && (hasMailgunConfig() || isMailDevFallback()),
    }),
})

export const createAuth = (ctx: GenericCtx<DataModel>) => {
    return betterAuth({
        baseURL: convexSiteUrl,
        trustedOrigins: [convexSiteUrl, "http://localhost:5173", "https://nextbite.kevinkraemer.com"],
        database: authComponent.adapter(ctx),
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
            autoSignIn: true,
            minPasswordLength: 8,
        },
        plugins: [
            // Same deliverability gate as getAuthMethods: no OTP endpoints when no code can
            // actually be delivered.
            ...(isEmailOtpEnabled() && (hasMailgunConfig() || isMailDevFallback())
                ? [
                      emailOTP({
                          async sendVerificationOTP({ email, otp, type }) {
                              await sendOtpEmail(email, otp, type)
                          },
                          storeOTP: "hashed",
                      }),
                  ]
                : []),
            crossDomain({ siteUrl: convexSiteUrl }),
            convex({
                authConfig,
            }),
        ],
    })
}
