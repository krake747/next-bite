import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import { unmountDocument } from "./vitest.render"

// Integration and unit tests render the real root route, which mounts
// APIProvider. happy-dom cannot load the Maps script, and the resulting
// errors drown a green run. The stub keeps the tree, not the network.
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
