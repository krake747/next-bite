import { httpRouter } from "convex/server"
import { authComponent, createAuth } from "./auth"
import { httpAction } from "./_generated/server"

const http = httpRouter()

// CORS headers for the upload endpoint
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

// Register all Better Auth routes with CORS support
authComponent.registerRoutes(http, createAuth, { cors: true })

// Simple file upload endpoint for testing
http.route({
    path: "/upload",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        console.log("Upload request received, content-type:", request.headers.get("content-type"))
        try {
            const blob = await request.blob()
            console.log("Blob received, size:", blob.size, "type:", blob.type)

            const storageId = await ctx.storage.store(blob)
            console.log("Stored successfully, storageId:", storageId)

            // Verify the file was stored by trying to get a URL
            const url = await ctx.storage.getUrl(storageId)
            console.log("Generated URL:", url)

            return new Response(JSON.stringify({ storageId, url }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                },
            })
        } catch (error) {
            console.error("Upload error:", error)
            return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Upload failed" }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                },
            })
        }
    }),
})

// Handle OPTIONS preflight request
http.route({
    path: "/upload",
    method: "OPTIONS",
    handler: httpAction(async () => {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        })
    }),
})

export default http
