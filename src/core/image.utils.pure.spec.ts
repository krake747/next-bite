import { describe, test, expect } from "vitest"

import { validateImageFile, formatFileSize, MAX_FILE_SIZE } from "./image.utils"

describe("validateImageFile", () => {
    test.each(["image/jpeg", "image/png", "image/webp", "image/gif"])("accepts %s", (type) => {
        const file = new File([""], "photo", { type })
        expect(() => {
            validateImageFile(file)
        }).not.toThrow()
    })

    test("rejects invalid file types", () => {
        const file = new File([""], "doc.pdf", { type: "application/pdf" })
        expect(() => {
            validateImageFile(file)
        }).toThrow("Invalid file type")
    })

    test("rejects files exceeding max size", () => {
        const large = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], "huge.jpg", { type: "image/jpeg" })
        Object.defineProperty(large, "size", { value: MAX_FILE_SIZE + 1 })
        expect(() => {
            validateImageFile(large)
        }).toThrow("File too large")
    })
})

describe("formatFileSize", () => {
    test("formats bytes", () => {
        expect(formatFileSize(512)).toBe("512 B")
    })

    test("formats kilobytes", () => {
        expect(formatFileSize(1536)).toBe("1.5 KB")
    })

    test("formats megabytes", () => {
        expect(formatFileSize(2_500_000)).toBe("2.4 MB")
    })
})
