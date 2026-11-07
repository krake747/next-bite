import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToString } from "react-dom/server"
import { describe, expect, test } from "vitest"

import { AuthProvider } from "./auth-provider"

describe("AuthProvider server render", () => {
    test("renders children on the server instead of the loading placeholder", () => {
        const queryClient = new QueryClient()
        const html = renderToString(
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <h1>Your friends have good taste</h1>
                </AuthProvider>
            </QueryClientProvider>,
        )

        expect(html).toContain("Your friends have good taste")
    })
})
