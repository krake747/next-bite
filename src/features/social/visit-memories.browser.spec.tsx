import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { type Id } from "@convex/_generated/dataModel"
import { ConvexProvider } from "@core/convex-client"
import { createSeededClient } from "@core/db/seeded-client"

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

vi.mock("@core/image-utils", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/image-utils")>()
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

vi.mock("@core/hooks", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/hooks")>()
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
            signInWithSocial: noop,
            requestOtp: noop,
            verifyOtp: noop,
            signOut: noop,
        }),
        useVisitMemories: () => scriptedMemories,
        useAddVisitMemory: () => ({ mutateAsync: addMutate, isPending: false }),
        useCleanupStorage: () => ({ mutateAsync: noop }),
        useUploadImage: () => async () => {
            await Promise.resolve()
            return { url: "https://example.com/s1.jpg", storageId: storageId("s1") }
        },
    }
})

function renderMemories(): void {
    const queryClient = new QueryClient()
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only restaurant id
    const restaurantId = "r1" as unknown as Id<"restaurants">
    render(
        <QueryClientProvider client={queryClient}>
            <ConvexProvider client={createSeededClient({}).client}>
                <VisitMemories restaurantId={restaurantId} />
            </ConvexProvider>
        </QueryClientProvider>,
    )
}

function selectFiles(files: File[]): void {
    const input = document.querySelector('[data-slot="image-upload-input"]')
    if (!(input instanceof HTMLInputElement)) {
        throw new TypeError("File input not found")
    }
    Object.defineProperty(input, "files", { value: files, configurable: true })
    fireEvent.change(input)
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
        renderMemories()

        expect(await screen.findByRole("button", { name: "Open photo 1 by Ben" })).toBeInTheDocument()
    })

    test("shares a staged photo and clears the composer", async () => {
        resetMemories()
        scriptedMemories = []
        renderMemories()

        selectFiles([new File(["pixels"], "a.png", { type: "image/png" })])
        await waitFor(() => {
            expect(document.querySelector('[data-slot="image-preview-list"]')).not.toBeNull()
        })

        fireEvent.click(screen.getByRole("button", { name: "Share memory" }))
        await waitFor(() => {
            expect(addMutate).toHaveBeenCalledTimes(1)
        })
        expect(addMutate).toHaveBeenCalledWith({
            restaurantId: "r1",
            images: [{ url: "https://example.com/s1.jpg", storageId: "s1" }],
        })

        await waitFor(() => {
            expect(document.querySelector('[data-slot="image-preview-list"]')).toBeNull()
        })
    })

    test("stays hidden when signed out", async () => {
        resetMemories()
        signedIn = false
        renderMemories()

        await new Promise<void>((resolve) => {
            setTimeout(resolve, 50)
        })
        expect(document.querySelector('[role="alert"]')).toBeNull()
        expect(screen.queryByText("Visit memories")).toBeNull()
    })
})
