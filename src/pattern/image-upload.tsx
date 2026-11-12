import { CircleNotchIcon, ImageIcon, UploadIcon, XIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import { type Id } from "@api/data.model"
import { MAX_IMAGES } from "@core/constants"
import {
    extensionForMime,
    formatFileSize,
    isAcceptedImageType,
    processImage,
    MAX_FILE_SIZE,
    IMAGE_ACCEPT,
    IMAGE_TYPE_LABEL,
} from "@core/image.utils"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useDeleteUpload, useUploadImage, type ImageRecord } from "@core/restaurants"
import { LazyImage } from "@pattern/lazy-image"
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
    readonly dataTransfer: Readonly<{ readonly files: FileListLike | null }> | null
}>

type FileInputEvent = Readonly<{
    readonly target: Readonly<{ readonly files: FileListLike | null }>
}>

type ImageUploadProps = {
    readonly images: ReadonlyArray<Readonly<ImageRecord>>
    readonly onImagesChange: (images: ReadonlyArray<Readonly<ImageRecord>>) => void
    readonly disabled?: boolean | undefined
    readonly maxFiles?: number | undefined
    readonly onRemove?: ((storageId: Id<"_storage">) => void) | undefined
    readonly variant?: "gallery" | "avatar" | undefined
    readonly ctaLabel?: string | undefined
    readonly trigger?: ((controls: AvatarTriggerControls) => React.ReactNode) | undefined
}

