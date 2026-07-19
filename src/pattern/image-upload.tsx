import { useState, useRef, type DragEvent } from "react"
import { cx } from "@ui/variants"
import { useUploadImage, useDeleteImage, type ImageRecord } from "@core/hooks"
import { processImage, formatFileSize, MAX_IMAGES, MAX_FILE_SIZE } from "@core/image-utils"
import type { Id } from "@convex/_generated/dataModel"
import X from "lucide-react/icons/x"
import ImagePlus from "lucide-react/icons/image-plus"
import Upload from "lucide-react/icons/upload"

type ImageUploadProps = {
    images: ImageRecord[]
    onImagesChange: (images: ImageRecord[]) => void
    maxImages?: number
    disabled?: boolean
    restaurantId?: Id<"restaurants">
    onRemove?: (storageId: string) => void
}

export function ImageUpload(props: ImageUploadProps) {
    const maxImages = props.maxImages ?? MAX_IMAGES
    const uploadImage = useUploadImage()
    const deleteImage = useDeleteImage()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFiles = async (files: FileList | File[]) => {
        const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"))
        const remainingSlots = maxImages - props.images.length
        const filesToProcess = fileArray.slice(0, remainingSlots)
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

    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        if (e.dataTransfer.files) {
            void handleFiles(e.dataTransfer.files)
        }
    }

    const handleClick = () => {
        if (props.disabled) return
        fileInputRef.current?.click()
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            void handleFiles(e.target.files)
            e.target.value = ""
        }
    }

    const handleRemove = async (index: number, image: ImageRecord) => {
        const originalImages = [...props.images]
        props.onImagesChange(props.images.filter((_, i) => i !== index))

        if (props.restaurantId) {
            try {
                await deleteImage.mutateAsync({
                    restaurantId: props.restaurantId,
                    imageUrl: image.url,
                    storageId: image.storageId,
                })
            } catch (err) {
                props.onImagesChange(originalImages)
                console.error("Failed to delete image:", err)
            }
        } else {
            props.onRemove?.(image.storageId)
        }
    }

    const canAddMore = props.images.length < maxImages

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Images</label>
                <span className="text-xs text-neutral-500">
                    {props.images.length}/{maxImages}
                </span>
            </div>

            {props.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {props.images.map((image, index) => (
                        <ImagePreview
                            key={image.storageId}
                            imageUrl={image.url}
                            index={index}
                            onRemove={() => handleRemove(index, image)}
                            disabled={props.disabled ?? false}
                        />
                    ))}
                </div>
            )}

            {canAddMore && !props.disabled && (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileInputChange}
                    />
                    <div
                        onClick={handleClick}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={cx(
                            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all",
                            isDragging
                                ? "border-flame-pea-500 bg-flame-pea-50 dark:bg-flame-pea-950/20"
                                : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-800",
                            isUploading && "pointer-events-none opacity-50",
                        )}
                    >
                        {isDragging ? (
                            <Upload className="mb-2 size-8 text-flame-pea-500" />
                        ) : (
                            <ImagePlus className="mb-2 size-8 text-neutral-400" />
                        )}
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {isDragging ? "Drop images here" : "Click or drag & drop to upload images"}
                        </span>
                        <span className="mt-1 text-xs text-neutral-500">
                            JPEG, PNG, WebP, GIF up to {formatFileSize(MAX_FILE_SIZE)}
                        </span>
                    </div>
                </>
            )}

            {isUploading && <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">Uploading...</p>}

            {uploadError && <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>}
        </div>
    )
}

function ImagePreview({
    imageUrl,
    index,
    onRemove,
    disabled,
}: {
    imageUrl: string
    index: number
    onRemove: () => void
    disabled: boolean
}) {
    return (
        <div className="group relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <img src={imageUrl} alt={`Image ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />

            {!disabled && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-0 shadow-md transition-opacity duration-150 ease group-hover:opacity-100 hover:bg-red-700 focus:opacity-100 focus-visible:opacity-100 active:opacity-100 pointer-coarse:opacity-100"
                    aria-label="Remove image"
                >
                    <X className="size-3" />
                </button>
            )}
        </div>
    )
}
