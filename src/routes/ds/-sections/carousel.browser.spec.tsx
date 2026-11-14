import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { CarouselDemo, carouselMeta } from "./carousel"
import { expectSectionMeta } from "./section-spec"

describe("Carousel design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(carouselMeta, {
            importPath: "src/ui/carousel.tsx",
            props: ["opts", "orientation", "setApi", "tone", "size"],
        })
        expect(carouselMeta.id).toBe("carousel")
    })

    test("moves between slides with the arrows", async () => {
        const screen = await render(<CarouselDemo />)
        await expect.element(screen.getByText("First bite")).toBeInTheDocument()
        await screen.getByRole("button", { name: "Next slide" }).click()
        await expect.element(screen.getByText("Second helping")).toBeInTheDocument()
        await screen.getByRole("button", { name: "Previous slide" }).click()
        await expect.element(screen.getByText("First bite")).toBeInTheDocument()
    })
})
