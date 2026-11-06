import { httpRouter } from "convex/server"

import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { resolveCorsHeaders } from "./cors"
import { appOrigins } from "./env"

const http = httpRouter()

// The upload endpoint is browser-facing cross-origin, so it reflects only
// trusted app origins. Anything else gets no CORS headers and the browser
// blocks the response. Non-browser callers send no Origin and are unaffected.
function corsHeadersFor(request: Request): Record<string, string> {
    return resolveCorsHeaders(request.headers.get("Origin"), appOrigins())
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

authComponent.registerRoutes(http, createAuth, { cors: true })

http.route({
    path: "/upload",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        console.log("Upload request received, content-type:", request.headers.get("content-type"))
        try {
            const identity = await ctx.auth.getUserIdentity()
            if (!identity) {
                return new Response(JSON.stringify({ error: "Sign in to upload photos" }), {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeadersFor(request),
                    },
                })
            }

            const blob = await request.blob()
            console.log("Blob received, size:", blob.size, "type:", blob.type)

            if (!blob.type || !ALLOWED_CONTENT_TYPES.includes(blob.type)) {
                console.log("Validation failed: invalid content type", blob.type)
                return new Response(
                    JSON.stringify({
                        error: `Invalid content type. Must be one of: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
                    }),
                    {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json",
                            ...corsHeadersFor(request),
                        },
                    },
                )
            }

            if (blob.size > MAX_UPLOAD_BYTES) {
                console.log("Validation failed: file too large", blob.size)
                return new Response(
                    JSON.stringify({ error: `File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB` }),
                    {
                        status: 413,
                        headers: {
                            "Content-Type": "application/json",
                            ...corsHeadersFor(request),
                        },
                    },
                )
            }

            const storageId = await ctx.storage.store(blob)
            const url = await ctx.storage.getUrl(storageId)
            await ctx.runMutation(internal.uploads.record, { storageId, ownerId: identity.subject })
            const stored = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId })

            return new Response(
                JSON.stringify({
                    storageId,
                    url,
                    ...(typeof stored?.mimeType === "string" ? { mimeType: stored.mimeType } : {}),
                    ...(typeof stored?.byteSize === "number" ? { byteSize: stored.byteSize } : {}),
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeadersFor(request),
                    },
                },
            )
        } catch (error) {
            console.error("Upload error:", error)
            return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Upload failed" }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeadersFor(request),
                },
            })
        }
    }),
})

http.route({
    path: "/upload",
    method: "OPTIONS",
    handler: httpAction(async (_ctx, request) => {
        return new Response(null, {
            status: 204,
            headers: corsHeadersFor(request),
        })
    }),
})

export default http
