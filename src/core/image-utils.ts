export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const THUMBNAIL_WIDTH = 400
export const FULL_SIZE_WIDTH = 1920
export const MAX_IMAGES = 5

export const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export interface ProcessedImage {
    blob: Blob
    originalName: string
    originalSize: number
    processedSize: number
    width: number
    height: number
}

export function validateImageFile(file: File): void {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
        throw new Error(
            `Invalid file type. Must be one of: ${VALID_IMAGE_TYPES.map((t) => t.replace("image/", "")).join(", ")}`,
        )
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }
}

export async function processImage(
    file: File,
    options: { maxWidth?: number; quality?: number } = {},
): Promise<ProcessedImage> {
    validateImageFile(file)

    const { maxWidth = FULL_SIZE_WIDTH, quality = 0.9 } = options

    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)

            const { width, height } = calculateDimensions(img.width, img.height, maxWidth)

            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext("2d")
            if (!ctx) {
                reject(new Error("Failed to get canvas context"))
                return
            }

            ctx.drawImage(img, 0, 0, width, height)

            const outputType = file.type === "image/gif" ? "image/gif" : "image/jpeg"
            const outputQuality = file.type === "image/gif" ? undefined : quality

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Failed to create blob"))
                        return
                    }

                    resolve({
                        blob,
                        originalName: file.name,
                        originalSize: file.size,
                        processedSize: blob.size,
                        width,
                        height,
                    })
                },
                outputType,
                outputQuality,
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Failed to load image"))
        }

        img.src = url
    })
}

export async function createThumbnail(file: File): Promise<ProcessedImage> {
    return processImage(file, { maxWidth: THUMBNAIL_WIDTH, quality: 0.8 })
}

function calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
): { width: number; height: number } {
    if (originalWidth <= maxWidth) {
        return { width: originalWidth, height: originalHeight }
    }

    const ratio = maxWidth / originalWidth
    return {
        width: maxWidth,
        height: Math.round(originalHeight * ratio),
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
