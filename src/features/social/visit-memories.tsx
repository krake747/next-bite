import { useState } from "react"

import { type Id } from "@convex/_generated/dataModel"
import { useAddVisitMemory, useAuth, useCleanupStorage, useVisitMemories, type ImageRecord } from "@core/hooks"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { ImageUpload } from "@pattern/image-upload"
import { Button } from "@ui/button"

import { PhotoGallery } from "./photo-gallery"

export function VisitMemories({ restaurantId }: Readonly<{ restaurantId: Id<"restaurants"> }>) {
    const auth = useAuth()
    const memories = useVisitMemories(auth.isAuthenticated ? restaurantId : null)
    const addVisitMemory = useAddVisitMemory()
    const cleanupStorage = useCleanupStorage()
    const [staged, setStaged] = useState<ReadonlyArray<ImageRecord>>([])
    const [error, setError] = useState<FormError>(clearError)

    if (!auth.isAuthenticated) {
        return null
    }

    const photos = (memories ?? []).flatMap((memory) =>
        memory.images.map((image) => ({ url: image.url, author: memory.displayName })),
    )

    const handleRemoveStaged = (storageId: Id<"_storage">) => {
        setStaged((current) => current.filter((image) => image.storageId !== storageId))
        void cleanupStorage.mutateAsync({ storageId }).catch(() => {
            // Staged and unattached: a failed cleanup leaves an orphan for the
            // backend sweeps, never a wrong deletion.
        })
    }

    const handleSubmit = async () => {
        if (staged.length === 0 || addVisitMemory.isPending) {
            return
        }
        setError(clearError)
        try {
            // The client claims only location and dimensions. Ownership,
            // display name, MIME type, and byte size are resolved server-side
            // from the upload record, so spoofed identity fields cannot pass.
            await addVisitMemory.mutateAsync({
                restaurantId,
                images: staged.map((image) => ({
                    url: image.url,
                    storageId: image.storageId,
                    ...(image.width !== undefined ? { width: image.width } : {}),
                    ...(image.height !== undefined ? { height: image.height } : {}),
                })),
            })
            setStaged([])
        } catch (err) {
            setError(errorFrom(err, "Could not share this memory"))
        }
    }

    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <h2 className="font-display text-lg font-semibold text-balance text-foreground">Visit memories</h2>
            <div className="pt-3">
                {memories === undefined ? (
                    <p className="text-sm text-muted-foreground">Loading memories…</p>
                ) : (
                    <PhotoGallery photos={photos} />
                )}
            </div>
            <div className="space-y-3 pt-3">
                <ImageUpload
                    images={staged}
                    onImagesChange={(updated) => {
                        setStaged([...updated])
                    }}
                    onRemove={handleRemoveStaged}
                    disabled={addVisitMemory.isPending}
                />
                {error.kind === "error" && (
                    <p role="alert" className="text-sm text-destructive">
                        {error.message}
                    </p>
                )}
                <Button
                    type="button"
                    tone="secondary"
                    disabled={staged.length === 0 || addVisitMemory.isPending}
                    onClick={() => void handleSubmit()}
                >
                    {addVisitMemory.isPending ? "Sharing…" : "Share memory"}
                </Button>
            </div>
        </div>
    )
}
