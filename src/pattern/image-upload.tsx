import ImagePlus from "lucide-react/icons/image-plus"
import Upload from "lucide-react/icons/upload"
import X from "lucide-react/icons/x"
import { useEffect, useRef, useState } from "react"

import { type Id } from "@convex/_generated/dataModel"
import { MAX_IMAGES } from "@core/constants"
import { useCleanupStorage, useUploadImage, useDeleteImage, type ImageRecord } from "@core/hooks"
import {
    extensionForMime,
    formatFileSize,
    isAcceptedImageType,
    processImage,
    MAX_FILE_SIZE,
    IMAGE_ACCEPT,
    IMAGE_TYPE_LABEL,
} from "@core/image-utils"
import { cx } from "@ui/cva.config"

type FileListLike = Readonly<{
    readonly length: number
    readonly [index: number]: Readonly<File>
}>

type DragStateEvent = Readonly<{
    readonly preventDefault: () => void
    readonly stopPropagation: () => void
}>

type DropEvent = Readonly<{
    readonly preventDefault: () => void
    readonly stopPropagation: () => void
    readonly dataTransfer: Readonly<{ readonly files: FileListLike }> | null
}>

type FileInputEvent = Readonly<{
    readonly target: Readonly<{ readonly files: FileListLike | null }>
}>

type ImageUploadProps = {
    readonly images: ReadonlyArray<Readonly<ImageRecord>>
    readonly onImagesChange: (images: ReadonlyArray<Readonly<ImageRecord>>) => void
    readonly disabled?: boolean | undefined
    readonly restaurantId?: Id<"restaurants"> | undefined
    readonly onRemove?: ((storageId: Id<"_storage">) => void) | undefined
}

function mergeImages(
    current: ReadonlyArray<Readonly<ImageRecord>>,
    additions: ReadonlyArray<Readonly<ImageRecord>>,
): Readonly<ImageRecord>[] {
    const known = new Set(current.map((image) => image.storageId))
    const merged: Readonly<ImageRecord>[] = [...current]
    for (const image of additions) {
        if (!known.has(image.storageId)) {
            known.add(image.storageId)
            merged.push(image)
        }
    }
    return merged
}

