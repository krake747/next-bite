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

function jsonResponse(request: Request, status: number, payload: unknown): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...corsHeadersFor(request),
        },
    })
}

type UploadRejection = { status: number; message: string }

function validateUploadBlob(blob: Blob): UploadRejection | null {
    if (blob.type === "" || !ALLOWED_CONTENT_TYPES.includes(blob.type)) {
        return {
            status: 400,
            message: `Invalid content type. Must be one of: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
        }
    }
    if (blob.size > MAX_UPLOAD_BYTES) {
        return { status: 413, message: `File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB` }
    }
    return null
}

http.route({
    path: "/upload",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const identity = await ctx.auth.getUserIdentity()
            if (!identity) {
                return jsonResponse(request, 401, { error: "Sign in to upload photos" })
            }

            const blob = await request.blob()

            const rejected = validateUploadBlob(blob)
            if (rejected !== null) {
                return jsonResponse(request, rejected.status, { error: rejected.message })
            }

            const storageId = await ctx.storage.store(blob)
            const url = await ctx.storage.getUrl(storageId)
            await ctx.runMutation(internal.uploads.record, { storageId, ownerId: identity.subject })
            const stored = await ctx.runQuery(internal.uploads.lookupByStorage, { storageId })

            return jsonResponse(request, 200, {
                storageId,
                url,
                ...(typeof stored?.mimeType === "string" ? { mimeType: stored.mimeType } : {}),
                ...(typeof stored?.byteSize === "number" ? { byteSize: stored.byteSize } : {}),
            })
        } catch (error) {
            console.error("Upload error:", error)
            return jsonResponse(request, 500, {
                error: error instanceof Error ? error.message : "Upload failed",
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
