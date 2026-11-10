import "../../fonts.css"
import "../../index.css"
import { QueryClientProvider } from "@tanstack/react-query"
import {
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRouter,
    type RouteComponent,
} from "@tanstack/react-router"
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"

import { ConvexProvider } from "@api/convex.context"
import { convexQueryOptions } from "@api/convex.options"
import { type RestaurantDoc } from "@api/db/restaurants"
import { createSeededClient, seedKey } from "@api/db/seeded.client"
import { api } from "@api/endpoints"
import { type SessionStatus } from "@core/session"

import { Route as AccountRoute } from "../_app/account"
import { Route as FriendsRoute } from "../_app/friends"
import { Route as GroupsRoute } from "../_app/groups.index"
import { Route as HomeRoute } from "../_app/home"
import { Route as YouRoute } from "../_app/you"

const testUser = { id: "user-1", email: "alex@example.com", name: "Alex" }
let sessionKind: SessionStatus["kind"] = "loading"
let ownRestaurants: ReadonlyArray<RestaurantDoc> = []
let feedRestaurants: ReadonlyArray<RestaurantDoc> = []

const auth = vi.hoisted(() => {
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
        user: { id: "user-1", email: "alex@example.com", name: "Alex" },
        error: null,
        initializeAuth: noop,
        signInWithPassword: noop,
        signUpWithPassword: noop,
        requestOtp: noop,
        verifyOtp: noop,
        signOut: noop,
    }
})

vi.mock("@api/auth.sdk", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.sdk")>()
    return {
        ...original,
        getConvexSessionToken: async () => {
            await Promise.resolve()
            return "test-token"
        },
    }
})

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
    return { ...original, useAuthContext: () => auth }
})

vi.mock("@core/session", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/session")>()
    return {
        ...original,
        useAuth: () => auth,
        useSessionStatus: (): SessionStatus =>
            sessionKind === "ready" ? { kind: "ready", userId: testUser.id } : { kind: "loading" },
    }
})

vi.mock("@core/restaurants", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/restaurants")>()
    return {
        ...original,
        useRestaurants: () => (sessionKind === "ready" ? ownRestaurants : undefined),
        useFeedRestaurants: () => (sessionKind === "ready" ? feedRestaurants : undefined),
    }
})

function restaurant(id: string, name: string, owner = testUser): RestaurantDoc {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test fixture shaped to the restaurant document
    return {
        _id: id,
        _creationTime: owner.id === testUser.id ? 1000 : 2000,
        ownerId: owner.id,
        ownerName: owner.name,
        name,
        cuisine: "Italian",
        address: { label: "Luxembourg City" },
        images: [],
        visibility: "private",
        createdAt: 1000,
    } as unknown as RestaurantDoc
}

const seeds = new Map<string, unknown>([
    [
        seedKey("groups:listMyGroups", undefined),
        [
            { group: { _id: "g1", name: "Food Crew" }, isOwner: true },
            { group: { _id: "g2", name: "Lunch Club" }, isOwner: false },
        ],
    ],
    [
        seedKey("friendships:listFriends", undefined),
        [
            { authUserId: "ben", name: "Ben" },
            { authUserId: "cleo", name: "Cleo" },
        ],
    ],
    [seedKey("friendships:listFriendRequests", undefined), { incoming: [], outgoing: [] }],
    [seedKey("friendships:listDiscoveries", { friendAuthUserId: "ben" }), []],
    [seedKey("friendships:listDiscoveries", { friendAuthUserId: "cleo" }), []],
    [
        seedKey("social:listMyStatuses", undefined),
        [
            { restaurantId: "r1", status: "want" },
            { restaurantId: "r2", status: "want" },
        ],
    ],
    [
        seedKey("users:getMe", undefined),
        {
            status: "ready",
            profile: { _id: "p1", authUserId: testUser.id, name: testUser.name, email: testUser.email, createdAt: 1 },
        },
    ],
])

type Box = { readonly top: number; readonly height: number }

function boxes(selector: string): ReadonlyArray<Box> {
    return [...document.querySelectorAll(selector)].map((element) => {
        const rect = element.getBoundingClientRect()
        return { top: Math.round(rect.top), height: Math.round(rect.height) }
    })
}

async function renderPage(
    Page: RouteComponent,
    warm?: (backend: ReturnType<typeof createSeededClient>) => Promise<unknown>,
) {
    const backend = createSeededClient({ seeds })
    await warm?.(backend)
    const router = createRouter({
        routeTree: createRootRoute({ component: Page }),
        history: createMemoryHistory({ initialEntries: ["/"] }),
    })
    await router.load()
    return render(
        <QueryClientProvider client={backend.queryClient}>
            <ConvexProvider client={backend.client}>
                <RouterProvider router={router} />
            </ConvexProvider>
        </QueryClientProvider>,
    )
}

async function measure(
    Page: RouteComponent,
    kind: SessionStatus["kind"],
    selector: string,
): Promise<ReadonlyArray<Box>> {
    sessionKind = kind
    const screen = await renderPage(Page)
    const ready = kind === "ready"
    await vi.waitUntil(
        () => (document.querySelector('[data-slot="page-skeleton"]') === null) === ready && boxes(selector).length > 0,
        { message: `${selector} never settled for ${kind}` },
    )
    const measured = boxes(selector)
    await screen.unmount()
    return measured
}