export function ImageUpload(props: Readonly<ImageUploadProps>) {
    const uploadImage = useUploadImage()
    const cleanupStorage = useCleanupStorage()
    const deleteImage = useDeleteImage()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const batchRef = useRef(0)
    const mountedRef = useRef(true)
    const latestImagesRef = useRef(props.images)
    latestImagesRef.current = props.images

    // A batch is owned by the mount that started it. Closing or unmounting the
    // dialog invalidates in-flight batches. While mounted, a late completion
    // still belongs to the draft and merges into the latest gallery; after
    // unmount it is cleaned up so nothing is stranded.
    useEffect(() => {
        return () => {
            mountedRef.current = false
            batchRef.current += 1
        }
    }, [])

    const handleStaleCompletion = async (result: ImageRecord): Promise<void> => {
        if (mountedRef.current) {
            props.onImagesChange(mergeImages(latestImagesRef.current, [result]))
        } else {
            await cleanupStorage.mutateAsync({ storageId: result.storageId }).catch((error: unknown) => {
                console.warn("Failed to cleanup cancelled upload:", result.storageId, error)
            })
        }
    }

    const handleFiles = async (files: FileListLike) => {
        const fileArray = Array.from(files).filter((f) => isAcceptedImageType(f.type))
        const remainingSlots = MAX_IMAGES - props.images.length
        const filesToProcess = fileArray.slice(0, remainingSlots)
        if (filesToProcess.length === 0) {
            return
        }

        const batch = batchRef.current + 1
        batchRef.current = batch
        const isCurrent = () => batchRef.current === batch

        setIsUploading(true)
        setUploadError(null)

        const newImages: ImageRecord[] = []

        try {
            for (const file of filesToProcess) {
                if (!isCurrent()) {
                    break
                }
                const processed = await processImage(file)
                const extension = extensionForMime(processed.blob.type)
                const baseName = file.name.replace(/\.[^.]+$/, "")
                const processedFileName = baseName + extension
                const processedFile = new File([processed.blob], processedFileName, { type: processed.blob.type })
                const result = await uploadImage(processedFile)
                if (!isCurrent()) {
                    await handleStaleCompletion(result)
                    break
                }
                newImages.push({ url: result.url, storageId: result.storageId })
                props.onImagesChange(mergeImages(latestImagesRef.current, newImages))
            }
        } catch (error) {
            if (isCurrent()) {
                setUploadError(error instanceof Error ? error.message : "Upload failed")
            }
        } finally {
            if (isCurrent()) {
                setIsUploading(false)
            }
        }
    }

    const handleDragEnter = (e: DragStateEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragStateEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: DragStateEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: DropEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const droppedFiles = e.dataTransfer?.files
        if (droppedFiles !== undefined && droppedFiles !== null && droppedFiles.length > 0) {
            void handleFiles(droppedFiles)
        }
    }

    const handleClick = () => {
        if (props.disabled === true || isUploading) {
            return
        }
        fileInputRef.current?.click()
    }

    const handleFileInputChange = (e: FileInputEvent) => {
        if (e.target.files !== null) {
            void handleFiles(e.target.files)
            if (fileInputRef.current !== null) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleRemove = async (index: number, image: Readonly<ImageRecord>) => {
        const originalImages = [...props.images]
        props.onImagesChange(props.images.filter((_, i) => i !== index))

        if (props.restaurantId !== undefined) {
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

    const canAddMore = props.images.length < MAX_IMAGES

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700">Images</span>
                <span className="text-xs text-stone-600">
                    {props.images.length}/{MAX_IMAGES}
                </span>
            </div>

            {props.images.length > 0 && (
                <div data-slot="image-preview-list" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {props.images.map((image, index) => (
                        <ImagePreview
                            key={image.storageId}
                            imageUrl={image.url}
                            onRemove={() => {
                                void handleRemove(index, image)
                            }}
                            disabled={props.disabled ?? false}
                        />
                    ))}
                </div>
            )}

            {canAddMore && props.disabled !== true && (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={IMAGE_ACCEPT}
                        data-slot="image-upload-input"
                        className="hidden"
                        onChange={handleFileInputChange}
                    />
                    <button
                        type="button"
                        onClick={handleClick}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={cx(
                            "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                            isDragging
                                ? "border-tomato-500 bg-tomato-50"
                                : "border-stone-300 hover:border-stone-400 hover:bg-stone-50",
                            isUploading && "pointer-events-none opacity-50",
                        )}
                    >
                        {isDragging ? (
                            <Upload className="mb-2 size-8 text-tomato-500" />
                        ) : (
                            <ImagePlus className="mb-2 size-8 text-stone-400" />
                        )}
                        <span className="text-sm text-stone-600">
                            {isDragging ? "Drop images here" : "Click or drag & drop to upload images"}
                        </span>
                        <span className="mt-1 text-xs text-stone-600">
                            {IMAGE_TYPE_LABEL} up to {formatFileSize(MAX_FILE_SIZE)}
                        </span>
                    </button>
                </>
            )}

            {isUploading && <p className="text-center text-sm text-stone-600">Uploading…</p>}

            {uploadError !== null && uploadError !== "" && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>
    )
}

function ImagePreview({
    imageUrl,
    onRemove,
    disabled,
}: Readonly<{
    imageUrl: string
    onRemove: () => void
    disabled: boolean
}>) {
    return (
        <div className="group relative aspect-square overflow-hidden rounded-lg bg-stone-100">
            <img src={imageUrl} alt="" className="size-full object-cover" loading="lazy" />

            {!disabled && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-inverse opacity-0 shadow-md transition-opacity duration-150 ease group-hover:opacity-100 hover:bg-destructive/90 focus:opacity-100 focus-visible:opacity-100 active:opacity-100 pointer-coarse:opacity-100"
                    aria-label="Remove image"
                >
                    <X className="size-3" />
                </button>
            )}
        </div>
    )
}
