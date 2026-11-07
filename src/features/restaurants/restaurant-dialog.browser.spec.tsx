import { QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"

import { ConvexProvider } from "@api/convex.context"
import { SyncTimeoutError, type RestaurantAddArgs } from "@api/db/restaurants"
import { createSeededClient, type MutationCall } from "@api/db/seeded.client"
import { type Id } from "@convex/_generated/dataModel"
import { type ImageRecord } from "@core/restaurants"

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

vi.mock("@api/auth.sdk", () => ({
    getConvexSessionToken: async () => {
        await Promise.resolve()
        return "test-token"
    },
}))

vi.mock("@core/restaurants", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/restaurants")>()
    return {
        ...original,
        useUploadImage: () => uploadImpl,
        useAddRestaurantWithHours: () => ({ mutateAsync: addMutate }),
    }
})

vi.mock("@api/auth.provider", async (importOriginal) => {
    const original = await importOriginal<typeof import("@api/auth.provider")>()
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
const addMutate = vi.fn<(args: RestaurantAddArgs) => Promise<unknown>>()
let submitGate: Deferred<unknown> | null = null

async function renderDialog(onOpenChange: (open: boolean) => void) {
    const backend = createSeededClient({ calls: mutationCalls })
    return render(
        <QueryClientProvider client={backend.queryClient}>
            <ConvexProvider client={backend.client}>
                <RestaurantDialog mode="add" show onOpenChange={onOpenChange} />
            </ConvexProvider>
        </QueryClientProvider>,
    )
}

type DialogScreen = Awaited<ReturnType<typeof renderDialog>>

// Direct dispatch: the unstyled test env leaves Base UI's inert backdrop above
// the panel, so Playwright hit-testing cannot reach dialog buttons.
function clickButton(button: { element: () => HTMLElement | SVGElement }): void {
    const node = button.element()
    if (!(node instanceof HTMLElement)) {
        throw new TypeError("Button not found")
    }
    node.click()
}

async function selectFiles(files: File[]): Promise<void> {
    const input = document.querySelector('[data-slot="image-upload-input"]')
    if (!(input instanceof HTMLInputElement)) {
        throw new TypeError("File input not found")
    }
    await page.elementLocator(input).upload(files)
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
    addMutate.mockClear()
    addMutate.mockImplementation(async () => {
        await Promise.resolve()
        return requiredSubmitGate().promise
    })
}

async function stageOneImage(): Promise<void> {
    await selectFiles([new File(["pixels"], "a.png", { type: "image/png" })])
    const gate = await vi.waitUntil(() => uploadGates[0], { message: "Upload never started" })
    gate.resolve({ url: "https://example.com/a.jpg", storageId: storageId("s1") })
    await expect.poll(() => document.querySelector('[data-slot="image-preview-list"]')?.childElementCount).toBe(1)
}

async function fillRequiredFields(screen: DialogScreen): Promise<void> {
    await screen.getByLabelText("Restaurant name").fill("Trattoria")
    await screen.getByLabelText("Cuisine").fill("Italian")
    await screen.getByLabelText("Location").fill("Luxembourg")
}

function requiredAddKey(index: number): string {
    const call = addMutate.mock.calls[index]
    if (call === undefined) {
        throw new TypeError("Submit attempt missing")
    }
    const key = call[0].clientMutationId
    if (key === undefined) {
        throw new TypeError("Submit attempt has no mutation key")
    }
    return key
}

describe("RestaurantDialog close ownership", () => {
    test("Cancel discards the staged upload and closes", async () => {
        resetUploads()
        const onOpenChange = vi.fn<(open: boolean) => void>()
        const screen = await renderDialog(onOpenChange)
        await stageOneImage()

        // Direct dispatch: the unstyled test env leaves Base UI's inert backdrop
        // above the panel, so Playwright hit-testing cannot reach dialog buttons.
        clickButton(screen.getByRole("button", { name: "Cancel" }))

        await expect
            .poll(() => mutationCalls)
            .toContainEqual({
                fn: "restaurants:cleanupStorage",
                args: { storageId: "s1" },
            })
        await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false)
    })

    test("Escape discards the staged upload and closes", async () => {
        resetUploads()
        const onOpenChange = vi.fn<(open: boolean) => void>()
        const screen = await renderDialog(onOpenChange)
        await stageOneImage()

        screen
            .getByRole("button", { name: "Cancel" })
            .element()
            .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }))

        await expect
            .poll(() => mutationCalls)
            .toContainEqual({
                fn: "restaurants:cleanupStorage",
                args: { storageId: "s1" },
            })
        await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false)
    })

    test("submit hands attached images to persisted ownership without cleanup", async () => {
        resetUploads()
        const onOpenChange = vi.fn<(open: boolean) => void>()
        const screen = await renderDialog(onOpenChange)
        await stageOneImage()

        await fillRequiredFields(screen)
        submitGate = createDeferred<unknown>()
        clickButton(screen.getByRole("button", { name: "Add Restaurant" }))

        await expect.poll(() => addMutate).toHaveBeenCalledTimes(1)
        const submit = await vi.waitUntil(() => submitGate, { message: "Submit never started" })
        submit.resolve(undefined)

        await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false)
        expect(addMutate).toHaveBeenCalledTimes(1)
        expect(mutationCalls.filter((call) => call.fn === "restaurants:cleanupStorage")).toHaveLength(0)
    })

    test("retries a timed-out submit on the same key without duplicating", async () => {
        resetUploads()
        const onOpenChange = vi.fn<(open: boolean) => void>()
        const screen = await renderDialog(onOpenChange)
        await fillRequiredFields(screen)
        submitGate = createDeferred<unknown>()
        clickButton(screen.getByRole("button", { name: "Add Restaurant" }))

        await expect.poll(() => addMutate).toHaveBeenCalledTimes(1)
        const failedSubmit = await vi.waitUntil(() => submitGate, { message: "Submit never started" })
        failedSubmit.reject(new SyncTimeoutError())
        await expect.element(screen.getByText(/may already be saved/)).toBeInTheDocument()
        await expect.element(screen.getByRole("button", { name: "Retry safely" })).toBeInTheDocument()

        submitGate = createDeferred<unknown>()
        clickButton(screen.getByRole("button", { name: "Retry safely" }))

        await expect.poll(() => addMutate).toHaveBeenCalledTimes(2)
        expect(requiredAddKey(1)).toBe(requiredAddKey(0))

        const retrySubmit = await vi.waitUntil(() => submitGate, { message: "Submit never started" })
        retrySubmit.resolve(undefined)

        await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false)
        expect(mutationCalls.filter((call) => call.fn === "restaurants:cleanupStorage")).toHaveLength(0)
    })

    test("rotates the key after a committed submit", async () => {
        resetUploads()
        const onOpenChange = vi.fn<(open: boolean) => void>()
        const screen = await renderDialog(onOpenChange)
        await fillRequiredFields(screen)
        submitGate = createDeferred<unknown>()
        clickButton(screen.getByRole("button", { name: "Add Restaurant" }))

        await expect.poll(() => addMutate).toHaveBeenCalledTimes(1)
        const firstSubmit = await vi.waitUntil(() => submitGate, { message: "Submit never started" })
        firstSubmit.resolve(undefined)

        await expect.poll(() => onOpenChange).toHaveBeenCalledTimes(1)
        const firstKey = requiredAddKey(0)

        await fillRequiredFields(screen)
        submitGate = createDeferred<unknown>()
        clickButton(screen.getByRole("button", { name: "Add Restaurant" }))

        await expect.poll(() => addMutate).toHaveBeenCalledTimes(2)
        expect(requiredAddKey(1)).not.toBe(firstKey)
    })
})
