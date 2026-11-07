import { QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { ConvexProvider } from "@api/convex-client"
import { createSeededClient } from "@api/db/seeded-client"
import { type Id } from "@convex/_generated/dataModel"

import { AvatarSection } from "./you"

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only storage id
const storageId = (value: string): Id<"_storage"> => value as unknown as Id<"_storage">

const updateMutate = vi.fn<() => Promise<unknown>>()

vi.mock("@api/auth-client", () => ({
    getConvexSessionToken: async () => {
        await Promise.resolve()
        return "test-token"
    },
}))

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
        useUpdateProfile: () => ({ mutateAsync: updateMutate, isPending: false }),
        useUploadImage: () => async () => {
            await Promise.resolve()
            return { url: "https://example.com/a.jpg", storageId: storageId("s9") }
        },
    }
})

function renderAvatar(avatarUrl: string | undefined): void {
    const backend = createSeededClient({})
    render(
        <QueryClientProvider client={backend.queryClient}>
            <ConvexProvider client={backend.client}>
                <AvatarSection avatarUrl={avatarUrl} />
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

function resetAvatar(): void {
    updateMutate.mockReset()
    updateMutate.mockResolvedValue(undefined)
}

describe("AvatarSection", () => {
    test("shows the current avatar when set", () => {
        resetAvatar()
        renderAvatar("https://example.com/a.jpg")

        expect(screen.getByRole("img")).toBeInTheDocument()
    })

    test("uploads a new photo through the profile update", async () => {
        resetAvatar()
        renderAvatar(undefined)

        selectFiles([new File(["pixels"], "a.png", { type: "image/png" })])

        await waitFor(() => {
            expect(updateMutate).toHaveBeenCalledTimes(1)
        })
        expect(updateMutate).toHaveBeenCalledWith({
            avatar: { url: "https://example.com/a.jpg", storageId: "s9" },
        })
    })

    test("shows an error when the update fails", async () => {
        resetAvatar()
        updateMutate.mockRejectedValueOnce(new Error("denied"))
        renderAvatar(undefined)

        selectFiles([new File(["pixels"], "a.png", { type: "image/png" })])

        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument()
        })
        expect(screen.getByText("denied")).toBeInTheDocument()
    })
})
