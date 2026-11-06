import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

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
})