type AvatarTriggerControls = {
    readonly openPicker: () => void
    readonly isUploading: boolean
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

function prepareFilesList(files: FileListLike, existingCount: number, maxFiles: number): File[] {
    const accepted = Array.from(files).filter((file) => isAcceptedImageType(file.type))
    return accepted.slice(0, Math.max(0, maxFiles - existingCount))
}

function toUploadError(error: unknown): FormError {
    return errorFrom(error, "UploadIcon failed")
}

async function processAndUpload(file: File, uploadImage: (file: File) => Promise<ImageRecord>): Promise<ImageRecord> {
    const processed = await processImage(file)
    const extension = extensionForMime(processed.blob.type)
    const baseName = file.name.replace(/\.[^.]+$/, "")
    const processedFile = new File([processed.blob], baseName + extension, { type: processed.blob.type })
    const uploaded = await uploadImage(processedFile)
    return { ...uploaded, width: processed.width, height: processed.height }
}

type UploadBatchDeps = {
    readonly files: FileListLike
    readonly existingCount: number
    readonly maxFiles: number
    readonly uploadImage: (file: Readonly<File>) => Promise<ImageRecord>
    readonly claimBatch: () => () => boolean
    readonly isMounted: () => boolean
    readonly getLatestImages: () => ReadonlyArray<Readonly<ImageRecord>>
    readonly cleanup: (args: { storageId: Id<"_storage"> }) => Promise<unknown>
    readonly onImagesChange: (images: ReadonlyArray<Readonly<ImageRecord>>) => void
    readonly setUploading: (uploading: boolean) => void
    readonly setUploadError: (error: FormError) => void
}

async function discardStaleUpload(deps: UploadBatchDeps, result: ImageRecord): Promise<void> {
    if (deps.isMounted()) {
        deps.onImagesChange(mergeImages(deps.getLatestImages(), [result]))
        return
    }
    await deps.cleanup({ storageId: result.storageId }).catch((error: unknown) => {
        console.warn("Failed to cleanup cancelled upload:", result.storageId, error)
    })
}

async function publishUpload(
    deps: UploadBatchDeps,
    uploaded: ImageRecord,
    isCurrent: () => boolean,
    published: ImageRecord[],
): Promise<boolean> {
    if (!isCurrent()) {
        await discardStaleUpload(deps, uploaded)
        return false
    }
    published.push(uploaded)
    deps.onImagesChange(mergeImages(deps.getLatestImages(), published))
    return true
}

async function runUploadBatch(deps: UploadBatchDeps): Promise<void> {
    const filesToProcess = prepareFilesList(deps.files, deps.existingCount, deps.maxFiles)
    if (filesToProcess.length === 0) {
        return
    }
    const isCurrent = deps.claimBatch()
    deps.setUploading(true)
    deps.setUploadError(clearError)
    const published: ImageRecord[] = []
    try {
        for (const file of filesToProcess) {
            if (!isCurrent()) {
                break
            }
            const uploaded = await processAndUpload(file, deps.uploadImage)
            if (!(await publishUpload(deps, uploaded, isCurrent, published))) {
                break
            }
        }
    } catch (error) {
        if (isCurrent()) {
            deps.setUploadError(toUploadError(error))
        }
    } finally {
        if (isCurrent()) {
            deps.setUploading(false)
        }
    }
}

export function ImageUpload(props: Readonly<ImageUploadProps>) {
    const uploadImage = useUploadImage()
    const deleteUpload = useDeleteUpload()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<FormError>(clearError)
    const batchRef = useRef(0)
    const mountedRef = useRef(true)
    const latestImagesRef = useRef(props.images)
    useEffect(() => {
        latestImagesRef.current = props.images
    }, [props.images])

    useEffect(() => {
        return () => {
            mountedRef.current = false
            batchRef.current += 1
        }
    }, [])

    const claimBatch = () => {
        const batch = batchRef.current + 1
        batchRef.current = batch
        return () => batchRef.current === batch
    }

    const handleFiles = async (files: FileListLike) => {
        await runUploadBatch({
            files,
            existingCount: props.images.length,
            maxFiles: props.maxFiles ?? MAX_IMAGES,
            uploadImage,
            claimBatch,
            isMounted: () => mountedRef.current,
            getLatestImages: () => latestImagesRef.current,
            cleanup: async (args) => {
                await deleteUpload.mutateAsync(args)
            },
            onImagesChange: props.onImagesChange,
            setUploading: setIsUploading,
            setUploadError,
        })
    }

    return (
        <div className="space-y-4">
            <UploadHeader variant={props.variant} count={props.images.length} maxFiles={props.maxFiles ?? MAX_IMAGES} />

            <ImageGrid
                images={props.images}
                onImagesChange={props.onImagesChange}
                onRemove={props.onRemove}
                disabled={props.disabled ?? false}
            />
            <UploadDropzone
                disabled={props.disabled ?? false}
                isUploading={isUploading}
                canAddMore={props.images.length < (props.maxFiles ?? MAX_IMAGES)}
                variant={props.variant}
                ctaLabel={props.ctaLabel}
                trigger={props.trigger}
                onFiles={(files) => {
                    void handleFiles(files)
                }}
            />

            <UploadStatus variant={props.variant} isUploading={isUploading} uploadError={uploadError} />
        </div>
    )
}

function UploadHeader({
    variant,
    count,
    maxFiles,
}: Readonly<{
    variant: "gallery" | "avatar" | undefined
    count: number
    maxFiles: number
}>) {
    if (variant === "avatar") {
        return null
    }
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Images</span>
            <span className="text-xs text-muted-foreground">
                {count}/{maxFiles}
            </span>
        </div>
    )
}

function UploadStatus({
    variant,
    isUploading,
    uploadError,
}: Readonly<{ variant: "gallery" | "avatar" | undefined; isUploading: boolean; uploadError: FormError }>) {
    return (
        <>
            {variant !== "avatar" && isUploading && (
                <p className="text-center text-sm text-muted-foreground">Uploading…</p>
            )}
            {uploadError.kind === "error" && <p className="text-sm text-destructive">{uploadError.message}</p>}
        </>
    )
}

function ImageGrid({
    images,
    onImagesChange,
    onRemove,
    disabled,
}: Readonly<{
    images: ReadonlyArray<Readonly<ImageRecord>>
    onImagesChange: (images: ReadonlyArray<Readonly<ImageRecord>>) => void
    onRemove: ((storageId: Id<"_storage">) => void) | undefined
    disabled: boolean
}>) {
    const handleRemove = (index: number, image: Readonly<ImageRecord>) => {
        onImagesChange(images.filter((_, i) => i !== index))
        onRemove?.(image.storageId)
    }

    if (images.length === 0) {
        return null
    }
    return (
        <div data-slot="image-preview-list" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((image, index) => (
                <ImagePreview
                    key={image.storageId}
                    imageUrl={image.url}
                    onRemove={() => {
                        handleRemove(index, image)
                    }}
                    disabled={disabled}
                />
            ))}
        </div>
    )
}

