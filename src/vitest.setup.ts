import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import { unmountDocument } from "./vitest.render"

vi.mock("./fonts.css?url", () => ({
    default: "/fonts.css",
}))
vi.mock("./index.css?url", () => ({
    default: "/index.css",
}))

vi.mock("@vis.gl/react-google-maps", () => ({
    APIProvider: ({ children }: Readonly<{ children: React.ReactElement }>): React.ReactElement => children,
    useMapsLibrary: () => null,
    Map: () => null,
    AdvancedMarker: () => null,
}))

afterEach(() => {
    unmountDocument()
    cleanup()
    if (document.head === null) {
        document.documentElement.append(document.createElement("head"))
    }
    if (document.body === null) {
        document.documentElement.append(document.createElement("body"))
    }
})
