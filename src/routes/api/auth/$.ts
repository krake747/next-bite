import { createFileRoute } from "@tanstack/react-router"

import { handler } from "@api/auth.server"

export const Route = createFileRoute("/api/auth/$")({
    server: {
        handlers: {
            GET: async ({ request }) => handler(request),
            POST: async ({ request }) => handler(request),
        },
    },
})
