import { QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"

import { ConvexProvider } from "@api/convex.context"
import { createSeededClient } from "@api/db/seeded.client"
import { type Id } from "@convex/_generated/dataModel"

import { VisitMemories } from "./visit-memories"

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only storage id
const storageId = (value: string): Id<"_storage"> => value as unknown as Id<"_storage">

type ScriptedMemory = {
    displayName: string
    images: { url: string }[]
}

let signedIn = true
let scriptedMemories: ScriptedMemory[] | undefined = []
const addMutate = vi.fn<() => Promise<unknown>>()

vi.mock("@api/auth.sdk", () => ({
    getConvexSessionToken: async () => {
        await Promise.resolve()
        return "test-token"
    },
}))

vi.mock("@core/image.utils", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/image.utils")>()
    return {
        ...original,
        processImage: async (file: Readonly<File>) => {
            await Promise.resolve()
            return {
                blob: file,
                originalName: file.name,
                originalSize: file.size,
                processedSize: file.size,
                width: 1,
                height: 1,
            }
        },
    }
})

vi.mock("@core/session", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/session")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        useAuth: () => ({
            isAuthenticated: signedIn,
            isLoading: false,
            user: signedIn ? { id: "user-1", email: "alex@example.com", name: "Alex" } : null,
            error: null,
            initializeAuth: noop,
            signInWithPassword: noop,
            signUpWithPassword: noop,
            requestOtp: noop,
            verifyOtp: noop,
            signOut: noop,
        }),
    }
})

vi.mock("@core/restaurants", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/restaurants")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        useVisitMemories: () => scriptedMemories,
        useAddVisitMemory: () => ({ mutateAsync: addMutate, isPending: false }),
        useCleanupStorage: () => ({ mutateAsync: noop }),
        useUploadImage: () => async () => {
            await Promise.resolve()
            return { url: "https://example.com/s1.jpg", storageId: storageId("s1") }
        },
    }
})

async function renderMemories() {
    const backend = createSeededClient({})
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
    const restaurantId = "r1" as unknown as Id<"restaurants">
    return render(
        <QueryClientProvider client={backend.queryClient}>
            <ConvexProvider client={backend.client} auth="authenticated">
                <VisitMemories restaurantId={restaurantId} />
            </ConvexProvider>
        </QueryClientProvider>,
    )
}

async function selectFiles(files: File[]): Promise<void> {
    const input = document.querySelector('[data-slot="image-upload-input"]')
    if (!(input instanceof HTMLInputElement)) {
        throw new TypeError("File input not found")
    }
    await page.elementLocator(input).upload(files)
}

function resetMemories(): void {
    signedIn = true
    scriptedMemories = []
    addMutate.mockReset()
    addMutate.mockResolvedValue(undefined)
}

describe("VisitMemories", () => {
    test("renders memories with author names", async () => {
        resetMemories()
        scriptedMemories = [{ displayName: "Ben", images: [{ url: "https://example.com/b1.jpg" }] }]
        const screen = await renderMemories()

        await expect.element(screen.getByRole("button", { name: "Open photo 1 by Ben" })).toBeInTheDocument()
    })

    test("shares a staged photo and clears the composer", async () => {
        resetMemories()
        scriptedMemories = []
        const screen = await renderMemories()

        await selectFiles([new File(["pixels"], "a.png", { type: "image/png" })])
        await expect.poll(() => document.querySelector('[data-slot="image-preview-list"]')).not.toBeNull()

        await screen.getByRole("button", { name: "Share memory" }).click()
        await expect.poll(() => addMutate).toHaveBeenCalledTimes(1)
        expect(addMutate).toHaveBeenCalledWith({
            restaurantId: "r1",
            images: [{ url: "https://example.com/s1.jpg", storageId: "s1" }],
        })

        await expect.poll(() => document.querySelector('[data-slot="image-preview-list"]')).toBeNull()
    })

    test("stays hidden when signed out", async () => {
        resetMemories()
        signedIn = false
        const screen = await renderMemories()

        await new Promise<void>((resolve) => {
            setTimeout(resolve, 50)
        })
        expect(document.querySelector('[role="alert"]')).toBeNull()
        await expect.element(screen.getByText("Visit memories")).not.toBeInTheDocument()
    })
})