function maxDrift(skeleton: ReadonlyArray<Box>, real: ReadonlyArray<Box>): number {
    if (skeleton.length !== real.length) {
        return Number.POSITIVE_INFINITY
    }
    let drift = 0
    for (const [index, box] of skeleton.entries()) {
        const other = real[index]
        if (other === undefined) {
            return Number.POSITIVE_INFINITY
        }
        drift = Math.max(drift, Math.abs(box.top - other.top), Math.abs(box.height - other.height))
    }
    return drift
}

function firstTop(list: ReadonlyArray<Box>): ReadonlyArray<Box> {
    return list.slice(0, 1).map(({ top }) => ({ top, height: 0 }))
}

function pageOf(component: RouteComponent | undefined): RouteComponent {
    if (component === undefined) {
        throw new TypeError("Route has no component")
    }
    return component
}

const viewports = [
    { name: "desktop", width: 1280, height: 900 },
    { name: "mobile", width: 390, height: 844 },
] as const

const appFonts = ['400 16px "DM Sans Variable"', '600 16px "Bricolage Grotesque Variable"'] as const

beforeAll(async () => {
    const loaded = await Promise.all(appFonts.map(async (font) => document.fonts.load(font)))
    if (loaded.some((faces) => faces.length === 0)) {
        throw new Error("App fonts did not load")
    }
})

beforeEach(() => {
    ownRestaurants = [restaurant("r1", "Trattoria Verde"), restaurant("r2", "Sushi Bar")]
    feedRestaurants = [restaurant("r3", "Pho House", { id: "ben", email: "ben@example.com", name: "Ben" })]
})

afterEach(() => {
    sessionKind = "loading"
})

describe.each(viewports)("page skeletons on $name", ({ width, height }) => {
    beforeEach(async () => {
        await page.viewport(width, height)
    })

    test("groups skeleton keeps list cards in place", async () => {
        const Page = pageOf(GroupsRoute.options.component)
        const skeleton = await measure(Page, "loading", '[data-slot="page-container"] li')
        const real = await measure(Page, "ready", '[data-slot="page-container"] li')
        expect(maxDrift(skeleton, real)).toBeLessThanOrEqual(4)
    })

    test("friends skeleton keeps friend cards in place", async () => {
        const Page = pageOf(FriendsRoute.options.component)
        const skeleton = await measure(Page, "loading", '[data-slot="page-container"] li')
        const real = await measure(Page, "ready", '[data-slot="page-container"] li')
        expect(maxDrift(skeleton, real)).toBeLessThanOrEqual(4)
    })

    test("restaurant lists skeleton keeps section headings and cards in place", async () => {
        const Page = pageOf(YouRoute.options.component)
        const selector = '[data-slot="page-container"] h2, [data-slot="page-container"] li'
        const skeleton = (await measure(Page, "loading", selector)).slice(0, 6)
        const real = (await measure(Page, "ready", selector)).slice(0, 6)
        expect(maxDrift(skeleton, real)).toBeLessThanOrEqual(4)
    })

    test("profile skeleton keeps the details rows in place", async () => {
        const Page = pageOf(AccountRoute.options.component)
        const selector = '[data-slot="settings-row"]'
        const skeleton = await measure(Page, "loading", selector)
        const real = await measure(Page, "ready", selector)
        expect(maxDrift(skeleton, real)).toBeLessThanOrEqual(4)
    })

    test("home skeleton keeps the first feed item in place", async () => {
        const Page = pageOf(HomeRoute.options.component)
        const skeleton = await measure(Page, "loading", '[data-slot="restaurant-card-skeleton"]')
        const real = await measure(Page, "ready", '[aria-label="Latest activity"] > div > *')
        expect(maxDrift(firstTop(skeleton), firstTop(real))).toBeLessThanOrEqual(4)
    })
})

function watchForSkeleton(): () => boolean {
    let seen = false
    const observer = new MutationObserver((records) => {
        for (const record of records) {
            for (const node of record.addedNodes) {
                if (
                    node instanceof Element &&
                    (node.matches('[data-slot="page-skeleton"]') ||
                        node.querySelector('[data-slot="page-skeleton"]') !== null)
                ) {
                    seen = true
                }
            }
        }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
        observer.disconnect()
        return seen
    }
}

describe("cached data", () => {
    test("groups paints cached content without a skeleton", async () => {
        sessionKind = "ready"
        const stop = watchForSkeleton()
        const screen = await renderPage(pageOf(GroupsRoute.options.component), async (backend) =>
            backend.queryClient.query({ ...convexQueryOptions(api.groups.listMyGroups), staleTime: "static" }),
        )
        await expect.element(screen.getByRole("link", { name: "Food Crew" })).toBeInTheDocument()
        expect(stop()).toBe(false)
    })

    test("groups shows the skeleton while nothing is cached", async () => {
        sessionKind = "ready"
        const stop = watchForSkeleton()
        const screen = await renderPage(pageOf(GroupsRoute.options.component))
        await expect.element(screen.getByRole("link", { name: "Food Crew" })).toBeInTheDocument()
        expect(stop()).toBe(true)
    })
})
