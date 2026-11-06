import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { HowItWorks } from "@routes/-components/home-sections"

import { AuthProvider } from "./auth-provider"

describe("AuthProvider server render", () => {
    it("renders children on the server instead of the loading placeholder", () => {
        const html = renderToString(
            <AuthProvider>
                <h1>Your friends have good taste</h1>
            </AuthProvider>,
        )

        expect(html).toContain("Your friends have good taste")
    })

    it("renders the static how-it-works section on the server without auth", () => {
        const html = renderToString(
            <AuthProvider>
                <HowItWorks />
            </AuthProvider>,
        )

        expect(html).toContain("How it works")
        expect(html).toContain("Add places")
    })
})
