import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { act } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { type Id } from "@convex/_generated/dataModel"
import { ConvexProvider } from "@core/convex-client"
import { createSeededClient, type MutationCall } from "@core/db/seeded-client"
import { type ImageRecord } from "@core/hooks"

import { RestaurantDialog } from "./restaurant-dialog"

type Deferred<T> = {
    readonly promise: Promise<T>
    readonly resolve: (value: T) => void
    readonly reject: (error: Error) => void
}

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (error: Error) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only storage id
const storageId = (value: string): Id<"_storage"> => value as unknown as Id<"_storage">

const uploadGates: Deferred<ImageRecord>[] = []
let uploadCalls = 0
let uploadImpl: (file: Readonly<File>) => Promise<ImageRecord> = async () => {
    await Promise.resolve()
    throw new Error("uploadImpl not set")
}

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
    return {
        ...original,
        useUploadImage: () => uploadImpl,
        useAddRestaurantWithHours: () => ({ mutateAsync: addMutate }),
    }
})

vi.mock("@core/auth-provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/auth-provider")>()
    const noop = async () => {
        await Promise.resolve()
    }
    return {
        ...original,
        AuthProvider: ({ children }: Readonly<{ children: React.ReactNode }>) => <div>{children}</div>,
        useAuth: () => ({
            isAuthenticated: true,
            isLoading: false,
            user: { id: "user-1", email: "alex@example.com", name: "Alex" },
            error: null,
            initializeAuth: noop,
            signInWithPassword: noop,
            signUpWithPassword: noop,
            signInWithSocial: noop,
            requestOtp: noop,
            verifyOtp: noop,
            signOut: noop,
        }),
    }
})

const mutationCalls: MutationCall[] = []
const addMutate = vi.fn<() => Promise<unknown>>()
let submitGate: Deferred<unknown> | null = null

function renderDialog(onOpenChange: (open: boolean) => void): void {
    const queryClient = new QueryClient()
    render(
        <QueryClientProvider client={queryClient}>
            <ConvexProvider client={createSeededClient({ calls: mutationCalls }).client}>
                <RestaurantDialog mode="add" show onOpenChange={onOpenChange} />
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

function requiredSubmitGate(): Deferred<unknown> {
    if (submitGate === null) {
        throw new TypeError("Submit never started")
    }
    return submitGate
}

function resetUploads(): void {
    uploadCalls = 0
    uploadGates.length = 0
    mutationCalls.length = 0
    submitGate = null
    uploadImpl = async () => {
        await Promise.resolve()
        const gate = createDeferred<ImageRecord>()
        uploadGates.push(gate)
        uploadCalls += 1
        return gate.promise
    }
    addMutate.mockReset()
    addMutate.mockImplementation(async () => {
        await Promise.resolve()
        if (submitGate === null) {
            throw new TypeError("Submit was not gated")
        }
        return submitGate.promise
    })
}

async function stageOneImage(): Promise<void> {
    selectFiles([new File(["pixels"], "a.png", { type: "image/png" })])
    await waitFor(() => {
        expect(uploadCalls).toBe(1)
    })
    const gate = uploadGates[0]
    if (gate === undefined) {
        throw new TypeError("Upload never started")
    }
    await act(async () => {
        gate.resolve({ url: "https://example.com/a.jpg", storageId: storageId("s1") })
        await Promise.resolve()
    })
    await waitFor(() => {
        expect(document.querySelectorAll("img")).toHaveLength(1)
    })
}

describe("RestaurantDialog close ownership", () => {
    test("Cancel discards the staged upload and closes", async () => {
        resetUploads()
        const onOpenChange = vi.fn<(open: boolean) => void>()
        renderDialog(onOpenChange)
        await stageOneImage()

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({
                fn: "restaurants:cleanupStorage",
                args: { storageId: "s1" },
            })
        })
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    test("Escape discards the staged upload and closes", async () => {
        resetUploads()
        const onOpenChange = vi.fn<(open: boolean) => void>()
        renderDialog(onOpenChange)
        await stageOneImage()

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" })

        await waitFor(() => {
            expect(mutationCalls).toContainEqual({
                fn: "restaurants:cleanupStorage",
                args: { storageId: "s1" },
            })
        })
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    test("submit hands attached images to persisted ownership without cleanup", async () => {
        resetUploads()
        const onOpenChange = vi.fn<(open: boolean) => void>()
        renderDialog(onOpenChange)
        await stageOneImage()

        submitGate = createDeferred<unknown>()
        fireEvent.change(screen.getByLabelText("Restaurant name"), { target: { value: "Trattoria" } })
        fireEvent.change(screen.getByLabelText("Cuisine"), { target: { value: "Italian" } })
        fireEvent.change(screen.getByLabelText("Location"), { target: { value: "Luxembourg" } })
        fireEvent.click(screen.getByRole("button", { name: "Add Restaurant" }))

        await waitFor(() => {
            expect(addMutate).toHaveBeenCalledTimes(1)
        })
        await act(async () => {
            requiredSubmitGate().resolve(undefined)
            await Promise.resolve()
        })

        await waitFor(() => {
            expect(onOpenChange).toHaveBeenCalledWith(false)
        })
        expect(addMutate).toHaveBeenCalledTimes(1)
        expect(mutationCalls.filter((call) => call.fn === "restaurants:cleanupStorage")).toHaveLength(0)
    })
})
