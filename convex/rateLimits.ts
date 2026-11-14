import { DAY, RateLimiter } from "@convex-dev/rate-limiter"

import { components } from "./_generated/api"
import { type ActionCtx } from "./_generated/server"

// Token buckets cap our own Google Places spend per tier. Rates sit just
// under the monthly free caps (Enterprise 1k, Pro 5k, Essentials 10k) so a
// traffic spike or a scraper degrades detail screens to fallbacks instead of
// billing. Buckets refill daily; capacity allows feed-mount bursts.
// Google-side per-SKU quota caps in the Cloud console remain the hard ceiling.
const googleQuota = new RateLimiter(components.rateLimiter, {
    detailsEnterprise: { kind: "token bucket", rate: 30, period: DAY, capacity: 60 },
    detailsPro: { kind: "token bucket", rate: 150, period: DAY, capacity: 300 },
    location: { kind: "token bucket", rate: 300, period: DAY, capacity: 600 },
})

export type GoogleQuotaName = "detailsEnterprise" | "detailsPro" | "location"

export async function takeGoogleQuota(ctx: ActionCtx, name: GoogleQuotaName): Promise<boolean> {
    const status = await googleQuota.limit(ctx, name)
    return status.ok
}
