import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act } from "@testing-library/react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, test, vi } from "vitest"

import { type RouterAuth, signedOutAuth } from "./auth.identity"
import { AuthProvider, useAuthContext } from "./auth.provider"

vi.mock("convex/react", async (importOriginal) => {
    const original = await importOriginal<typeof import("convex/react")>()
    return {
        ...original,
        ConvexReactClient: class {
            authCalls = 0
            setAuth(): void {
                this.authCalls += 1
            }
            clearAuth(): void {
                this.authCalls += 1
            }
        },
        useConvexAuth: () => ({ isLoading: true, isAuthenticated: false }),
    }
})

vi.mock("@convex-dev/better-auth/react", () => ({
    ConvexBetterAuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>): React.ReactNode => children,
}))

vi.mock("./auth.sdk", () => ({
    authClient: {
        getSession: async () => {
            await new Promise<never>(() => {})
        },
    },
}))

function IdentityProbe() {
    const auth = useAuthContext()
    if (auth.isInitializing) {
        return <p>starting</p>
    }
    return <p>{auth.isAuthenticated ? `signed in as ${auth.user?.email ?? ""}` : "signed out"}</p>
}

function App({ initialAuth }: Readonly<{ initialAuth: RouterAuth | null }>) {
    return (
        <QueryClientProvider client={new QueryClient()}>
            <AuthProvider initialAuth={initialAuth}>
                <IdentityProbe />
            </AuthProvider>
        </QueryClientProvider>
    )
}

function renderOnServer(initialAuth: RouterAuth | null): string {
    vi.stubGlobal("window", undefined)
    try {
        return renderToString(<App initialAuth={initialAuth} />)
    } finally {
        vi.unstubAllGlobals()
    }
}

async function hydrate(
    html: string,
    initialAuth: RouterAuth | null,
): Promise<{ container: HTMLElement; errors: unknown[] }> {
    const container = document.createElement("div")
    container.innerHTML = html
    document.body.append(container)
    const errors: unknown[] = []
    await act(async () => {
        hydrateRoot(container, <App initialAuth={initialAuth} />, {
            onRecoverableError: (error) => {
                errors.push(error)
            },
        })
        await Promise.resolve()
    })
    return { container, errors }
}

afterEach(() => {
    document.body.innerHTML = ""
})

const returningUser: RouterAuth = {
    isAuthenticated: true,
    user: { id: "user-1", email: "alex@example.com", name: "Alex", image: null },
}

describe("AuthProvider hydration with a server-resolved session", () => {
    test("a returning user paints signed in on the server and hydrates without a mismatch", async () => {
        const html = renderOnServer(returningUser)
        expect(html).toContain("signed in as alex@example.com")

        const { container, errors } = await hydrate(html, returningUser)

        expect(errors).toEqual([])
        expect(container.textContent).toBe("signed in as alex@example.com")
    })

    test("a signed-out request paints signed out on both sides", async () => {
        const html = renderOnServer(signedOutAuth)
        expect(html).toContain("signed out")

        const { container, errors } = await hydrate(html, signedOutAuth)

        expect(errors).toEqual([])
        expect(container.textContent).toBe("signed out")
    })

    test("an unresolved session stays neutral on both sides", async () => {
        const html = renderOnServer(null)
        expect(html).toContain("starting")

        const { container, errors } = await hydrate(html, null)

        expect(errors).toEqual([])
        expect(container.textContent).toBe("starting")
    })
})
