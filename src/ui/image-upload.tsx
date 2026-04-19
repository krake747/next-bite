import { For, Show, createSignal } from "solid-js"
import { cx } from "./variants"
import { useUploadImage, useDeleteImage, type ImageRecord } from "../core/hooks"
import { processImage, formatFileSize, MAX_IMAGES, MAX_FILE_SIZE } from "../core/image-utils"
import { createFileUploader, createDropzone, type UploadFile } from "@solid-primitives/upload"
import type { Id } from "../../convex/_generated/dataModel"
import X from "lucide-solid/icons/x"
import ImagePlus from "lucide-solid/icons/image-plus"
import Upload from "lucide-solid/icons/upload"

type ImageUploadProps = {
    images: ImageRecord[]
    onImagesChange: (images: ImageRecord[]) => void
    maxImages?: number
    disabled?: boolean
    restaurantId?: Id<"restaurants">
}

function toFiles(uploadFiles: UploadFile[]): File[] {
    return uploadFiles.filter((f) => f.file.type.startsWith("image/")).map((f) => f.file)
}

export function ImageUpload(props: ImageUploadProps) {
    const maxImages = () => props.maxImages ?? MAX_IMAGES
    const uploadImage = useUploadImage()
    const deleteImage = useDeleteImage()
    const [isUploading, setIsUploading] = createSignal(false)
    const [uploadError, setUploadError] = createSignal<string | null>(null)
    const [isDragging, setIsDragging] = createSignal(false)

    const { selectFiles } = createFileUploader({
        multiple: true,
        accept: "image/jpeg,image/png,image/webp,image/gif",
    })

    const uploadFiles = async (files: File[]) => {
        const remainingSlots = maxImages() - props.images.length
        const filesToProcess = files.slice(0, remainingSlots)
        if (filesToProcess.length === 0) return

        setIsUploading(true)
        setUploadError(null)

        const newImages: ImageRecord[] = []

        try {
            for (const file of filesToProcess) {
                if (file.size > MAX_FILE_SIZE) {
                    throw new Error(`${file.name} is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`)
                }

                const processed = await processImage(file, { maxWidth: 1920, quality: 0.9 })
                const extension =
                    processed.blob.type === "image/webp"
                        ? ".webp"
                        : processed.blob.type === "image/png"
                          ? ".png"
                          : processed.blob.type === "image/gif"
                            ? ".gif"
                            : ".jpg"
                const baseName = file.name.replace(/\.[^.]+$/, "")
                const processedFileName = baseName + extension
                const processedFile = new File([processed.blob], processedFileName, { type: processed.blob.type })
                const result = await uploadImage(processedFile)
                newImages.push({ url: result.url, storageId: result.storageId })
            }

            props.onImagesChange([...props.images, ...newImages])
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const { setRef: dropzoneRef } = createDropzone({
        onDrop: async (files) => {
            await uploadFiles(toFiles(files))
            setIsDragging(false)
        },
        onDragStart: () => {
            setIsDragging(true)
        },
        onDragEnd: () => {
            setIsDragging(false)
        },
    })

    const handleClick = () => {
        if (props.disabled) return
        selectFiles(async (files) => {
            await uploadFiles(toFiles(files))
        })
    }

    const handleRemove = async (index: number, image: ImageRecord) => {
        const originalImages = [...props.images]
        props.onImagesChange(props.images.filter((_, i) => i !== index))

        if (props.restaurantId) {
            try {
                await deleteImage({ restaurantId: props.restaurantId, imageUrl: image.url, storageId: image.storageId })
            } catch (error) {
                props.onImagesChange(originalImages)
                console.error("Failed to delete image:", error)
            }
        }
    }

    const canAddMore = () => props.images.length < maxImages()

    return (
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Images</label>
                <span class="text-xs text-neutral-500">
                    {props.images.length}/{maxImages()}
                </span>
            </div>

            <Show when={props.images.length > 0}>
                <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    <For each={props.images}>
                        {(image, index) => (
                            <ImagePreview
                                imageUrl={image.url}
                                index={index()}
                                onRemove={() => handleRemove(index(), image)}
                                disabled={props.disabled ?? false}
                            />
                        )}
                    </For>
                </div>
            </Show>

            <Show when={canAddMore() && !props.disabled}>
                <div
                    ref={dropzoneRef}
                    onClick={handleClick}
                    class={cx(
                        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all",
                        isDragging()
                            ? "border-flame-pea-500 bg-flame-pea-50 dark:bg-flame-pea-950/20"
                            : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-800",
                        isUploading() && "pointer-events-none opacity-50",
                    )}
                >
                    <Show when={isDragging()} fallback={<ImagePlus class="mb-2 size-8 text-neutral-400" />}>
                        <Upload class="mb-2 size-8 text-flame-pea-500" />
                    </Show>
                    <span class="text-sm text-neutral-600 dark:text-neutral-400">
                        {isDragging() ? "Drop images here" : "Click or drag & drop to upload images"}
                    </span>
                    <span class="mt-1 text-xs text-neutral-500">
                        JPEG, PNG, WebP, GIF up to {formatFileSize(MAX_FILE_SIZE)}
                    </span>
                </div>
            </Show>

            <Show when={isUploading()}>
                <p class="text-center text-sm text-neutral-600 dark:text-neutral-400">Uploading...</p>
            </Show>

            <Show when={uploadError()}>
                {(error) => <p class="text-sm text-red-600 dark:text-red-400">{error()}</p>}
            </Show>
        </div>
    )
}

function ImagePreview(props: { imageUrl: string; index: number; onRemove: () => void; disabled: boolean }) {
    return (
        <div class="group relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <img
                src={props.imageUrl}
                alt={`Image ${props.index + 1}`}
                class="h-full w-full object-cover"
                loading="lazy"
            />

            <Show when={!props.disabled}>
                <button
                    type="button"
                    onClick={props.onRemove}
                    class="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-0 shadow-md transition-opacity duration-150 ease group-hover:opacity-100 hover:bg-red-700 focus:opacity-100 focus-visible:opacity-100 active:opacity-100 pointer-coarse:opacity-100"
                    aria-label="Remove image"
                >
                    <X class="size-3" />
                </button>
            </Show>
        </div>
    )
}
