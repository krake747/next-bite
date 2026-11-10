import { QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"

import { ConvexProvider } from "@api/convex.context"
import { createSeededClient } from "@api/db/seeded.client"
import { type Id } from "@convex/_generated/dataModel"

import { AvatarSection } from "../../features/account/profile-card"

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only storage id
const storageId = (value: string): Id<"_storage"> => value as unknown as Id<"_storage">

const updateMutate = vi.fn<() => Promise<unknown>>()

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
    return {
        ...original,
        useUpdateProfile: () => ({ mutateAsync: updateMutate, isPending: false }),
    }
})

vi.mock("@core/restaurants", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/restaurants")>()
    return {
        ...original,
        useUploadImage: () => async () => {
            await Promise.resolve()
            return { url: "https://example.com/a.jpg", storageId: storageId("s9") }
        },
    }
})

async function renderAvatar(avatarUrl: string | undefined, name?: string) {
    const backend = createSeededClient({})
    return render(
        <QueryClientProvider client={backend.queryClient}>
            <ConvexProvider client={backend.client} auth="authenticated">
                <AvatarSection avatarUrl={avatarUrl} name={name} />
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

function resetAvatar(): void {
    updateMutate.mockReset()
    updateMutate.mockResolvedValue(undefined)
}

describe("AvatarSection", () => {
    test("shows the current avatar when set", async () => {
        resetAvatar()
        const screen = await renderAvatar("https://example.com/a.jpg")

        await expect.element(screen.getByRole("img", { name: "Your photo" })).toBeInTheDocument()
    })

    test("uploads a new photo through the user details update", async () => {
        resetAvatar()
        await renderAvatar(undefined)

        await selectFiles([new File(["pixels"], "a.png", { type: "image/png" })])

        await expect.poll(() => updateMutate).toHaveBeenCalledTimes(1)
        expect(updateMutate).toHaveBeenCalledWith({
            avatar: { url: "https://example.com/a.jpg", storageId: "s9" },
        })
    })

    test("shows an error when the update fails", async () => {
        resetAvatar()
        updateMutate.mockRejectedValueOnce(new Error("denied"))
        const screen = await renderAvatar(undefined)

        await selectFiles([new File(["pixels"], "a.png", { type: "image/png" })])

        await expect.element(screen.getByRole("alert")).toBeInTheDocument()
        await expect.element(screen.getByText("denied")).toBeInTheDocument()
    })

    test("renders the avatar itself as the upload trigger instead of gallery chrome", async () => {
        resetAvatar()
        const screen = await renderAvatar("https://example.com/a.jpg")

        await expect.element(screen.getByRole("button", { name: "Change photo" })).toBeInTheDocument()
        await expect.element(screen.getByText("Remove photo")).toBeInTheDocument()
        await expect.element(screen.getByText("Images")).not.toBeInTheDocument()
    })

    test("shows the name initial when no photo is set", async () => {
        resetAvatar()
        const screen = await renderAvatar(undefined, "Alex")

        await expect.element(screen.getByText("A")).toBeInTheDocument()
    })

    test("labels the avatar trigger for first upload without a photo", async () => {
        resetAvatar()
        const screen = await renderAvatar(undefined)

        await expect.element(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument()
    })

    test("removes the photo through the profile update", async () => {
        resetAvatar()
        const screen = await renderAvatar("https://example.com/a.jpg")

        await screen.getByRole("button", { name: "Remove photo" }).click()

        await expect.poll(() => updateMutate).toHaveBeenCalledTimes(1)
        expect(updateMutate).toHaveBeenCalledWith({ removeAvatar: true })
    })
})