function AvatarUploadButton({
    isUploading,
    ctaLabel,
    onClick,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
}: Readonly<{
    isUploading: boolean
    ctaLabel: string | undefined
    onClick: () => void
    onDragEnter: (event: DragStateEvent) => void
    onDragLeave: (event: DragStateEvent) => void
    onDragOver: (event: DragStateEvent) => void
    onDrop: (event: DropEvent) => void
}>) {
    return (
        <button
            type="button"
            onClick={onClick}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            disabled={isUploading}
            className={cx(
                "flex cursor-pointer items-center justify-center gap-2 rounded-control border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-border-strong hover:text-foreground",
                isUploading && "pointer-events-none opacity-70",
            )}
        >
            {isUploading ? (
                <CircleNotchIcon className="size-4 animate-spin" aria-hidden="true" />
            ) : (
                <UploadIcon className="size-4" aria-hidden="true" />
            )}
            <span>{isUploading ? "Uploading…" : (ctaLabel ?? "Change photo")}</span>
        </button>
    )
}

function UploadDropzone({
    disabled,
    isUploading,
    canAddMore,
    variant,
    ctaLabel,
    trigger,
    onFiles,
}: Readonly<{
    disabled: boolean
    isUploading: boolean
    canAddMore: boolean
    variant: "gallery" | "avatar" | undefined
    ctaLabel: string | undefined
    trigger: ((controls: AvatarTriggerControls) => React.ReactNode) | undefined
    onFiles: (files: FileListLike) => void
}>) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    if (!canAddMore || disabled) {
        return null
    }

    const handleDragEnter = (event: DragStateEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (event: DragStateEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (event: DragStateEvent) => {
        event.preventDefault()
        event.stopPropagation()
    }

    const handleDrop = (event: DropEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragging(false)
        const droppedFiles = event.dataTransfer?.files
        if (droppedFiles !== undefined && droppedFiles !== null && droppedFiles.length > 0) {
            onFiles(droppedFiles)
        }
    }

    const handleClick = () => {
        if (isUploading) {
            return
        }
        fileInputRef.current?.click()
    }

    const handleFileInputChange = (event: FileInputEvent) => {
        if (event.target.files !== null) {
            onFiles(event.target.files)
            if (fileInputRef.current !== null) {
                fileInputRef.current.value = ""
            }
        }
    }

    if (variant === "avatar") {
        const openPicker = () => {
            handleClick()
        }
        return (
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
                {trigger !== undefined ? (
                    trigger({ openPicker, isUploading })
                ) : (
                    <AvatarUploadButton
                        isUploading={isUploading}
                        ctaLabel={ctaLabel}
                        onClick={handleClick}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    />
                )}
            </>
        )
    }

    return (
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
                    "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6",
                    isDragging ? "border-primary bg-primary/10" : "border-border hover:border-border-strong",
                    isUploading && "pointer-events-none opacity-50",
                )}
            >
                {isDragging ? (
                    <UploadIcon className="mb-2 size-8 text-primary" />
                ) : (
                    <ImageIcon className="mb-2 size-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                    {isDragging ? "Drop images here" : "Click or drag & drop to upload images"}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                    {IMAGE_TYPE_LABEL} up to {formatFileSize(MAX_FILE_SIZE)}
                </span>
            </button>
        </>
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
        <div className="group relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
            <LazyImage src={imageUrl} alt="Uploaded image preview" ratio={1 / 1} />

            {!disabled && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="hit-area-2 absolute top-1 right-1 rounded-full bg-destructive p-2 text-inverse shadow-md hover:bg-destructive/90"
                    aria-label="Remove image"
                >
                    <XIcon className="size-3" aria-hidden="true" />
                </button>
            )}
        </div>
    )
}
